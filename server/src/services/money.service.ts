import { getPool } from "../db/pool.js";
import { getContact, findContactsByName, createContact } from "./contact.service.js";
import { cancelReminder, createReminder } from "./reminder.service.js";
import {
  LedgerItem,
  LedgerDirection,
  LedgerStatus,
  PaymentTransaction,
  ContactBalance,
  UserLedgerSummary,
  createLedgerItemInDb,
  updateLedgerItemInDb,
  getLedgerItemFromDb,
  listLedgerItemsFromDb,
  createPaymentInDb,
  listPaymentsForLedgerItemFromDb,
  getContactBalanceFromDb,
  getUserLedgerSummaryFromDb,
  deleteLedgerItemFromDb,
  reopenLedgerItemInDb,
} from "../repositories/money.repository.js";

export async function createLedgerItem(
  authUserId: string,
  input: {
    contactId?: string | null;
    personName?: string | null;
    direction: LedgerDirection;
    amount: number;
    currency?: string;
    title: string;
    description?: string | null;
    taskId?: string | null;
    reminderId?: string | null;
    reminderAt?: Date | null;
    dueAt?: Date | null;
    notes?: string | null;
  },
): Promise<LedgerItem> {
  let resolvedContactId = input.contactId || null;

  if (!resolvedContactId && input.personName?.trim()) {
    const existing = await findContactsByName(authUserId, input.personName.trim());
    if (existing.length > 0) {
      resolvedContactId = existing[0].id;
    } else {
      const created = await createContact(authUserId, {
        name: input.personName.trim(),
        notes: "Added via Money Ledger",
      });
      resolvedContactId = created.id;
    }
  }

  if (!resolvedContactId) {
    throw new Error("Contact is required for money ledger items");
  }

  const contact = await getContact(authUserId, resolvedContactId);
  if (!contact) {
    throw new Error("Contact not found or access denied");
  }

  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Title is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  let finalReminderId = input.reminderId || null;
  if (!finalReminderId && input.reminderAt) {
    try {
      const rem = await createReminder({
        authUserId,
        title: `Money Reminder: ${input.title} (${contact.name})`,
        dueAt: input.reminderAt,
      });
      finalReminderId = rem.id;
    } catch (err) {
      console.warn("Failed to create linked reminder for money ledger:", err);
    }
  }

  return createLedgerItemInDb(authUserId, {
    ...input,
    contactId: resolvedContactId,
    reminderId: finalReminderId,
  });
}

export async function getUserLedgerSummary(
  authUserId: string,
): Promise<UserLedgerSummary> {
  return getUserLedgerSummaryFromDb(authUserId);
}

export async function deleteLedgerItem(
  authUserId: string,
  id: string,
): Promise<boolean> {
  const existing = await getLedgerItemFromDb(authUserId, id);
  if (!existing) {
    throw new Error("Ledger item not found or access denied");
  }

  if (existing.reminder_id) {
    try {
      await cancelReminder(authUserId, existing.reminder_id);
    } catch {}
  }

  return deleteLedgerItemFromDb(authUserId, id);
}

export async function reopenLedgerItem(
  authUserId: string,
  id: string,
): Promise<LedgerItem> {
  const existing = await getLedgerItemFromDb(authUserId, id);
  if (!existing) {
    throw new Error("Ledger item not found or access denied");
  }

  const reopened = await reopenLedgerItemInDb(authUserId, id);
  if (!reopened) {
    throw new Error("Failed to reopen ledger item");
  }
  return reopened;
}

export async function updateLedgerItem(
  authUserId: string,
  id: string,
  updates: {
    title?: string;
    amount?: number;
    direction?: LedgerDirection;
    dueAt?: Date | null;
    notes?: string | null;
    contactId?: string | null;
    status?: LedgerStatus;
  },
): Promise<LedgerItem> {
  const existing = await getLedgerItemFromDb(authUserId, id);
  if (!existing) {
    throw new Error("Ledger item not found or access denied");
  }

  const updated = await updateLedgerItemInDb(authUserId, id, updates);
  if (!updated) {
    throw new Error("Failed to update ledger item");
  }
  return updated;
}

export async function getLedgerItem(
  authUserId: string,
  id: string,
): Promise<LedgerItem | null> {
  return getLedgerItemFromDb(authUserId, id);
}

export async function listLedgerItems(
  authUserId: string,
  filters: {
    status?: LedgerStatus;
    direction?: LedgerDirection;
    contactId?: string;
    search?: string;
  },
): Promise<LedgerItem[]> {
  return listLedgerItemsFromDb(authUserId, filters);
}

