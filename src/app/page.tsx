import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1 style={{ fontSize: 44, margin: "18px 0 8px" }}>Repurpose any transcript into posts.</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 700 }}>
        Paste a transcript (or video text) and get a Twitter/X thread, a Shorts script, and a YouTube title + description.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <Link href="/signup" style={{ padding: "10px 14px", border: "1px solid #000", borderRadius: 10, textDecoration: "none" }}>Start free</Link>
        <Link href="/generate" style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>Try generator</Link>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h2>Pricing</h2>
      <ul>
        <li><b>Free:</b> 3 generations total</li>
        <li><b>Pro:</b> £12/month (coming next step) for 100 generations/month</li>
      </ul>

      <p style={{ color: "#666" }}>
        This is v1. Next we add Stripe subscriptions and production deployment.
      </p>
    </main>
  );
}
