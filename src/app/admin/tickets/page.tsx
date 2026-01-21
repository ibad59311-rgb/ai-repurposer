"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  user_id: string;
  email: string;
  plan: "free" | "starter" | "creator" | "pro";
  priority: boolean;
  subject: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
};

export default function AdminTickets() {
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function load() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${status}`);
      const j = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Could be logged out OR logged in but not admin.
        // Check /api/me to decide where to route.
        const me = await fetch("/api/me").then(r => r.json()).catch(() => ({ user: null }));
        if (!me.user) router.push("/login");
        else setErr("Not authorized for admin access.");
        setTickets([]);
        return;
      }

      if (!res.ok) throw new Error(j.error || "Failed to load tickets");
      setTickets(j.tickets || []);
    } catch (e: any) {
      setTickets([]);
      setErr(e?.message || "Failed to load tickets");
    } finally {
      setBusy(false);
    }
  }

  async function closeTicket(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/admin/tickets/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to close ticket");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to close ticket");
    }
  }

  const stats = useMemo(() => {
    const total = tickets.length;
    const prio = tickets.filter(t => t.priority).length;
    return { total, prio };
  }, [tickets]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <main className="grid fade-in" style={{ gap: 16 }}>
      <div className="card card-pad">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 6 }}>Admin · Support Tickets</h1>
            <p className="p">Tickets are visible only to admin accounts.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href="/dashboard">Dashboard</a>
            <button className="btn btn-primary" disabled={busy} onClick={load}>{busy ? "Loading…" : "Refresh"}</button>
          </div>
        </div>

        <hr className="hr" />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className={`btn ${status === "open" ? "btn-primary" : ""}`} onClick={() => setStatus("open")}>Open</button>
          <button className={`btn ${status === "resolved" ? "btn-primary" : ""}`} onClick={() => setStatus("resolved")}>Resolved</button>
          <button className={`btn ${status === "all" ? "btn-primary" : ""}`} onClick={() => setStatus("all")}>All</button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="pill">Loaded: <b style={{ color: "rgba(255,255,255,.92)" }}>{stats.total}</b></span>
            <span className="pill">Priority: <b style={{ color: "rgba(255,255,255,.92)" }}>{stats.prio}</b></span>
          </div>
        </div>

        {err && <p style={{ color: "salmon", marginTop: 12 }}>{err}</p>}
      </div>

      <div className="section">
        <h3>Tickets</h3>

        {tickets.length === 0 ? (
          <p className="p">{busy ? "Loading…" : "No tickets."}</p>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {tickets.map(t => (
              <div key={t.id} className="card card-pad">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="pill">{t.status}</span>
                    <span className="pill" style={{ textTransform: "capitalize" }}>{t.plan}</span>
                    {t.priority && (
                      <span className="pill" style={{ borderColor: "rgba(124,58,237,.55)", background: "rgba(124,58,237,.12)" }}>
                        Priority
                      </span>
                    )}
                  </div>
                  <span className="p" style={{ margin: 0 }}>{new Date(t.created_at).toLocaleString()}</span>
                </div>

                <hr className="hr" />

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{t.subject}</div>
                  {t.status === "open" && (
                    <button className="btn btn-primary" onClick={() => closeTicket(t.id)}>
                      Mark resolved
                    </button>
                  )}
                </div>

                <div className="p" style={{ marginTop: 8, opacity: 0.9 }}>
                  <b>{t.email}</b> · user: <span style={{ opacity: 0.8 }}>{t.user_id}</span> · ticket: <span style={{ opacity: 0.8 }}>{t.id}</span>
                </div>

                <div className="readable" style={{ marginTop: 10 }}>{t.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
