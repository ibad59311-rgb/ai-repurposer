"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = { user: { id: string; email: string; credits: number; plan: "free" | "starter" | "creator" | "pro" } | null };

const PLAN_LABEL: Record<string, string> = {
  free: "Free (3 / month)",
  starter: "Starter (10 / month) — £0.99",
  creator: "Creator (50 / month) — £4.99",
  pro: "Pro (200 / month) — £14.99",
};

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const router = useRouter();

  async function refresh() {
    const j = await fetch("/api/me").then(r => r.json());
    setMe(j);
  }

  useEffect(() => { refresh(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function upgrade(tier: "starter" | "creator" | "pro") {
    setLoadingTier(tier);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const j = await res.json().catch(() => ({}));
    setLoadingTier(null);
    if (!res.ok) return alert(j.error || "Checkout failed");
    window.location.href = j.url;
  }

  async function manageBilling() {
    setBillingLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBillingLoading(false);
    if (!res.ok) return alert(j.error || "Billing portal failed");
    window.location.href = j.url;
  }

  const u = me?.user;

  return (
    <main style={{ display: "grid", gap: 12 }}>
      <h1>Dashboard</h1>

      {!me ? (
        <p>Loading…</p>
      ) : !u ? (
        <p>You are not logged in. Go to <a href="/login">Login</a>.</p>
      ) : (
        <>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <p style={{ margin: 0 }}><b>Email:</b> {u.email}</p>
            <p style={{ margin: "6px 0 0" }}><b>Plan:</b> {PLAN_LABEL[u.plan]}</p>
            <p style={{ margin: "6px 0 0" }}><b>Credits remaining:</b> {u.credits}</p>

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={manageBilling} disabled={billingLoading}>
                {billingLoading ? "Opening billing…" : "Manage billing / Cancel"}
              </button>
              <a href="/generate" style={{ alignSelf: "center" }}>Generate content</a>
              <button onClick={logout}>Logout</button>
            </div>
          </div>

          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>Upgrade</h3>
            <p style={{ marginTop: 0, color: "#555" }}>
              Monthly credits reset automatically. Choose a plan that fits your usage.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={() => upgrade("starter")} disabled={loadingTier !== null || u.plan === "starter"}>
                {u.plan === "starter" ? "Current: Starter" : (loadingTier === "starter" ? "Opening checkout…" : "Starter — £0.99/month (10 credits)")}
              </button>

              <button onClick={() => upgrade("creator")} disabled={loadingTier !== null || u.plan === "creator"}>
                {u.plan === "creator" ? "Current: Creator" : (loadingTier === "creator" ? "Opening checkout…" : "Creator — £4.99/month (50 credits)")}
              </button>

              <button onClick={() => upgrade("pro")} disabled={loadingTier !== null || u.plan === "pro"}>
                {u.plan === "pro" ? "Current: Pro" : (loadingTier === "pro" ? "Opening checkout…" : "Pro — £14.99/month (200 credits)")}
              </button>
            </div>

            <p style={{ marginBottom: 0, marginTop: 10, color: "#777", fontSize: 13 }}>
              Payments handled securely by Stripe. You can cancel anytime using “Manage billing”.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
