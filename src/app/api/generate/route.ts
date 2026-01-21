import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import OpenAI from "openai";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";
import { id } from "@/lib/ids";

const Schema = z.object({
  transcript: z.string().min(50).max(20000),
});

type Output = {
  twitter_thread: string[];
  tiktok_script: string;
  youtube_title: string;
  youtube_description: string;
};

export async function POST(req: Request) {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid transcript" }, { status: 400 });

  const dec = await sql`
    UPDATE users
    SET credits = credits - 1
    WHERE id = ${userId} AND credits > 0
    RETURNING credits
  `;
  if (dec.rows.length === 0) return NextResponse.json({ error: "No credits left" }, { status: 402 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sql`UPDATE users SET credits = credits + 1 WHERE id = ${userId}`;
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const transcript = parsed.data.transcript;

  const prompt = `
You are a content repurposing assistant.
Return STRICT JSON only (no markdown, no commentary) with this schema:
{
  "twitter_thread": ["..."],
  "tiktok_script": "...",
  "youtube_title": "...",
  "youtube_description": "..."
}

Rules:
- twitter_thread: 6–10 short posts, each <= 280 characters.
- tiktok_script: 45–60 seconds, with hooks + beats + CTA.
- youtube_title: punchy, <= 70 chars.
- youtube_description: 2 short paragraphs + 5 bullets + 5 hashtags.

Transcript:
"""${transcript}"""
`.trim();

  let text: string | null = null;

  try {
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });
    text = resp.output_text ?? null;
  } catch {
    await sql`UPDATE users SET credits = credits + 1 WHERE id = ${userId}`;
    return NextResponse.json({ error: "OpenAI request failed" }, { status: 502 });
  }

  if (!text) {
    await sql`UPDATE users SET credits = credits + 1 WHERE id = ${userId}`;
    return NextResponse.json({ error: "No model output" }, { status: 502 });
  }

  let data: Output;
  try {
    data = JSON.parse(text) as Output;
  } catch {
    await sql`UPDATE users SET credits = credits + 1 WHERE id = ${userId}`;
    return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 502 });
  }

  if (!Array.isArray(data.twitter_thread) || typeof data.tiktok_script !== "string") {
    await sql`UPDATE users SET credits = credits + 1 WHERE id = ${userId}`;
    return NextResponse.json({ error: "Model output shape invalid" }, { status: 502 });
  }

  const genId = id("gen");
  await sql`
    INSERT INTO generations (id, user_id, input, output_json)
    VALUES (${genId}, ${userId}, ${transcript}, ${JSON.stringify(data)})
  `;

  const updated = await sql`SELECT credits FROM users WHERE id = ${userId} LIMIT 1`;
  return NextResponse.json({ ok: true, output: data, credits: updated.rows[0]?.credits ?? 0 });
}
