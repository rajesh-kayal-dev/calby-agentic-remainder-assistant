import { getPool } from "../db/pool.js";

export type LedgerDirection = "receivable" | "payable";
export type LedgerStatus = "pending" | "partially_paid" | "paid" | "cancelled";

export interface LedgerItem {
  id: string;
  auth_user_id: string;
  contact_id: string;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  title: string;
  description: string | null;
  status: LedgerStatus;
  original_amount: number;
  remaining_amount: number;
  task_id: string | null;
  reminder_id: string | null;
  due_at: Date | null;
  paid_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  contact_name?: string;
}

export interface PaymentTransaction {
  id: string;
  auth_user_id: string;
  ledger_item_id: string;
  amount: number;
  currency: string;
  notes: string | null;
  paid_at: Date;
  created_at: Date;
}

export interface ContactBalance {
  receivables: number;
  payables: number;
  net: number;
  currency: string;
}

export function parseLedgerItem(row: any): LedgerItem {
  if (!row) return row;
  return {
    ...row,
    amount: parseFloat(row.amount),
    original_amount: parseFloat(row.original_amount),
    remaining_amount: parseFloat(row.remaining_amount),
  };
}

export function parsePaymentTransaction(row: any): PaymentTransaction {
  if (!row) return row;
  return {
    ...row,
    amount: parseFloat(row.amount),
  };
}

export async function createLedgerItemInDb(
  authUserId: string,
  input: {
    contactId: string;
    direction: LedgerDirection;
    amount: number;
    currency?: string;
    title: string;
    description?: string | null;
    taskId?: string | null;
    reminderId?: string | null;
    dueAt?: Date | null;
    notes?: string | null;
  },
  client?: any,
): Promise<LedgerItem> {
  const executor = client || getPool();
  const res = await executor.query(
    `
    INSERT INTO ledger_items (
      auth_user_id,
      contact_id,
      direction,
      amount,
      currency,
      title,
      description,
      status,
      original_amount,
      remaining_amount,
      task_id,
      reminder_id,
      due_at,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $4, $4, $8, $9, $10, $11)
    RETURNING *
    `,
    [
      authUserId,
      input.contactId,
      input.direction,
      input.amount,
      input.currency || "INR",
      input.title.trim(),
      input.description?.trim() || null,
      input.taskId || null,
      input.reminderId || null,
      input.dueAt || null,
      input.notes?.trim() || null,
    ],
  );

  return parseLedgerItem(res.rows[0]);
}

export async function updateLedgerItemInDb(
  authUserId: string,
  id: string,
  updates: {
    status?: LedgerStatus;
    remaining_amount?: number;
    paid_at?: Date | null;
    task_id?: string | null;
    reminder_id?: string | null;
    title?: string;
    description?: string | null;
  },
  client?: any,
): Promise<LedgerItem | null> {
  const executor = client || getPool();
  const fields: string[] = [];
  const params: any[] = [id, authUserId];
  let paramIdx = 3;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIdx++}`);
    params.push(updates.status);
  }
  if (updates.remaining_amount !== undefined) {
    fields.push(`remaining_amount = $${paramIdx++}`);
    params.push(updates.remaining_amount);
  }
  if (updates.paid_at !== undefined) {
    fields.push(`paid_at = $${paramIdx++}`);
    params.push(updates.paid_at);
  }
  if (updates.task_id !== undefined) {
    fields.push(`task_id = $${paramIdx++}`);
    params.push(updates.task_id);
  }
  if (updates.reminder_id !== undefined) {
    fields.push(`reminder_id = $${paramIdx++}`);
    params.push(updates.reminder_id);
  }
  if (updates.title !== undefined) {
    fields.push(`title = $${paramIdx++}`);
    params.push(updates.title.trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIdx++}`);
    params.push(updates.description?.trim() || null);
  }

  if (fields.length === 0) {
    return getLedgerItemFromDb(authUserId, id, client);
  }

  fields.push(`updated_at = NOW()`);

  const query = `
    UPDATE ledger_items
    SET ${fields.join(", ")}
    WHERE id = $1 AND auth_user_id = $2
    RETURNING *
  `;

  const res = await executor.query(query, params);
  return res.rows[0] ? parseLedgerItem(res.rows[0]) : null;
}

