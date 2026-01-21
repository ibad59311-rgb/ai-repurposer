import crypto from "crypto";

const COOKIE_NAME = "session";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function hmac(data: string) {
  const secret = mustEnv("APP_SECRET");
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function signSession(userId: string) {
  // format: userId.timestamp.signature
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = hmac(payload);
  return `${userId}.${ts}.${sig}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, ts, sig] = parts;
  const payload = `${userId}.${ts}`;
  if (hmac(payload) !== sig) return null;

  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs > 14 * 24 * 60 * 60 * 1000) return null;

  return userId;
}

export const cookieName = COOKIE_NAME;

