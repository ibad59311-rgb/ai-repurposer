import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { rows } = await sql`
    SELECT id, created_at, LEFT(input, 120) AS input_preview
    FROM generations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  return NextResponse.json({ items: rows }, { status: 200 });
}
