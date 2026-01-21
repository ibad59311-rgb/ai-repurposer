import { NextResponse } from "next/server";
import { initSchema } from "@/lib/db";

export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_KEY;
  const provided = req.headers.get("x-admin-key");

  if (!adminKey) {
    return NextResponse.json({ error: "Missing ADMIN_KEY on server" }, { status: 500 });
  }
  if (provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initSchema();
  return NextResponse.json({ ok: true });
}
