"use client";

import { useEffect, useMemo, useState } from "react";

type Output = {
  twitter_thread: string[];
  tiktok_script: string;
  youtube_title: string;
  youtube_description: string;
};

type Me = { user: { credits: number; plan: "free" | "starter" | "creator" | "pro" } | null };

export default function Generate() {
  const [me, setMe] = useState<Me | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<Output | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<Me["user"] extends infer U ? (U extends { plan: infer P } ? P : never) : never | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then((j: Me) => {
        setMe(j);
        setCredits(j.user?.credits ?? null);
        setPlan(j.user?.plan ?? null);
      })
      .catch(() => setMe({ user: null }));
  }, []);

  const chars = transcript.length;
  const tooShort = chars > 0 && chars < 50;

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

  const cta = useMemo(() => {
    if (!loggedIn) return { text: "Login required", disabled: true };
    if (loading) return { text: "Generating…", disabled: true };
    if (chars < 50) return { text: "Generate", disabled: true };
    if (credits !== null && credits <= 0) return { text: "No credits left", disabled: true };
    return { text: "Generate", disabled: false };
  }, [loggedIn, loading, chars, credits]);

  return (
    <main className="grid fade-in" style={{ gap: 16 }}>
      <div className="card card-pad">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 6 }}>Generate</h1>
            <p className="p">Paste a transcript and generate platform-ready content.</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className="pill">Plan: <b style={{ color: "rgba(255,255,255,.92)", textTransform: "capitalize" }}>{plan ?? "—"}</b></span>
            <span className="pill">Credits: <b style={{ color: "rgba(255,255,255,.92)" }}>{credits ?? "—"}</b></span>
            <a className="btn" href="/pricing">Upgrade</a>
          </div>
        </div>

        <hr className="hr" />

        {!me ? (
          <p className="p">Loading…</p>
        ) : !loggedIn ? (
          <p className="p">You must <a href="/login">login</a> to generate.</p>
        ) : (
          <>
            <div className="composer" style={{ marginTop: 6 }}>
              <div className="composer-row">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste transcript text here… (minimum 50 characters)"
                />
              </div>

              <div className="composer-meta">
                <span className="pill">{chars.toLocaleString()} chars {tooShort ? "• needs 50+" : ""}</span>
                <button className="btn btn-primary" disabled={cta.disabled} onClick={run}>
                  {cta.text}
                </button>
              </div>
            </div>

            {err && <p style={{ color: "salmon", marginTop: 12 }}>{err}</p>}
          </>
        )}
      </div>

      {out && (
        <div className="grid" style={{ gap: 14 }}>
          <div className="section">
            <h3>Twitter/X Thread</h3>
            <ul className="thread">
              {out.twitter_thread.map((t, i) => (
                <li key={i} className="readable">{t}</li>
              ))}
            </ul>
          </div>

          <div className="split">
            <div className="section">
              <h3>TikTok / Shorts Script</h3>
              <div className="readable">{out.tiktok_script}</div>
            </div>

            <div className="section">
              <h3>YouTube</h3>
              <div style={{ marginBottom: 10 }}>
                <div className="pill" style={{ marginBottom: 10 }}>Title</div>
                <div className="readable">{out.youtube_title}</div>
              </div>
              <div>
                <div className="pill" style={{ marginBottom: 10 }}>Description</div>
                <div className="readable">{out.youtube_description}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
