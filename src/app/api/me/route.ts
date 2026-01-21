import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureMonthlyCredits, getPlan } from "@/lib/credits";

export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ user: null }, { status: 200 });

  await ensureMonthlyCredits(userId);
  const plan = await getPlan(userId);

  const { rows } = await sql`
    SELECT id, email, credits
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const user = rows[0] as { id: string; email: string; credits: number } | undefined;
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({ user: { ...user, plan } }, { status: 200 });
}

