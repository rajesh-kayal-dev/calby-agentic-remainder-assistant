import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getSecretKey(): Buffer {
  const secret =
    process.env.LLM_ENCRYPTION_SECRET ||
    process.env.DESCOPE_MANAGEMENT_KEY ||
    "calby-llm-secret-fallback-key-32b";
  return crypto.scryptSync(secret, "calby-salt", 32);
}

export function encryptCredentials(data: Record<string, string>): string {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptCredentials(ciphertext: string): Record<string, string> {
  if (!ciphertext) return {};
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid ciphertext format");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getSecretKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch {
    throw new Error("Failed to decrypt credentials. Key may be invalid.");
  }
}

export function maskCredentialString(key?: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}••••••••${key.slice(-3)}`;
}
