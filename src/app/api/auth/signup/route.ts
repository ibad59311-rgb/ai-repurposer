import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
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

  const { email, password } = parsed.data;
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const userId = id("usr");
  const password_hash = await bcrypt.hash(password, 10);

  db.prepare("INSERT INTO users (id, email, password_hash, credits) VALUES (?, ?, ?, 3)")
    .run(userId, email.toLowerCase(), password_hash);

  const token = signSession(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
