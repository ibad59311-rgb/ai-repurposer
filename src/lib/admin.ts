import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";

export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || "";
  const allow = raw
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  return allow.includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) throw new Error("NOT_LOGGED_IN");

  const { rows } = await sql`
    SELECT email
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const email = (rows[0]?.email as string | undefined) || "";
  if (!email) throw new Error("USER_NOT_FOUND");
  if (!isAdminEmail(email)) throw new Error("FORBIDDEN");

  return { userId, email };
}

export async function requireAdminUserId(): Promise<string> {
  const admin = await requireAdmin();
  return admin.userId;
}

