import { getRefreshToken } from "@descope/nextjs-sdk/client";
import { apiFetch } from "./api";
import { ConnectionInfo } from "./types";

export async function fetchCalendarConnection(token: string) {
  try {
    const data = await apiFetch<{ integration: GenericIntegrationStatus }>(
      "/api/integrations/google-calendar/status",
      { token },
    );

    return {
      label: "Google Calendar",
      status: data.integration.status === "connected" ? "connected" : "disconnected",
      email: data.integration.email,
    } as ConnectionInfo;
  } catch {
    return {
      label: "Google Calendar",
      status: "disconnected",
    } as ConnectionInfo;
  }
}

export async function connectCalendar(token: string) {
  const result = await connectIntegrationApi(token, "google-calendar");
  if (result.url) {
    const width = 600;
    const height = 720;
    const left = typeof window !== "undefined" ? window.screenX + (window.innerWidth - width) / 2 : 0;
    const top = typeof window !== "undefined" ? window.screenY + (window.innerHeight - height) / 2 : 0;

    const popup = typeof window !== "undefined"
      ? window.open(
          result.url,
          "CalbyNangoConnect",
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`,
        )
      : null;

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      if (typeof window !== "undefined") window.location.href = result.url;
      return;
    }

    const checkTimer = setInterval(async () => {
      if (popup.closed) {
        clearInterval(checkTimer);
        try {
          await callbackIntegrationApi(token, "google-calendar");
        } catch {}
      }
    }, 1000);
  }
}

export async function refreshCalendarConnection(token: string) {
  await apiFetch("/api/integrations", {
    token,
  });
}

export async function createTelegramIntentApi(token: string) {
  return apiFetch<{ token: string; botUrl: string; expiresAt: string }>(
    "/api/connections/telegram/intent",
    { method: "POST", token },
  );
}

export async function fetchTelegramStatusApi(token: string) {
  return apiFetch<{
    connection: {
      connected: boolean;
      status: "connected" | "disconnected" | "pending";
      chatId?: string | null;
      username?: string | null;
    };
  }>("/api/connections/telegram/status", { token });
}

export async function disconnectTelegramApi(token: string) {
  return apiFetch<{ success: boolean }>("/api/connections/telegram/disconnect", {
    method: "POST",
    token,
  });
}

export async function configureWhatsAppApi(
  token: string,
  body: {
    phoneNumberId: string;
    accessToken: string;
    businessAccountId?: string;
    displayPhoneNumber?: string;
  },
) {
  return apiFetch<{
    success: boolean;
    connection: {
      connected: boolean;
      status: "connected" | "disconnected" | "error";
      phoneNumberId?: string | null;
      displayPhoneNumber?: string | null;
      businessAccountId?: string | null;
    };
  }>("/api/connections/whatsapp/configure", {
    method: "POST",
    token,
    body,
  });
}

export async function fetchWhatsAppStatusApi(token: string) {
  return apiFetch<{
    connection: {
      connected: boolean;
      status: "connected" | "disconnected" | "error";
      phoneNumberId?: string | null;
      displayPhoneNumber?: string | null;
      businessAccountId?: string | null;
    };
  }>("/api/connections/whatsapp/status", { token });
}

export async function disconnectWhatsAppApi(token: string) {
  return apiFetch<{ success: boolean }>("/api/connections/whatsapp/disconnect", {
    method: "DELETE",
    token,
  });
}

export async function fetchGoogleAuthUrlApi(token: string) {
  return apiFetch<{ url: string }>("/api/connections/google/auth-url", { token });
}

export async function fetchGmailStatusApi(token: string) {
  return apiFetch<{
    connection: {
      connected: boolean;
      email?: string;
      scopes?: string[];
    };
  }>("/api/connections/gmail/status", { token });
}

export async function disconnectGmailApi(token: string) {
  return apiFetch<{ success: boolean }>("/api/connections/gmail/disconnect", {
    method: "DELETE",
    token,
  });
}

// ---------------------------------------------------------------------------
// Generic Nango-backed Integrations API
// ---------------------------------------------------------------------------

export interface GenericIntegrationStatus {
  provider: string;
  status: "connected" | "disconnected" | "error" | "pending";
  label: string;
  capabilities: string[];
  connectedAt?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export async function fetchAllIntegrationsApi(token: string) {
  return apiFetch<{ integrations: GenericIntegrationStatus[] }>("/api/integrations", {
    token,
  });
}

export async function fetchIntegrationStatusApi(token: string, provider: string) {
  return apiFetch<{ integration: GenericIntegrationStatus }>(
    `/api/integrations/${encodeURIComponent(provider)}/status`,
    { token },
  );
}

export async function connectIntegrationApi(token: string, provider: string) {
  return apiFetch<{
    method: string;
    provider: string;
    url?: string;
    nangoConnectionId?: string;
    message?: string;
  }>(`/api/integrations/${encodeURIComponent(provider)}/connect`, {
    method: "POST",
    token,
  });
}

export async function callbackIntegrationApi(
  token: string,
  provider: string,
  body?: { nangoConnectionId?: string },
) {
  return apiFetch<{ success: boolean; integration: GenericIntegrationStatus }>(
    `/api/integrations/${encodeURIComponent(provider)}/callback`,
    {
      method: "POST",
      token,
      body,
    },
  );
}

export async function disconnectIntegrationApi(token: string, provider: string) {
  return apiFetch<{ success: boolean; integration: GenericIntegrationStatus }>(
    `/api/integrations/${encodeURIComponent(provider)}/disconnect`,
    {
      method: "POST",
      token,
    },
  );
}

