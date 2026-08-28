import { getPool } from "../db/pool.js";

export type CurrentUserRowInfo = {
  id: string;
  auth_user_id: string;
  email: string | null;
  name: string | null;
  created_at: Date;
};

export async function ensureUser(input: {
  authUserId: string;
  email?: string;
  name?: string;
}): Promise<CurrentUserRowInfo> {
  const result = await getPool().query<CurrentUserRowInfo>(
    `
    INSERT INTO users (auth_user_id, email, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (auth_user_id)
    DO UPDATE SET 
      email = COALESCE(EXCLUDED.email, users.email),
      name = COALESCE(users.name, EXCLUDED.name)
    RETURNING *
    `,
    [input.authUserId, input.email || null, input.name || null],
  );

  return result.rows[0];
}

export async function getUserByAuthId(authUserId: string): Promise<CurrentUserRowInfo | null> {
  const result = await getPool().query<CurrentUserRowInfo>(
    `SELECT * FROM users WHERE auth_user_id = $1`,
    [authUserId],
  );
  return result.rows[0] || null;
}

export async function updateUserName(authUserId: string, name: string): Promise<CurrentUserRowInfo> {
  const result = await getPool().query<CurrentUserRowInfo>(
    `
    UPDATE users
    SET name = $2
    WHERE auth_user_id = $1
    RETURNING *
    `,
    [authUserId, name],
  );
  return result.rows[0];
}

export async function purgeUserDataFromDb(authUserId: string): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ledger_payments WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM ledger_items WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM reminders WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM tasks WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM task_lists WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM contacts WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM user_preferences WHERE auth_user_id = $1`, [authUserId]);
    await client.query(`DELETE FROM users WHERE auth_user_id = $1`, [authUserId]);
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


