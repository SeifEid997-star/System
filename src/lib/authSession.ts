import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "qlinic_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") return "local-development-secret-change-before-deploy-qlinic";
  throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters");
}

export function createSessionToken(userId: string, role: string) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  })).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): { userId: string; role: string } | null {
  if (!token) return null;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", getSecret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.sub !== "string" || typeof data.role !== "string" || typeof data.exp !== "number" || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return { userId: data.sub, role: data.role };
  } catch {
    return null;
  }
}