export async function getLedgerItemFromDb(
  authUserId: string,
  id: string,
  client?: any,
): Promise<LedgerItem | null> {
  const executor = client || getPool();
  const res = await executor.query(
    `
    SELECT l.*, c.name as contact_name
    FROM ledger_items l
    JOIN contacts c ON l.contact_id = c.id
    WHERE l.id = $1 AND l.auth_user_id = $2
    `,
    [id, authUserId],
  );
  return res.rows[0] ? parseLedgerItem(res.rows[0]) : null;
}

export async function listLedgerItemsFromDb(
  authUserId: string,
  filters: {
    status?: LedgerStatus;
    direction?: LedgerDirection;
    contactId?: string;
    search?: string;
  },
): Promise<LedgerItem[]> {
  const params: any[] = [authUserId];
  let query = `
    SELECT l.*, c.name as contact_name
    FROM ledger_items l
    JOIN contacts c ON l.contact_id = c.id
    WHERE l.auth_user_id = $1
  `;
  let paramIdx = 2;

  if (filters.status) {
    query += ` AND l.status = $${paramIdx++}`;
    params.push(filters.status);
  }
  if (filters.direction) {
    query += ` AND l.direction = $${paramIdx++}`;
    params.push(filters.direction);
  }
  if (filters.contactId) {
    query += ` AND l.contact_id = $${paramIdx++}`;
    params.push(filters.contactId);
  }
  if (filters.search) {
    query += ` AND (l.title ILIKE $${paramIdx} OR l.description ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx})`;
    params.push(`%${filters.search}%`);
    paramIdx++;
  }

  query += ` ORDER BY l.created_at DESC`;

  const res = await getPool().query(query, params);
  return res.rows.map(parseLedgerItem);
}

export async function createPaymentInDb(
  authUserId: string,
  input: {
    ledgerItemId: string;
    amount: number;
    currency: string;
    notes?: string | null;
    paidAt?: Date;
  },
  client?: any,
): Promise<PaymentTransaction> {
  const executor = client || getPool();
  const res = await executor.query(
    `
    INSERT INTO ledger_payments (
      auth_user_id,
      ledger_item_id,
      amount,
      currency,
      notes,
      paid_at
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
    RETURNING *
    `,
    [
      authUserId,
      input.ledgerItemId,
      input.amount,
      input.currency,
      input.notes?.trim() || null,
      input.paidAt || null,
    ],
  );

  return parsePaymentTransaction(res.rows[0]);
}

export async function listPaymentsForLedgerItemFromDb(
  authUserId: string,
  ledgerItemId: string,
): Promise<PaymentTransaction[]> {
  const res = await getPool().query(
    `
    SELECT * FROM ledger_payments
    WHERE ledger_item_id = $1 AND auth_user_id = $2
    ORDER BY paid_at DESC, created_at DESC
    `,
    [ledgerItemId, authUserId],
  );
  return res.rows.map(parsePaymentTransaction);
}

export async function getContactBalanceFromDb(
  authUserId: string,
  contactId: string,
): Promise<ContactBalance> {
  const res = await getPool().query(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN direction = 'receivable' THEN remaining_amount ELSE 0 END), 0) as receivables,
      COALESCE(SUM(CASE WHEN direction = 'payable' THEN remaining_amount ELSE 0 END), 0) as payables
    FROM ledger_items
    WHERE contact_id = $1 AND auth_user_id = $2 AND status IN ('pending', 'partially_paid')
    `,
    [contactId, authUserId],
  );

  const receivables = parseFloat(res.rows[0].receivables);
  const payables = parseFloat(res.rows[0].payables);

  return {
    receivables,
    payables,
    net: receivables - payables,
    currency: "INR",
  };
}
