export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "@/lib/db";

export async function POST() {
  const key = (await headers()).get("x-admin-key");
  const ADMIN_KEY = process.env.ADMIN_KEY;

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Core tables (users, generations, subscriptions) should already exist.
  // This endpoint is safe to call multiple times.
  await sql`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      priority BOOLEAN NOT NULL DEFAULT FALSE,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);`;
  await sql`CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON support_tickets(created_at DESC);`;

  return NextResponse.json({ ok: true, tables: ["support_tickets"] });
}

