/**
 * TypeScript types for the Nango REST API.
 *
 * Only the subset of fields Calby actually uses are defined.
 * Full Nango API reference: https://docs.nango.dev/reference/api
 */

/** Supported Nango integration IDs matching the Nango dashboard config. */
export type NangoIntegrationId =
  | "google-calendar"
  | "google-mail"
  | "google-drive"
  | "google-docs"
  | "google-meet"
  | "notion"
  | "slack"
  | "microsoft-teams"
  | "telegram"
  | "whatsapp-business";

/** Maps Calby-internal provider names to Nango integration IDs. */
export const PROVIDER_TO_NANGO_INTEGRATION: Record<string, NangoIntegrationId> = {
  "google-calendar": "google-calendar",
  "gmail": "google-mail",
  "google-drive": "google-drive",
  "google-docs": "google-docs",
  "google-meet": "google-meet",
  "notion": "notion",
  "slack": "slack",
  "microsoft-teams": "microsoft-teams",
  "telegram": "telegram",
  "whatsapp": "whatsapp-business",
};

/** Providers whose OAuth is managed entirely by Nango. */
export const NANGO_OAUTH_PROVIDERS = new Set<string>([
  "gmail",
  "google-drive",
  "google-docs",
  "google-meet",
  "notion",
  "slack",
  "microsoft-teams",
  "telegram",
]);

export interface NangoConnection {
  id: number;
  connection_id: string;
  provider_config_key: string;
  provider: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface NangoConnectionDetail extends NangoConnection {
  credentials: {
    type: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
    raw?: Record<string, unknown>;
  };
}

export interface NangoTokenResponse {
  access_token: string;
  expires_at?: string;
}

export interface NangoListConnectionsResponse {
  connections: NangoConnection[];
}

export interface NangoProxyResponse<T = unknown> {
  status: number;
  data: T;
  headers?: Record<string, string>;
}

export interface NangoError {
  error: string;
  type?: string;
  payload?: Record<string, unknown>;
}
