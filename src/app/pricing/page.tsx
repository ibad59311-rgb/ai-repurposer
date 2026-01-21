"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "free" | "starter" | "creator" | "pro";
type Me = { user: { id: string; email: string; credits: number; plan: Plan } | null };

const RANK: Record<Plan, number> = { free: 0, starter: 1, creator: 2, pro: 3 };

export default function PricingPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const plan: Plan = me?.user?.plan ?? "free";

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setMe).catch(() => setMe({ user: null }));
  }, []);

  const tiers = useMemo(() => ([
    { key: "starter", name: "Starter", price: "£0.99 / mo", credits: "10 credits / month" },
    { key: "creator", name: "Creator", price: "£4.99 / mo", credits: "50 credits / month" },
    { key: "pro", name: "Pro", price: "£14.99 / mo", credits: "200 credits / month" },
  ] as const), []);

  async function buy(tier: "starter" | "creator" | "pro") {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tier }),
    });

    const j = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(j?.error || "Checkout failed");
      return;
    }

    if (j.url) {
      window.location.href = j.url;
      return;
    }

    // upgrade-in-place path
    router.push("/dashboard?upgraded=1");
    router.refresh();
  }

  function disabledFor(tierPlan: Plan) {
    if (!me?.user) return false; // allow browsing; checkout will enforce login
    if (plan === "pro") return true; // lock purchases on Pro (must cancel/change in portal)
    return RANK[tierPlan] <= RANK[plan]; // only higher plans clickable
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>Pricing</h1>
      <p style={{ opacity: 0.85, margin: 0 }}>
        Free plan includes monthly credits. Paid plans increase monthly credits.
      </p>

      {me?.user ? (
        <div style={{ opacity: 0.9 }}>
          Current plan: <b>{plan}</b> • Credits: <b>{me.user.credits}</b>
        </div>
      ) : (
        <div style={{ opacity: 0.9 }}>
          You are not logged in. Purchases require login.
        </div>
      )}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {tiers.map(t => {
          const isDisabled = disabledFor(t.key as Plan);
          return (
            <div key={t.key} style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 14,
              background: "rgba(255,255,255,0.03)"
            }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 22, marginTop: 6 }}>{t.price}</div>
              <div style={{ opacity: 0.85, marginTop: 6 }}>{t.credits}</div>

              <button
                onClick={() => buy(t.key)}
                disabled={isDisabled}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: isDisabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)",
                  cursor: isDisabled ? "not-allowed" : "pointer"
                }}
              >
                {plan === "pro"
                  ? "Manage billing to change"
                  : isDisabled
                    ? "Current / Lower"
                    : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ opacity: 0.8 }}>
        To cancel or change billing details, use <a href="/dashboard">Manage billing</a>.
      </div>
    </main>
  );
}
