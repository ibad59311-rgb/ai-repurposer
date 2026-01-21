import Stripe from "stripe";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));
