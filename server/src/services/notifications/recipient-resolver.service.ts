import { getContactByIdFromDb, ContactRecord } from "../../repositories/contact.repository.js";
import { getUserByAuthId } from "../../repositories/user.repository.js";

export interface ResolvedRecipientDestination {
  isOwner: boolean;
  contact?: ContactRecord;
  destination: string;
  recipientName: string;
}

export async function resolveRecipientDestination(
  authUserId: string,
  channel: string,
  recipientId?: string | null,
): Promise<ResolvedRecipientDestination> {
  if (recipientId) {
    const contact = await getContactByIdFromDb(authUserId, recipientId);
    if (!contact) {
      throw new Error("Contact not found or access denied");
    }

    if (channel === "email") {
      if (!contact.email || contact.email.trim().length === 0) {
        throw new Error(
          `RECIPIENT_CHANNEL_UNAVAILABLE: Contact '${contact.name}' does not have an email address configured.`,
        );
      }
      return {
        isOwner: false,
        contact,
        destination: contact.email.trim(),
        recipientName: contact.name,
      };
    }

    if (channel === "whatsapp") {
      if (!contact.phone_number || contact.phone_number.trim().length === 0) {
        throw new Error(
          `RECIPIENT_CHANNEL_UNAVAILABLE: Contact '${contact.name}' does not have a phone number configured for WhatsApp.`,
        );
      }
      return {
        isOwner: false,
        contact,
        destination: contact.phone_number.trim(),
        recipientName: contact.name,
      };
    }

    if (channel === "telegram") {
      if (!contact.telegram_id || contact.telegram_id.trim().length === 0) {
        throw new Error(
          `RECIPIENT_CHANNEL_UNAVAILABLE: Contact '${contact.name}' does not have a Telegram ID configured.`,
        );
      }
      return {
        isOwner: false,
        contact,
        destination: contact.telegram_id.trim(),
        recipientName: contact.name,
      };
    }

    return {
      isOwner: false,
      contact,
      destination: contact.id,
      recipientName: contact.name,
    };
  }

  // Fallback to Owner destination
  let user: any = null;
  try {
    user = await getUserByAuthId(authUserId);
  } catch {}

  const ownerName = user?.name || "Account Owner";

  if (channel === "email") {
    const email = user?.email || "";
    if (!email) {
      // In test or unconfigured environment, fall back to owner mock email
      return {
        isOwner: true,
        destination: `${authUserId}@calby.app`,
        recipientName: ownerName,
      };
    }
    return {
      isOwner: true,
      destination: email,
      recipientName: ownerName,
    };
  }

  if (channel === "whatsapp") {
    const phone = (user as any)?.phone_number || "";
    if (!phone) {
      throw new Error("RECIPIENT_CHANNEL_UNAVAILABLE: Account owner phone number is not configured.");
    }
    return {
      isOwner: true,
      destination: phone,
      recipientName: ownerName,
    };
  }

  return {
    isOwner: true,
    destination: authUserId,
    recipientName: ownerName,
  };
}
