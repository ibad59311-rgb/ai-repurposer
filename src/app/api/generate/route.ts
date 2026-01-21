export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import OpenAI from "openai";
import { verifySession, cookieName } from "@/lib/auth";
import { db } from "@/lib/db";
import { id } from "@/lib/ids";

const InSchema = z.object({
  transcript: z.string().min(50).max(20000),
});

const OutSchema = z.object({
  twitter_thread: z.array(z.string()).min(6).max(10),
  tiktok_script: z.string(),
  youtube_title: z.string(),
  youtube_description: z.string(),
});

function errInfo(e: any) {
  return {
    status: e?.status ?? null,
    code: e?.code ?? null,
    type: e?.type ?? null,
    message: e?.message ?? String(e),
  };
}

export async function POST(req: Request) {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = InSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transcript (min 50 chars)" }, { status: 400 });
  }

  const row = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as { credits: number } | undefined;
  if ((row?.credits ?? 0) <= 0) return NextResponse.json({ error: "No credits left" }, { status: 402 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Server missing OPENAI_API_KEY" }, { status: 500 });

  const client = new OpenAI({ apiKey });
  const transcript = parsed.data.transcript;

  const prompt = `
Return STRICT JSON only (no markdown, no extra keys) with:
{
  "twitter_thread": ["..."],
  "tiktok_script": "...",
  "youtube_title": "...",
  "youtube_description": "..."
}

Rules:
- twitter_thread: 6–10 short posts, each <= 280 chars.
- tiktok_script: 45–60 seconds with hooks + beats + CTA.
- youtube_title: <= 70 chars.
- youtube_description: 2 short paragraphs + 5 bullets + 5 hashtags.

Transcript:
"""${transcript}"""
`.trim();

  let text: string | null = null;

  try {
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });
    text = resp.output_text ?? null;
  } catch (e: any) {
    const detail = errInfo(e);
    console.error("OpenAI error:", detail);
    return NextResponse.json({ error: "OpenAI request failed", detail }, { status: detail.status ?? 502 });
  }

  if (!text) return NextResponse.json({ error: "No model output" }, { status: 502 });

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Model returned non-JSON", sample: text.slice(0, 250) }, { status: 502 });
  }

  const validated = OutSchema.safeParse(json);
  if (!validated.success) {
    return NextResponse.json({ error: "Model JSON failed validation", sample: JSON.stringify(json).slice(0, 250) }, { status: 502 });
  }

  const data = validated.data;

  const genId = id("gen");
  db.transaction(() => {
    db.prepare("INSERT INTO generations (id, user_id, input, output_json) VALUES (?, ?, ?, ?)")
      .run(genId, userId, transcript.slice(0, 20000), JSON.stringify(data));
    db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").run(userId);
  })();

  const updated = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as { credits: number };
  return NextResponse.json({ ok: true, output: data, credits: updated.credits });
}


