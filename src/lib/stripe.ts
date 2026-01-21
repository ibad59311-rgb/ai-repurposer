import Stripe from "stripe";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"), {
  // Stripe SDK accepts this string; exact version is not critical for local dev.
  apiVersion: "2024-06-20",
});
