import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { id } from "@/lib/ids";
import { cookieName, signSession } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.rows.length) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const userId = id("usr");
  const password_hash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO users (id, email, password_hash, credits)
    VALUES (${userId}, ${email}, ${password_hash}, 3)
  `;

  const token = signSession(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

