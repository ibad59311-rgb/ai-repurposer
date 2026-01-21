export default function Pricing() {
  return (
    <main style={{ display: "grid", gap: 12 }}>
      <h1>Pricing</h1>

      <p>
        A <b>generation</b> creates a set of marketing outputs from the text you provide, such as:
        a Twitter/X thread, a short-form video script, and a YouTube title + description.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p style={{ marginBottom: 0 }}>3 generations per month</p>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Starter</h3>
          <p style={{ marginBottom: 0 }}><b>£0.99 per month</b> — 10 generations per month</p>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Creator</h3>
          <p style={{ marginBottom: 0 }}><b>£4.99 per month</b> — 50 generations per month</p>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Pro</h3>
          <p style={{ marginBottom: 0 }}><b>£14.99 per month</b> — 200 generations per month</p>
        </div>
      </div>

      <p style={{ color: "#666" }}>
        Subscriptions are billed monthly and can be cancelled at any time through the billing portal.
      </p>
    </main>
  );
}
