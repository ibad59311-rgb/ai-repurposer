import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { cookieName, signSession } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const { rows } = await sql`
    SELECT id, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  const user = rows[0] as { id: string; password_hash: string } | undefined;
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = signSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
