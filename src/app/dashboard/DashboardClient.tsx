"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Plan = "free" | "starter" | "creator" | "pro";
type Me = { user: { id: string; email: string; credits: number; plan: Plan } | null };

export default function DashboardClient() {
  const [me, setMe] = useState<Me | null>(null);
  
  // recent generations
  const [recent, setRecent] = useState<any[] | null>(null);

  async function loadRecent() {
    try {
      const r = await fetch("/api/generations", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return setRecent([]);
      setRecent(Array.isArray(j.items) ? j.items : []);
    } catch {
      setRecent([]);
    }
  }const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
fetch("/api/me").then(r => r.json()).then(setMe).catch(() => setMe({ user: null }));
  
  loadRecent();
}, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function manageBilling() {
    setLoadingBilling(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || "Could not open billing portal");
        return;
      }
      if (j.url) window.location.href = j.url;
    } finally {
      setLoadingBilling(false);
    }
  }

  const u = me?.user;

  return (
    <main style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Dashboard</h1>

      {!me ? (
        <p>Loading…</p>
      ) : !u ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p>You are not logged in.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign up</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div><b>Email:</b> {u.email}</div>
            <div><b>Plan:</b> {u.plan}</div>
            <div><b>Credits:</b> {u.credits}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/generate">Generate</Link>
            <Link href="/pricing">Upgrade</Link>
            <button onClick={manageBilling} disabled={loadingBilling}>
              {loadingBilling ? "Opening billing…" : "Manage billing"}
            </button>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      )}
            <div className="card p-4 mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Recent generations</h2>
            <button className="btn btn-ghost text-sm" type="button" onClick={loadRecent}>Refresh</button>
          </div>
          <div className="mt-3">
            {recent === null ? (
              <div className="text-sm text-muted">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="text-sm text-muted">No generations yet.</div>
            ) : (
              <div className="grid gap-2">
                {recent.map((g: any) => (
                  <a key={g.id} className="card p-3 hover:shadow-soft transition" href={`/g/${g.id}`}>
                    <div className="text-xs text-muted">{String(g.created_at || "")}</div>
                    <div className="text-sm mt-1 line-clamp-2">{String(g.input_preview || "")}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
</main>
  );
}


