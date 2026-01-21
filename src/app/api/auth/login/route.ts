import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { cookieName, signSession } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, password } = parsed.data;
  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email.toLowerCase()) as { id: string; password_hash: string } | undefined;
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = signSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
