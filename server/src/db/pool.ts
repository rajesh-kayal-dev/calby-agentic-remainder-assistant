import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not set in environment");
    }

    // Standardize sslmode to avoid node-postgres SSL deprecation warnings
    if (connectionString.includes("sslmode=require")) {
      connectionString = connectionString.replace("sslmode=require", "sslmode=verify-full");
    } else if (connectionString.includes("sslmode=prefer")) {
      connectionString = connectionString.replace("sslmode=prefer", "sslmode=verify-full");
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      keepAlive: true,
    });

    // Register error handler on pool instance to prevent unhandled 'error' event process crashes when idle sockets drop
    pool.on("error", (err: Error) => {
      console.warn("[Database Pool] Idle PostgreSQL connection reset by server:", err.message);
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
