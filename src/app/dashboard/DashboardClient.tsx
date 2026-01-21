"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Plan = "free" | "starter" | "creator" | "pro";
type Me = { user: { id: string; email: string; credits: number; plan: Plan } | null };

export default function DashboardClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setMe).catch(() => setMe({ user: null }));
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
    </main>
  );
}
