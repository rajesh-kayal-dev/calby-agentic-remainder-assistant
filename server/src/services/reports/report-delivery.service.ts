/**
 * report-delivery.service.ts
 *
 * Orchestrates report generation + channel dispatch for the report.send tool.
 *
 * Security guarantees:
 * - authUserId ALWAYS comes from the authenticated session, never from LLM input.
 * - Recipient email/phone/chatId is ALWAYS resolved server-side from contacts DB.
 * - LLM may only provide: contactName (string), channel (string), report parameters.
 * - No provider credentials, tokens, or raw addresses flow through this service from the LLM.
 */

import crypto from "crypto";
import { generateReport } from "./report-engine.service.js";
import { renderReportEmail } from "./renderers/report-email-renderer.js";
import { renderReportWhatsApp } from "./renderers/report-whatsapp-renderer.js";
import { renderReportTelegram } from "./renderers/report-telegram-renderer.js";
import { renderReportSummaryLine } from "./report-renderer.service.js";
import type { Report, ReportType, DateRangePreset } from "./report.types.js";

import { getGmailConnectionStatus } from "../google-oauth.service.js";
import { getWhatsAppConnectionStatus } from "../notifications/whatsapp-connection.service.js";
import { getUserTelegramConnection } from "../notifications/telegram-connection.service.js";
import { defaultChannelRegistry } from "../notifications/channel-registry.js";
import { resolveRecipientDestination } from "../notifications/recipient-resolver.service.js";
import {
  createNotificationDeliveryInDb,
  updateNotificationDeliveryInDb,
} from "../../repositories/reminder.repository.js";
import {
  findContactsByNameFromDb,
  getContactByIdFromDb,
} from "../../repositories/contact.repository.js";
import { getUserByAuthId } from "../../repositories/user.repository.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DeliveryChannel = "gmail" | "whatsapp" | "telegram" | "in_app";

export interface ReportDeliveryParams {
  authUserId: string;
  type: ReportType;
  dateRangePreset?: DateRangePreset;
  customStartAt?: string;
  customEndAt?: string;
  contactId?: string;      // resolved server-side, not from LLM directly
  channel?: DeliveryChannel;
}

/** Returned when the channel is not connected */
export interface ConnectionRequiredResult {
  status: "CONNECTION_REQUIRED";
  channel: string;
  message: string;
}

/** Returned when multiple channels are available and none was specified */
export interface AmbiguousChannelResult {
  status: "AMBIGUOUS_CHANNEL";
  availableChannels: Array<{ id: string; name: string }>;
  message: string;
}

/** Returned when recipient doesn't have the channel's contact info */
export interface RecipientChannelUnavailableResult {
  status: "RECIPIENT_CHANNEL_UNAVAILABLE";
  channel: string;
  recipientName: string;
  message: string;
}

/** Ready to confirm */
export interface ConfirmationRequiredResult {
  status: "CONFIRMATION_REQUIRED";
  report: Report;
  summaryLine: string;
  channel: string;
  channelName: string;
  recipientName: string;
  recipientIsOwner: boolean;
  message: string;
}

/** Delivery succeeded */
export interface DeliverySuccessResult {
  status: "SUCCESS";
  channel: string;
  channelName: string;
  recipientName: string;
  deliveryId: string;
  message: string;
}

/** Delivery failed at provider */
export interface DeliveryFailedResult {
  status: "DELIVERY_FAILED";
  channel: string;
  recipientName: string;
  message: string;
}

export type ReportDeliveryResult =
  | ConnectionRequiredResult
  | AmbiguousChannelResult
  | RecipientChannelUnavailableResult
  | ConfirmationRequiredResult
  | DeliverySuccessResult
  | DeliveryFailedResult;

const CHANNEL_NAMES: Record<string, string> = {
  gmail:    "Gmail",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  in_app:   "In-App",
};

// ─────────────────────────────────────────────────────────────────────────────
// Connection checks — server-side only, no credentials returned
// ─────────────────────────────────────────────────────────────────────────────

