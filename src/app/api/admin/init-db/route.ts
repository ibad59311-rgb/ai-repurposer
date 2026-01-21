import { NextResponse } from "next/server";
import { initSchema } from "@/lib/db";

export async function POST() {
  try {
    await initSchema();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "init failed" },
      { status: 500 }
    );
  }
}
