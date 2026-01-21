"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "starter" | "creator" | "pro";

export default function Pricing() {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(j => setLoggedIn(!!j.user))
      .catch(() => setLoggedIn(false));
  }, []);

  async function checkout(plan: Plan) {
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    setLoading(plan);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: plan }),
      });

      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || "Checkout failed");

      window.location.href = j.url;
    } catch {
      setLoading(null);
      alert("Unable to start checkout. Please try again.");
    }
  }

  return (
    <main className="grid fade-in" style={{ gap: 18 }}>
      <div className="card card-pad">
        <h1 className="h2" style={{ marginBottom: 6 }}>Pricing</h1>
        <p className="p">Choose a plan that fits your workflow.</p>
      </div>

      <div className="split">
        {/* Starter */}
        <div className="section card">
          <h3>Starter</h3>
          <p className="p">For light usage and testing.</p>
          <div className="h2">£0.99 / month</div>
          <ul className="p">
            <li>10 generations / month</li>
            <li>Email support</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading !== null}
            onClick={() => checkout("starter")}
          >
            {loading === "starter" ? "Redirecting…" : "Choose Starter"}
          </button>
        </div>

        {/* Creator */}
        <div className="section card">
          <h3>Creator</h3>
          <p className="p">Best for regular content creators.</p>
          <div className="h2">£4.99 / month</div>
          <ul className="p">
            <li>50 generations / month</li>
            <li>Priority processing</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading !== null}
            onClick={() => checkout("creator")}
          >
            {loading === "creator" ? "Redirecting…" : "Choose Creator"}
          </button>
        </div>

        {/* Pro */}
        <div className="section card">
          <h3>Pro</h3>
          <p className="p">High-volume, professional usage.</p>
          <div className="h2">£14.99 / month</div>
          <ul className="p">
            <li>200 generations / month</li>
            <li>Highest priority</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading !== null}
            onClick={() => checkout("pro")}
          >
            {loading === "pro" ? "Redirecting…" : "Choose Pro"}
          </button>
        </div>
      </div>
    </main>
  );
}
