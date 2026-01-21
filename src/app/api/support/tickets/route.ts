export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { sql } from "@/lib/db";
import { verifySession, cookieName } from "@/lib/auth";
import { id } from "@/lib/ids";
import { getPlan } from "@/lib/credits";

const CreateSchema = z.object({
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(5000),
});

export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { rows } = await sql`
    SELECT id, subject, message, status, plan, priority, created_at
    FROM support_tickets
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ tickets: rows });
}

export async function POST(req: Request) {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { rows: urows } = await sql`
    SELECT email
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const email = (urows[0]?.email as string | undefined) ?? null;
  if (!email) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const plan = await getPlan(userId);
  const priority = plan === "creator" || plan === "pro";

  const ticketId = id("tkt");

  await sql`
    INSERT INTO support_tickets (id, user_id, email, plan, priority, subject, message, status)
    VALUES (${ticketId}, ${userId}, ${email}, ${plan}, ${priority}, ${parsed.data.subject}, ${parsed.data.message}, 'open')
  `;

  return NextResponse.json({ ok: true, id: ticketId, priority, plan });
}

