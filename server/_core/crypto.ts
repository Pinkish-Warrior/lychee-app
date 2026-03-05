import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { ENV } from "./env";

const ALGORITHM = "aes-256-gcm";

const getKey = (): Buffer => {
  if (!ENV.apiKeyEncryptionSecret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET is not set");
  }
  // Derive a 32-byte key from the secret using SHA-256
  return createHash("sha256").update(ENV.apiKeyEncryptionSecret).digest();
};

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(stored: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = stored.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted value format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
