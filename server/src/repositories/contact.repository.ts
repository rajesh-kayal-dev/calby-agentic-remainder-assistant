import { getPool } from "../db/pool.js";

export interface ContactRecord {
  id: string;
  auth_user_id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  telegram_id: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContactInput {
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  telegramId?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateContactInput {
  name?: string;
  email?: string | null;
  phoneNumber?: string | null;
  telegramId?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
}

export async function createContactInDb(
  authUserId: string,
  input: CreateContactInput,
): Promise<ContactRecord> {
  const result = await getPool().query<ContactRecord>(
    `
    INSERT INTO contacts (
      auth_user_id,
      name,
      email,
      phone_number,
      telegram_id,
      notes,
      metadata,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
    `,
    [
      authUserId,
      input.name.trim(),
      input.email?.trim() || null,
      input.phoneNumber?.trim() || null,
      input.telegramId?.trim() || null,
      input.notes?.trim() || null,
      input.metadata || {},
    ],
  );

  return result.rows[0];
}

export async function getContactByIdFromDb(
  authUserId: string,
  contactId: string,
): Promise<ContactRecord | null> {
  try {
    const result = await getPool().query<ContactRecord>(
      `
      SELECT *
      FROM contacts
      WHERE id = $1 AND auth_user_id = $2
      `,
      [contactId, authUserId],
    );

    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function listContactsFromDb(
  authUserId: string,
  options?: { search?: string },
): Promise<ContactRecord[]> {
  let query = `
    SELECT *
    FROM contacts
    WHERE auth_user_id = $1
  `;
  const params: any[] = [authUserId];

  if (options?.search && options.search.trim().length > 0) {
    query += ` AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2 OR phone_number LIKE $2)`;
    params.push(`%${options.search.trim().toLowerCase()}%`);
  }

  query += ` ORDER BY name ASC`;

  const result = await getPool().query<ContactRecord>(query, params);
  return result.rows;
}

export async function findContactsByNameFromDb(
  authUserId: string,
  nameQuery: string,
): Promise<ContactRecord[]> {
  try {
    const cleanName = nameQuery.trim().toLowerCase();
    const result = await getPool().query<ContactRecord>(
      `
      SELECT *
      FROM contacts
      WHERE auth_user_id = $1
        AND (LOWER(name) = $2 OR LOWER(name) LIKE $3)
      ORDER BY
        CASE WHEN LOWER(name) = $2 THEN 0 ELSE 1 END,
        name ASC
      `,
      [authUserId, cleanName, `%${cleanName}%`],
    );

    return result.rows;
  } catch {
    return [];
  }
}

export async function updateContactInDb(
  authUserId: string,
  contactId: string,
  updates: UpdateContactInput,
): Promise<ContactRecord | null> {
  const fields: string[] = [];
  const params: any[] = [contactId, authUserId];
  let paramIdx = 3;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIdx++}`);
    params.push(updates.name.trim());
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIdx++}`);
    params.push(updates.email ? updates.email.trim() : null);
  }
  if (updates.phoneNumber !== undefined) {
    fields.push(`phone_number = $${paramIdx++}`);
    params.push(updates.phoneNumber ? updates.phoneNumber.trim() : null);
  }
  if (updates.telegramId !== undefined) {
    fields.push(`telegram_id = $${paramIdx++}`);
    params.push(updates.telegramId ? updates.telegramId.trim() : null);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIdx++}`);
    params.push(updates.notes ? updates.notes.trim() : null);
  }
  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${paramIdx++}`);
    params.push(updates.metadata);
  }

  if (fields.length === 0) {
    return getContactByIdFromDb(authUserId, contactId);
  }

  fields.push(`updated_at = NOW()`);

  const query = `
    UPDATE contacts
    SET ${fields.join(", ")}
    WHERE id = $1 AND auth_user_id = $2
    RETURNING *
  `;

  const result = await getPool().query<ContactRecord>(query, params);
  return result.rows[0] || null;
}

export async function deleteContactFromDb(
  authUserId: string,
  contactId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `
    DELETE FROM contacts
    WHERE id = $1 AND auth_user_id = $2
    `,
    [contactId, authUserId],
  );

  return (result.rowCount ?? 0) > 0;
}
