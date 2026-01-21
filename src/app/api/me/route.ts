import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureMonthlyCredits, getPlan } from "@/lib/credits";

export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ user: null }, { status: 200 });

  ensureMonthlyCredits(userId);
  const plan = getPlan(userId);

  const user = db.prepare("SELECT id, email, credits FROM users WHERE id = ?").get(userId) as { id: string; email: string; credits: number };
  return NextResponse.json({ user: { ...user, plan } }, { status: 200 });
}
