export default function Privacy() {
  return (
    <main style={{ display: "grid", gap: 10 }}>
      <h1>Privacy Policy</h1>

      <p>
        This Policy explains what information we collect and how we use it when you use the Service.
      </p>

      <h3>1. Information we collect</h3>
      <ul>
        <li><b>Account information:</b> email address.</li>
        <li><b>Usage data:</b> records of generations, including inputs and outputs, to provide the Service and maintain reliability.</li>
        <li><b>Billing information:</b> subscription status and identifiers from Stripe (we do not store card details).</li>
      </ul>

      <h3>2. How we use information</h3>
      <ul>
        <li>To provide and operate the Service.</li>
        <li>To manage subscriptions and customer support.</li>
        <li>To prevent abuse, fraud, and security incidents.</li>
      </ul>

      <h3>3. Payments</h3>
      <p>
        Payments are processed by Stripe. We do not receive or store your full payment card information.
      </p>

      <h3>4. Data retention</h3>
      <p>
        We retain account and generation data for as long as needed to provide the Service, comply with legal obligations, and enforce our Terms.
      </p>

      <h3>5. Your choices</h3>
      <p>
        You may request account deletion by contacting <b>support@yourdomain.com</b> (replace with your support email).
      </p>
    </main>
  );
}
