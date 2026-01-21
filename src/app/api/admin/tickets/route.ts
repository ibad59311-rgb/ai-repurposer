export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminUserId } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await requireAdminUserId();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
