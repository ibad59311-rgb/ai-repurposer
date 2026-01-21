export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "@/lib/db";

function requireAdmin() {
  const key = headers().then(h => h.get("x-admin-key"));
  return key;
}

export async function GET(req: Request) {
  const ADMIN_KEY = process.env.ADMIN_KEY;
  const key = (await requireAdmin()) ?? "";
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "open").toLowerCase();

  if (status === "all") {
    const { rows } = await sql`
      SELECT id, user_id, email, plan, priority, subject, message, status, created_at
      FROM support_tickets
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return NextResponse.json({ tickets: rows });
  }

  if (status !== "open" && status !== "resolved") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { rows } = await sql`
    SELECT id, user_id, email, plan, priority, subject, message, status, created_at
    FROM support_tickets
    WHERE status = ${status}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return NextResponse.json({ tickets: rows });
}