export async function recordPayment(
  authUserId: string,
  ledgerItemId: string,
  input: {
    amount: number;
    currency: string;
    notes?: string | null;
    paidAt?: Date;
  },
): Promise<{ payment: PaymentTransaction; ledgerItem: LedgerItem }> {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be positive");
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    // Lock the ledger item row for update to ensure concurrency safety
    const lockRes = await client.query(
      `
      SELECT * FROM ledger_items
      WHERE id = $1 AND auth_user_id = $2
      FOR UPDATE
      `,
      [ledgerItemId, authUserId],
    );

    const ledger = lockRes.rows[0] as LedgerItem;
    if (!ledger) {
      throw new Error("Ledger item not found or access denied");
    }

    if (ledger.status === "cancelled") {
      throw new Error("Cannot record payment on a cancelled ledger item");
    }

    if (ledger.status === "paid") {
      throw new Error("Ledger item is already fully paid");
    }

    // Ensure payment does not exceed remaining amount
    const remaining = Number(ledger.remaining_amount);
    const paymentAmount = Number(input.amount);

    if (paymentAmount > remaining) {
      throw new Error(
        `Payment amount (${paymentAmount}) exceeds remaining balance (${remaining})`,
      );
    }

    // Create payment transaction record
    const payment = await createPaymentInDb(
      authUserId,
      {
        ledgerItemId,
        amount: paymentAmount,
        currency: input.currency,
        notes: input.notes,
        paidAt: input.paidAt,
      },
      client,
    );

    const newRemaining = remaining - paymentAmount;
    let newStatus: LedgerStatus = "partially_paid";
    let paidAt: Date | null = null;

    if (newRemaining === 0) {
      newStatus = "paid";
      paidAt = input.paidAt || new Date();
    }

    // Update parent ledger item status and remaining balance
    const updatedLedger = await updateLedgerItemInDb(
      authUserId,
      ledgerItemId,
      {
        status: newStatus,
        remaining_amount: newRemaining,
        paid_at: paidAt,
      },
      client,
    );

    if (!updatedLedger) {
      throw new Error("Failed to update ledger balance");
    }

    await client.query("COMMIT");

    // Post-commit action: if fully paid, cancel any linked reminders
    if (newStatus === "paid" && updatedLedger.reminder_id) {
      try {
        await cancelReminder(authUserId, updatedLedger.reminder_id);
      } catch (err) {
        console.warn("Failed to cancel linked reminder for paid ledger:", err);
      }
    }

    return { payment, ledgerItem: updatedLedger };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markLedgerItemPaid(
  authUserId: string,
  id: string,
  notes?: string | null,
): Promise<LedgerItem> {
  const ledger = await getLedgerItemFromDb(authUserId, id);
  if (!ledger) {
    throw new Error("Ledger item not found or access denied");
  }

  const { ledgerItem } = await recordPayment(authUserId, id, {
    amount: Number(ledger.remaining_amount),
    currency: ledger.currency,
    notes: notes || "Marked as fully paid",
  });

  return ledgerItem;
}

export async function cancelLedgerItem(
  authUserId: string,
  id: string,
): Promise<LedgerItem> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const lockRes = await client.query(
      `SELECT * FROM ledger_items WHERE id = $1 AND auth_user_id = $2 FOR UPDATE`,
      [id, authUserId],
    );
    const ledger = lockRes.rows[0] as LedgerItem;
    if (!ledger) {
      throw new Error("Ledger item not found or access denied");
    }

    if (ledger.status === "paid") {
      throw new Error("Cannot cancel a fully paid ledger item");
    }

    const updated = await updateLedgerItemInDb(
      authUserId,
      id,
      {
        status: "cancelled",
      },
      client,
    );

    if (!updated) {
      throw new Error("Failed to cancel ledger item");
    }

    await client.query("COMMIT");

    // Cancel linked active reminder
    if (updated.reminder_id) {
      try {
        await cancelReminder(authUserId, updated.reminder_id);
      } catch (err) {
        console.warn("Failed to cancel linked reminder for cancelled ledger:", err);
      }
    }

    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getContactBalance(
  authUserId: string,
  contactId: string,
): Promise<ContactBalance> {
  const contact = await getContact(authUserId, contactId);
  if (!contact) {
    throw new Error("Contact not found or access denied");
  }
  return getContactBalanceFromDb(authUserId, contactId);
}

export async function getPaymentsForLedgerItem(
  authUserId: string,
  ledgerItemId: string,
): Promise<PaymentTransaction[]> {
  const ledger = await getLedgerItemFromDb(authUserId, ledgerItemId);
  if (!ledger) {
    throw new Error("Ledger item not found or access denied");
  }
  return listPaymentsForLedgerItemFromDb(authUserId, ledgerItemId);
}
