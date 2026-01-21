"use client";

async function manageBilling() {
  const res = await fetch("/api/billing/portal", { method: "POST" });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(j?.error || "Could not open billing portal");
    return;
  }
  if (j.url) window.location.href = j.url;
}


import { useEffect, useState } from "react";

);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(j?.error || "Could not open billing portal");
    return;
  }
  if (j.url) window.location.href = j.url;
}
import { useRouter, useSearchParams } from "next/navigation";


);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(j?.error || "Could not open billing portal");
    return;
  }
  if (j.url) window.location.href = j.url;
}
type Plan = "free" | "starter" | "creator" | "pro";
type Me = { user: { id: string; email: string; credits: number; plan: Plan } | null };

export default function DashboardClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();

  const upgraded = sp.get("upgraded");
  const canceled = sp.get("canceled");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: Me) => setMe(j))
      .catch(() => setMe({ user: null }));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const u = me?.user;

  return (
    <main>
      <h1>Dashboard</h1>

      {upgraded === "1" && (
        <div className="card card-pad" style={{ borderColor: "rgba(124,58,237,.35)", marginBottom: 12 }}>
          Subscription updated.
          <button onClick={manageBilling}>Manage billing</button>
</div>
      )}
      {canceled === "1" && (
        <div className="card card-pad" style={{ borderColor: "rgba(255,255,255,.12)", marginBottom: 12 }}>
          Checkout canceled.
        </div>
      )}

      {!me ? (
        <p>Loading…</p>
      ) : !u ? (
        <p>
          You are not logged in. Go to <a href="/login">Login</a>.
        </p>
      ) : (
        <>
          <div className="card card-pad" style={{ display: "grid", gap: 8 }}>
            <div><b>Email:</b> {u.email}</div>
            <div><b>Plan:</b> {u.plan}</div>
            <div><b>Credits:</b> {u.credits}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <a className="btn btn-primary" href="/generate">Generate</a>
              <a className="btn" href="/pricing">Pricing</a>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>
        </>
      )}

      {err && <p style={{ color: "salmon", marginTop: 12 }}>{err}</p>}
    </main>
  );
}




