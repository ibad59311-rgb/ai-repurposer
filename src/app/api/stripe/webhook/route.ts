import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

function planFromSub(sub: any): "starter" | "creator" | "pro" | "free" {
  const priceId = sub?.items?.data?.[0]?.price?.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_CREATOR) return "creator";
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  return "free";
}

function creditsFor(plan: "free" | "starter" | "creator" | "pro") {
  if (plan === "starter") return 10;
  if (plan === "creator") return 50;
  if (plan === "pro") return 200;
  return 3;
}

function topUpCreditsNow(userId: string, plan: "free" | "starter" | "creator" | "pro") {
  const yyyymm = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM
  const target = creditsFor(plan);

  db.prepare(`
    UPDATE users
    SET credits = CASE WHEN credits < ? THEN ? ELSE credits END,
        credits_reset_yyyymm = ?
    WHERE id = ?
  `).run(target, target, yyyymm, userId);
}

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whsec) return NextResponse.json({ error: "Missing webhook secret/signature" }, { status: 400 });

  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whsec);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  async function userIdFromCustomer(customerId: string): Promise<string | null> {
    const customer = await stripe.customers.retrieve(customerId);
    const meta = (customer as any)?.metadata;
    return meta?.user_id ?? null;
  }

  function upsert(userId: string, patch: { status?: string; stripe_subscription_id?: string | null; current_period_end?: number | null; plan?: string | null }) {
    db.prepare(`
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end)
      VALUES (?, NULL, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
        status = COALESCE(excluded.status, subscriptions.status),
        plan = COALESCE(excluded.plan, subscriptions.plan),
        current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
        updated_at = datetime('now')
    `).run(userId, patch.stripe_subscription_id ?? null, patch.status ?? "none", patch.plan ?? "free", patch.current_period_end ?? null);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = await userIdFromCustomer(s.customer);
        if (userId) {
          const plan = (s?.metadata?.plan || "free") as "free" | "starter" | "creator" | "pro";
          upsert(userId, { status: "active", plan });
          topUpCreditsNow(userId, plan);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = await userIdFromCustomer(sub.customer);
        if (userId) {
          const plan = planFromSub(sub);
          upsert(userId, {
            status: sub.status,
            stripe_subscription_id: sub.id,
            current_period_end: sub.current_period_end ?? null,
            plan,
          });
          if (sub.status === "active" || sub.status === "past_due") {
            topUpCreditsNow(userId, plan);
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = await userIdFromCustomer(sub.customer);
        if (userId) {
          upsert(userId, { status: "canceled", plan: "free" });
          topUpCreditsNow(userId, "free");
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
