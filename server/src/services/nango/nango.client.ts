/**
 * Nango REST API client.
 *
 * All calls require NANGO_SECRET_KEY (server-side only).
 * The secret key is NEVER sent to the frontend.
 *
 * Docs: https://docs.nango.dev/reference/api
 */

import type {
  NangoConnection,
  NangoConnectionDetail,
  NangoTokenResponse,
  NangoListConnectionsResponse,
  NangoIntegrationId,
} from "./nango.types.js";

const NANGO_BASE_URL = "https://api.nango.dev";

function getSecretKey(): string {
  const key = process.env.NANGO_SECRET_KEY;
  if (!key) {
    throw new Error("NANGO_SECRET_KEY is not set in environment variables");
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
  };
}

async function nangoRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${NANGO_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(
      `Nango API ${method} ${path} failed (${res.status}): ${errBody}`,
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Get a fresh access token for a user's Nango connection.
 * This is the primary way to get tokens for OAuth-managed providers.
 */
export async function getToken(
  integrationId: NangoIntegrationId,
  connectionId: string,
): Promise<NangoTokenResponse> {
  return nangoRequest<NangoTokenResponse>(
    "GET",
    `/connection/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(integrationId)}`,
  ).then((detail) => {
    // Nango returns full connection detail from this endpoint;
    // extract the credentials as a token response.
    const conn = detail as unknown as NangoConnectionDetail;
    if (!conn.credentials?.access_token) {
      throw new Error(
        `No access token returned from Nango for ${integrationId}/${connectionId}`,
      );
    }
    return {
      access_token: conn.credentials.access_token,
      expires_at: conn.credentials.expires_at,
    };
  });
}

/**
 * Get detailed connection info including credentials.
 */
export async function getConnection(
  integrationId: NangoIntegrationId,
  connectionId: string,
): Promise<NangoConnectionDetail> {
  return nangoRequest<NangoConnectionDetail>(
    "GET",
    `/connection/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(integrationId)}`,
  );
}

/**
 * List all connections or connections for a given connection ID (user).
 */
export async function listConnections(
  connectionId?: string,
): Promise<NangoConnection[]> {
  const response = await nangoRequest<NangoListConnectionsResponse>(
    "GET",
    "/connections",
  );
  const connections = response.connections || [];

  if (!connectionId || connectionId.trim().length === 0) {
    return connections;
  }

  const targetId = connectionId.trim();
  return connections.filter((conn) => {
    return (
      conn.connection_id === targetId ||
      (conn as any).end_user?.id === targetId ||
      (conn as any).tags?.end_user_id === targetId
    );
  });
}

/**
 * Delete (disconnect) a specific Nango connection.
 */
export async function deleteConnection(
  integrationId: NangoIntegrationId,
  connectionId: string,
): Promise<void> {
  await nangoRequest<void>(
    "DELETE",
    `/connection/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(integrationId)}`,
  );
}

/**
 * Proxy a request through Nango to an external API.
 * Nango automatically injects the user's OAuth credentials.
 */
export async function proxyRequest<T = unknown>(options: {
  integrationId: NangoIntegrationId;
  connectionId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  data?: unknown;
  params?: Record<string, string>;
  retries?: number;
}): Promise<T> {
  const {
    integrationId,
    connectionId,
    method,
    endpoint,
    data,
    params,
    retries = 0,
  } = options;

  const queryParams = new URLSearchParams(params || {});
  const queryStr = queryParams.toString();
  const fullEndpoint = queryStr ? `${endpoint}?${queryStr}` : endpoint;

  const url = `${NANGO_BASE_URL}/proxy${fullEndpoint}`;

  const reqHeaders: Record<string, string> = {
    ...headers(),
    "Provider-Config-Key": integrationId,
    "Connection-Id": connectionId,
    "Retries": String(retries),
  };

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(
      `Nango proxy ${method} ${endpoint} failed (${res.status}): ${errBody}`,
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Check if a specific Nango connection exists and is active.
 */
export async function isConnectionActive(
  integrationId: NangoIntegrationId,
  connectionId: string,
): Promise<boolean> {
  try {
    const conn = await getConnection(integrationId, connectionId);
    if (!conn || !conn.credentials) return false;
    const creds = conn.credentials as Record<string, unknown>;
    return Boolean(
      creds.access_token ||
        creds.raw ||
        creds.api_key ||
        Object.keys(creds).length > 0,
    );
  } catch {
    return false;
  }
}

/**
 * Create a Nango Connect Session for OAuth authorization.
 * Returns the hosted Nango connect URL for the user to authorize the provider.
 */
export async function createConnectSession(options: {
  integrationId: NangoIntegrationId;
  connectionId: string;
  returnUrl?: string;
}): Promise<{ connectUrl: string; token?: string }> {
  const body = {
    end_user: {
      id: options.connectionId,
    },
    allowed_integrations: [options.integrationId],
  };

  const response = await nangoRequest<any>("POST", "/connect/sessions", body);
  const token = response?.data?.token || response?.token;
  const connectUrl =
    response?.data?.connect_uri ||
    response?.connect_uri ||
    response?.data?.url ||
    response?.url ||
    (token ? `https://connect.nango.dev/?session_token=${token}` : "");

  return {
    connectUrl,
    token,
  };
}
