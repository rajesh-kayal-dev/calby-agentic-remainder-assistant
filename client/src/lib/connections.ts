import { getRefreshToken } from "@descope/nextjs-sdk/client";
import { apiFetch } from "./api";
import { ConnectionInfo } from "./types";

export async function fetchCalendarConnection(token: string) {
  const data = await apiFetch<{ connection: ConnectionInfo }>(
    "/api/connections",
    { token },
  );

  return data.connection;
}

export async function connectCalendar(token: string) {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("refreshToken invalid");

  const result = await apiFetch<{ url: string }>("/api/connections/connect", {
    method: "POST",
    token,
    body: {
      redirectUrl: `${window.location.origin}/dashboard`,
      refreshToken,
    },
  });

  window.location.href = result.url;
}

export async function refreshCalendarConnection(token: string) {
  await apiFetch("/api/connections/refresh-status", {
    method: "POST",
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
