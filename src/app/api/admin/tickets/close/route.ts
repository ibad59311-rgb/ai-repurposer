export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAdminUserId } from "@/lib/admin";

const Schema = z.object({
  id: z.string().min(4),
});

export async function POST(req: Request) {
  const admin = await requireAdminUserId();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await sql`
    UPDATE support_tickets
    SET status = 'resolved'
    WHERE id = ${parsed.data.id}
  `;

  return NextResponse.json({ ok: true });
}

