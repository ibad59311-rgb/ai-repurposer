"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "free" | "starter" | "creator" | "pro";
type Me = { user: { id: string; email: string; credits: number; plan: Plan } | null };

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  plan: Plan;
  priority: boolean;
  created_at: string;
};

export default function SupportPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    const meRes = await fetch("/api/me").then(r => r.json()).catch(() => ({ user: null }));
    setMe(meRes);

    if (!meRes.user) return;

    const tRes = await fetch("/api/support/tickets").then(r => r.json()).catch(() => ({ tickets: [] }));
    setTickets(tRes.tickets || []);
  }

  useEffect(() => { refresh(); }, []);

  const loggedIn = !!me?.user;

  const canSubmit = useMemo(() => {
    return subject.trim().length >= 3 && message.trim().length >= 10 && !busy;
  }, [subject, message, busy]);

  async function submit() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    setErr(null);
    setBusy(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Ticket creation failed");

      setSubject("");
      setMessage("");
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Ticket creation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid fade-in" style={{ gap: 16 }}>
      <div className="card card-pad">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 6 }}>Support</h1>
            <p className="p">Create a ticket and track responses here.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <a className="btn" href="/dashboard">Dashboard</a>
            <a className="btn" href="/generate">Generate</a>
          </div>
        </div>

        <hr className="hr" />

        {!me ? (
          <p className="p">Loading…</p>
        ) : !loggedIn ? (
          <p className="p">You must <a href="/login">login</a> to create support tickets.</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <span className="pill">Plan: <b style={{ textTransform: "capitalize", color: "rgba(255,255,255,.92)" }}>{me.user?.plan}</b></span>
              <span className="pill">Priority: <b style={{ color: "rgba(255,255,255,.92)" }}>{(me.user?.plan === "creator" || me.user?.plan === "pro") ? "Yes" : "No"}</b></span>
            </div>

            <div className="section">
              <h3>Create ticket</h3>
              <div className="grid" style={{ gap: 10 }}>
                <input
                  className="input"
                  placeholder="Subject (3–120 chars)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <div className="composer">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue clearly (minimum 10 characters). Include steps to reproduce."
                    style={{ minHeight: 160 }}
                  />
                  <div className="composer-meta">
                    <span className="pill">{message.length.toLocaleString()} chars</span>
                    <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
                      {busy ? "Submitting…" : "Submit ticket"}
                    </button>
                  </div>
                </div>

                {err && <p style={{ color: "salmon" }}>{err}</p>}
              </div>
            </div>
          </>
        )}
      </div>

      {loggedIn && (
        <div className="section">
          <h3>Your tickets</h3>
          {tickets.length === 0 ? (
            <p className="p">No tickets yet.</p>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {tickets.map(t => (
                <div key={t.id} className="card card-pad">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <span className="pill">{t.status}</span>
                      <span className="pill" style={{ textTransform: "capitalize" }}>{t.plan}</span>
                      {t.priority && <span className="pill" style={{ borderColor: "rgba(124,58,237,.55)", background: "rgba(124,58,237,.12)" }}>Priority</span>}
                    </div>
                    <span className="p" style={{ margin: 0 }}>
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>

                  <hr className="hr" />

                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{t.subject}</div>
                  <div className="readable">{t.message}</div>
                  <div className="p" style={{ marginTop: 10, opacity: 0.8 }}>Ticket ID: {t.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

