import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";

function normalizeEmailList(raw: string | undefined) {
  return (raw || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminUserId(): Promise<{ userId: string; email: string } | null> {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return null;

  const { rows } = await sql`
    SELECT email
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const email = (rows[0]?.email as string | undefined)?.toLowerCase();
  if (!email) return null;

  const allow = normalizeEmailList(process.env.ADMIN_EMAILS);
  if (!allow.includes(email)) return null;

  return { userId, email };
}