export async function checkChannelConnection(
  authUserId: string,
  channel: DeliveryChannel,
): Promise<boolean> {
  try {
    if (channel === "gmail") {
      const status = await getGmailConnectionStatus(authUserId);
      return status.connected;
    }
    if (channel === "whatsapp") {
      const status = await getWhatsAppConnectionStatus(authUserId);
      return status.connected;
    }
    if (channel === "telegram") {
      const info = await getUserTelegramConnection(authUserId);
      return info.connected && Boolean(info.chatId);
    }
    if (channel === "in_app") {
      return true; // always available
    }
    return false;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel resolution — picks best channel or returns ambiguity/error
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveDeliveryChannel(
  authUserId: string,
  contactId: string | undefined,
  requestedChannel?: DeliveryChannel,
): Promise<
  | { resolved: true; channel: DeliveryChannel; channelName: string }
  | ConnectionRequiredResult
  | AmbiguousChannelResult
  | RecipientChannelUnavailableResult
> {
  const ALL_EXTERNAL: DeliveryChannel[] = ["gmail", "whatsapp", "telegram"];

  if (requestedChannel) {
    // 1. Check provider connection
    const connected = await checkChannelConnection(authUserId, requestedChannel);
    if (!connected && requestedChannel !== "in_app") {
      return {
        status: "CONNECTION_REQUIRED",
        channel: requestedChannel,
        message: `${CHANNEL_NAMES[requestedChannel] ?? requestedChannel} is not connected. Please connect it in Calby Settings.`,
      };
    }

    // 2. Check recipient has contact info for that channel (if sending to contact)
    if (contactId) {
      try {
        await resolveRecipientDestination(authUserId, requestedChannel, contactId);
      } catch (err: any) {
        const msg = err?.message ?? "";
        if (msg.includes("RECIPIENT_CHANNEL_UNAVAILABLE")) {
          const contact = await getContactByIdFromDb(authUserId, contactId);
          return {
            status: "RECIPIENT_CHANNEL_UNAVAILABLE",
            channel: requestedChannel,
            recipientName: contact?.name ?? "the contact",
            message: msg.replace("RECIPIENT_CHANNEL_UNAVAILABLE: ", ""),
          };
        }
        // Fallback for other errors (e.g. contact not found/access denied)
        return {
          status: "RECIPIENT_CHANNEL_UNAVAILABLE",
          channel: requestedChannel,
          recipientName: "the contact",
          message: "Contact not found or access denied.",
        };
      }
    }

    return { resolved: true, channel: requestedChannel, channelName: CHANNEL_NAMES[requestedChannel] ?? requestedChannel };
  }

  // No channel specified — find valid ones
  const valid: DeliveryChannel[] = [];
  for (const ch of ALL_EXTERNAL) {
    const connected = await checkChannelConnection(authUserId, ch);
    if (!connected) continue;

    if (contactId) {
      try {
        await resolveRecipientDestination(authUserId, ch, contactId);
        valid.push(ch);
      } catch {
        // contact doesn't have info for this channel — skip it silently
      }
    } else {
      valid.push(ch);
    }
  }

  if (valid.length === 0) {
    return {
      status: "CONNECTION_REQUIRED",
      channel: "none",
      message: "No external channels are connected. Please connect Gmail, WhatsApp, or Telegram in Calby Settings.",
    };
  }

  if (valid.length === 1) {
    return { resolved: true, channel: valid[0], channelName: CHANNEL_NAMES[valid[0]] ?? valid[0] };
  }
  return {
    status: "AMBIGUOUS_CHANNEL",
    availableChannels: valid.map((id) => ({ id, name: CHANNEL_NAMES[id] ?? id })),
    message: `Multiple channels are available: ${valid.map((c) => CHANNEL_NAMES[c]).join(", ")}. Which one would you like to use?`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prepare — generates report + resolves recipient/channel, NO delivery
// ─────────────────────────────────────────────────────────────────────────────

export async function prepareReportDelivery(
  params: ReportDeliveryParams,
): Promise<ReportDeliveryResult> {
  const { authUserId, type, dateRangePreset, customStartAt, customEndAt, contactId, channel } = params;

  // 1. Validate contact if provided
  let recipientName = "You";
  let recipientIsOwner = true;
  if (contactId) {
    const contact = await getContactByIdFromDb(authUserId, contactId);
    if (!contact) {
      return {
        status: "DELIVERY_FAILED",
        channel: channel || "unknown",
        recipientName: "Unknown",
        message: "Contact not found.",
      };
    }
    recipientName = contact.name;
    recipientIsOwner = false;
  } else {
    try {
      const user = await getUserByAuthId(authUserId);
      recipientName = (user as any)?.name || "You";
    } catch {}
  }

  // 2. Resolve channel
  const channelResult = await resolveDeliveryChannel(authUserId, contactId, channel);
  if (!("resolved" in channelResult)) {
    return channelResult; // CONNECTION_REQUIRED | AMBIGUOUS_CHANNEL | RECIPIENT_CHANNEL_UNAVAILABLE
  }
  const resolvedChannel = channelResult.channel;
  const channelName = channelResult.channelName;

  // 3. Generate report (Report Engine is the sole source of truth)
  const report = await generateReport({
    type,
    authUserId,
    contactId,
    dateRangePreset,
    customStartAt,
    customEndAt,
  });

  const summaryLine = renderReportSummaryLine(report);

  return {
    status: "CONFIRMATION_REQUIRED",
    report,
    summaryLine,
    channel: resolvedChannel,
    channelName,
    recipientName,
    recipientIsOwner,
    message: `${summaryLine} Send this to ${recipientIsOwner ? "you" : recipientName} via ${channelName}?`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute — performs actual delivery after user confirmation
// ─────────────────────────────────────────────────────────────────────────────

export async function executeReportDelivery(
  params: ReportDeliveryParams & { report: Report; recipientName: string; recipientIsOwner: boolean },
): Promise<DeliverySuccessResult | DeliveryFailedResult> {
  const {
    authUserId,
    type,
    dateRangePreset,
    contactId,
    channel,
    report,
    recipientName,
    recipientIsOwner,
  } = params;

  if (!channel) {
    return {
      status: "DELIVERY_FAILED",
      channel: "unknown",
      recipientName,
      message: "No channel specified for delivery.",
    };
  }

  // 1. Create delivery record in notification_deliveries
  const deliveryId = crypto.randomUUID();
  let deliveryRow: any = null;
  try {
    deliveryRow = await createNotificationDeliveryInDb({
      authUserId,
      channel,
      status: "pending",
      scheduledAt: new Date(),
      metadata: {
        source: "report_delivery",
        reportType: type,
        dateRangePreset: dateRangePreset ?? null,
        contactId: contactId ?? null,
        recipientName,
        channel,
      },
    });
  } catch {
    // If the INSERT fails due to conflict or other reason, generate a fallback ID
  }

  const usedDeliveryId = deliveryRow?.id ?? deliveryId;

  // 2. Build channel-appropriate content
  let title = `Calby Report: ${report.metadata.title}`;
  let message: string;

  if (channel === "gmail") {
    const emailContent = renderReportEmail(report, recipientName);
    // Gmail channel reads title+message+html from payload.metadata
    title = emailContent.subject;
    message = emailContent.text;

    const channelImpl = defaultChannelRegistry.getChannel("gmail");
    if (!channelImpl) {
      await safeUpdateDelivery(usedDeliveryId, "failed", "Gmail channel not registered");
      return { status: "DELIVERY_FAILED", channel, recipientName, message: "Gmail channel is not available." };
    }

    const result = await channelImpl.send({
      deliveryId: usedDeliveryId,
      authUserId,
      title,
      message,
      metadata: {
        recipientId: contactId ?? null,
        htmlBody: emailContent.html,
        source: "report_delivery",
        reportType: type,
      },
    });

    if (!result.success) {
      const errMsg = sanitizeErrorMessage(result.errorMessage);
      await safeUpdateDelivery(usedDeliveryId, "failed", errMsg);
      return { status: "DELIVERY_FAILED", channel, recipientName, message: errMsg };
    }

    await safeUpdateDelivery(usedDeliveryId, "sent");
    return {
      status: "SUCCESS",
      channel,
      channelName: "Gmail",
      recipientName,
      deliveryId: usedDeliveryId,
      message: `Report sent to ${recipientIsOwner ? "you" : recipientName} via Gmail.`,
    };
  }

  if (channel === "whatsapp") {
    message = renderReportWhatsApp(report, recipientName);

    const channelImpl = defaultChannelRegistry.getChannel("whatsapp");
    if (!channelImpl) {
      await safeUpdateDelivery(usedDeliveryId, "failed", "WhatsApp channel not registered");
      return { status: "DELIVERY_FAILED", channel, recipientName, message: "WhatsApp channel is not available." };
    }

    // Resolve recipient phone server-side
    let recipientPhoneNumber: string | undefined;
    if (!recipientIsOwner && contactId) {
      try {
        const dest = await resolveRecipientDestination(authUserId, "whatsapp", contactId);
        recipientPhoneNumber = dest.destination;
      } catch (err: any) {
        const errMsg = sanitizeErrorMessage(err?.message);
        await safeUpdateDelivery(usedDeliveryId, "failed", errMsg);
        return { status: "DELIVERY_FAILED", channel, recipientName, message: errMsg };
      }
    }

    const result = await channelImpl.send({
      deliveryId: usedDeliveryId,
      authUserId,
      title,
      message,
      metadata: {
        recipientId: contactId ?? null,
        recipientPhoneNumber: recipientPhoneNumber ?? null,
        source: "report_delivery",
        reportType: type,
      },
    });

    if (!result.success) {
      const errMsg = sanitizeErrorMessage(result.errorMessage);
      await safeUpdateDelivery(usedDeliveryId, "failed", errMsg);
      return { status: "DELIVERY_FAILED", channel, recipientName, message: errMsg };
    }

    await safeUpdateDelivery(usedDeliveryId, "sent");
    return {
      status: "SUCCESS",
      channel,
      channelName: "WhatsApp",
      recipientName,
      deliveryId: usedDeliveryId,
      message: `Report sent to ${recipientIsOwner ? "you" : recipientName} via WhatsApp.`,
    };
  }

  if (channel === "telegram") {
    message = renderReportTelegram(report, recipientName);

    const channelImpl = defaultChannelRegistry.getChannel("telegram");
    if (!channelImpl) {
      await safeUpdateDelivery(usedDeliveryId, "failed", "Telegram channel not registered");
      return { status: "DELIVERY_FAILED", channel, recipientName, message: "Telegram channel is not available." };
    }

    const result = await channelImpl.send({
      deliveryId: usedDeliveryId,
      authUserId,
      title,
      message,
      metadata: {
        source: "report_delivery",
        reportType: type,
      },
    });

    if (!result.success) {
      const errMsg = sanitizeErrorMessage(result.errorMessage);
      await safeUpdateDelivery(usedDeliveryId, "failed", errMsg);
      return { status: "DELIVERY_FAILED", channel, recipientName, message: errMsg };
    }

    await safeUpdateDelivery(usedDeliveryId, "sent");
    return {
      status: "SUCCESS",
      channel,
      channelName: "Telegram",
      recipientName,
      deliveryId: usedDeliveryId,
      message: `Report sent to ${recipientIsOwner ? "you" : recipientName} via Telegram.`,
    };
  }

  if (channel === "in_app") {
    message = `Report: ${report.metadata.title}${report.metadata.dateRange ? ` (${report.metadata.dateRange.label})` : ""}`;

    const channelImpl = defaultChannelRegistry.getChannel("in_app");
    if (!channelImpl) {
      await safeUpdateDelivery(usedDeliveryId, "failed", "In-App channel not registered");
      return { status: "DELIVERY_FAILED", channel, recipientName, message: "In-App channel is not available." };
    }

    const result = await channelImpl.send({
      deliveryId: usedDeliveryId,
      authUserId,
      title,
      message,
      metadata: { source: "report_delivery", reportType: type },
    });

    if (!result.success) {
      const errMsg = sanitizeErrorMessage(result.errorMessage);
      await safeUpdateDelivery(usedDeliveryId, "failed", errMsg);
      return { status: "DELIVERY_FAILED", channel, recipientName, message: errMsg };
    }

    await safeUpdateDelivery(usedDeliveryId, "sent");
    return {
      status: "SUCCESS",
      channel,
      channelName: "In-App",
      recipientName,
      deliveryId: usedDeliveryId,
      message: `Report delivered as an in-app notification.`,
    };
  }

  return {
    status: "DELIVERY_FAILED",
    channel: channel ?? "unknown",
    recipientName,
    message: `Unsupported channel: ${channel}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function safeUpdateDelivery(
  deliveryId: string,
  status: "sent" | "failed",
  errorMessage?: string,
): Promise<void> {
  try {
    await updateNotificationDeliveryInDb(deliveryId, {
      status,
      deliveredAt: status === "sent" ? new Date() : undefined,
      errorMessage,
    });
  } catch {}
}

/**
 * Strips provider tokens, credentials, and internal stack traces
 * from error messages before returning them to the LLM / frontend.
 */
function sanitizeErrorMessage(msg?: string | null): string {
  if (!msg) return "Delivery failed.";

  // Remove anything that looks like a bearer token
  let clean = msg.replace(/Bearer\s+[A-Za-z0-9\-_=.]+/gi, "[token]");
  // Remove anything that looks like an API key
  clean = clean.replace(/key=[A-Za-z0-9\-_=.]+/gi, "key=[redacted]");
  // Trim to 200 chars so stack traces don't leak
  if (clean.length > 200) clean = clean.slice(0, 200) + "…";
  return clean;
}
