import crypto from "crypto";
import { db } from "./db";

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
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const payload = `${userId}.${ts}`;
  if (hmac(payload) !== sig) return null;

  // optional: expire after 14 days
  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs > 14 * 24 * 60 * 60 * 1000) return null;

  // verify user exists
  const row = db.prepare("SELECT id FROM users WHERE id = ?").get(userId) as { id: string } | undefined;
  return row?.id ?? null;
}

export const cookieName = COOKIE_NAME;
