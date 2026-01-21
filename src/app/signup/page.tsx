"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(j.error || "Signup failed");
    router.push("/dashboard");
  }

  return (
    <main>
      <h1>Sign up</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password (min 8 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Create account</button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </main>
  );
}

