import crypto from "crypto";

// Simple scrypt-based password hashing. No external dependency needed —
// uses Node's built-in crypto module. Format: scrypt$<saltHex>$<hashHex>
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, hashHex] = parts;
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
    const storedBuf = Buffer.from(hashHex, "hex");
    if (storedBuf.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(derivedKey, storedBuf);
  } catch {
    return false;
  }
}
