export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { sql } from "@/lib/db";

const Schema = z.object({
  id: z.string().min(4),
});

export async function POST(req: Request) {
  const ADMIN_KEY = process.env.ADMIN_KEY;
  const key = (await headers()).get("x-admin-key") ?? "";
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
