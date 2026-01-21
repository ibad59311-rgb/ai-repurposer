"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Plan = "free" | "starter" | "creator" | "pro";
type Me = { user: { id: string; email: string; credits: number; plan: Plan } | null };

function supportForPlan(plan: Plan) {
  switch (plan) {
    case "starter":
      return { label: "Email support", eta: "Typical response: 48–72 hours" };
    case "creator":
      return { label: "Priority email support", eta: "Typical response: 24–48 hours" };
    case "pro":
      return { label: "Priority email support (fastest)", eta: "Typical response: 12–24 hours" };
    default:
      return { label: "Email support (best effort)", eta: "Typical response: 3–5 days" };
  }
}

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setMe).catch(() => setMe({ user: null }));
  }, []);

  const u = me?.user;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function openPortal() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.url) throw new Error(j.error || "Portal request failed");
      window.location.href = j.url;
    } catch (e: any) {
      setErr(e?.message || "Portal request failed");
    } finally {
      setBusy(false);
    }
  }

  function contactSupport() {
    if (!u) return;
    const to = "support.greensharkry@hotmail.com";
    const subject = encodeURIComponent(`[AI Repurposer] Support (${u.plan})`);
    const body = encodeURIComponent(
`Describe the issue:

---
Account:
- Email: ${u.email}
- User ID: ${u.id}
- Plan: ${u.plan}
- Time: ${new Date().toISOString()}
---
Steps to reproduce:
1)
2)
3)

Expected:
Actual:

(Attach screenshots if helpful.)
`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  const upgraded = sp.get("upgraded") === "1";

  return (
    <main className="grid fade-in" style={{ gap: 16 }}>
      <div className="card card-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 6 }}>Dashboard</h1>
            <p className="p">Manage your plan and generate content.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href="/generate">Generate</a>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
        </div>

        <hr className="hr" />

        {!me ? (
          <p className="p">Loading…</p>
        ) : !u ? (
          <p className="p">
            You are not logged in. Go to <a href="/login">Login</a>.
          </p>
        ) : (
          <>
            {upgraded && <div className="pill" style={{ marginBottom: 12 }}>Subscription updated</div>}

            <div className="split">
              <div className="section">
                <h3>Account</h3>
                <div className="kpi"><span>Email</span> <b>{u.email}</b></div>
                <div className="kpi" style={{ marginTop: 8 }}><span>Plan</span> <b style={{ textTransform: "capitalize" }}>{u.plan}</b></div>
                <div className="kpi" style={{ marginTop: 8 }}><span>Credits</span> <b>{u.credits}</b></div>

                <hr className="hr" />

                <h3>Support</h3>
                <div className="kpi">
                  <span>Level</span>
                  <b>{supportForPlan(u.plan).label}</b>
                </div>
                <p className="p" style={{ marginTop: 8 }}>{supportForPlan(u.plan).eta}</p>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button className="btn" onClick={contactSupport}>Contact support</button>
                  <a className="btn" href="/terms">Terms</a>
                  <a className="btn" href="/privacy">Privacy</a>
                </div>
              </div>

              <div className="section">
                <h3>Billing</h3>
                <p className="p" style={{ marginBottom: 12 }}>
                  Manage your subscription, invoices, and cancellation in the billing portal.
                </p>

                <button
                  className="btn btn-primary"
                  onClick={openPortal}
                  disabled={busy}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {busy ? "Opening billing portal…" : "Manage billing"}
                </button>

                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <a className="btn" href="/pricing">View pricing</a>
                  <a className="btn" href="/generate">Use generator</a>
                </div>

                {err && <p style={{ color: "salmon", marginTop: 10 }}>{err}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
