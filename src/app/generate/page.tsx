"use client";

import { useEffect, useState } from "react";

type Plan = "free" | "starter" | "creator" | "pro";

type Me = {
  user: { id: string; email: string; credits: number; plan: Plan } | null;
};

type Output = {
  twitter_thread: string[];
  tiktok_script: string;
  youtube_title: string;
  youtube_description: string;
};

export default function Generate() {
  const [me, setMe] = useState<Me | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<Output | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: Me) => {
        setMe(j);
        setCredits(j.user?.credits ?? null);
        setPlan(j.user?.plan ?? null);
      })
      .catch(() => setMe({ user: null }));
  }, []);

  async function run() {
    setErr(null);
    setOut(null);
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j.error || "Generation failed");
      return;
    }

    setOut(j.output);
    setCredits(j.credits);
  }

  const loggedIn = !!me?.user;

  function planLabel(p: Plan | null) {
    if (!p) return "—";
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  return (
    <main style={{ display: "grid", gap: 12 }}>
      <h1>Generate</h1>

      {!me ? (
        <p>Loading…</p>
      ) : !loggedIn ? (
        <p>
          You must <a href="/login">login</a> to generate.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0 }}>
              <b>Plan:</b> {planLabel(plan)}
            </p>
            <p style={{ margin: 0 }}>
              <b>Credits:</b> {credits ?? "—"}
            </p>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste transcript text here (minimum 50 chars)…"
            rows={10}
            style={{ width: "100%", padding: 10 }}
          />

          <button disabled={loading} onClick={run}>
            {loading ? "Generating…" : "Generate (uses 1 credit)"}
          </button>

          {err && <p style={{ color: "crimson" }}>{err}</p>}

          {out && (
            <div style={{ display: "grid", gap: 14 }}>
              <section>
                <h3>Twitter/X Thread</h3>
                <ol>
                  {out.twitter_thread.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </section>

              <section>
                <h3>TikTok / Shorts Script</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{out.tiktok_script}</pre>
              </section>

              <section>
                <h3>YouTube Title</h3>
                <p>{out.youtube_title}</p>
                <h3>YouTube Description</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{out.youtube_description}</pre>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}

