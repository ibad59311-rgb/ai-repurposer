import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";

function planFromSub(sub: any): "starter" | "creator" | "pro" | "free" {
  const priceId = sub?.items?.data?.[0]?.price?.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_CREATOR) return "creator";
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  return "free";
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

  async function upsert(
    userId: string,
    patch: { status?: string; stripe_subscription_id?: string | null; current_period_end?: number | null; plan?: string | null }
  ) {
    const status = patch.status ?? "none";
    const plan = patch.plan ?? "free";
    const subId = patch.stripe_subscription_id ?? null;
    const cpe = patch.current_period_end ?? null;

    await sql`
      INSERT INTO subscriptions (user_id, stripe_subscription_id, status, plan, current_period_end, updated_at)
      VALUES (${userId}, ${subId}, ${status}, ${plan}, ${cpe}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
        status = COALESCE(EXCLUDED.status, subscriptions.status),
        plan = COALESCE(EXCLUDED.plan, subscriptions.plan),
        current_period_end = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
        updated_at = now()
    `;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = await userIdFromCustomer(s.customer);
        if (userId) {
          const plan = s?.metadata?.plan || "free";
          await upsert(userId, { status: "active", plan });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = await userIdFromCustomer(sub.customer);
        if (userId) {
          await upsert(userId, {
            status: sub.status,
            stripe_subscription_id: sub.id,
            current_period_end: sub.current_period_end ?? null,
            plan: planFromSub(sub),
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = await userIdFromCustomer(sub.customer);
        if (userId) await upsert(userId, { status: "canceled", plan: "free" });
        break;
      }
      default:
        break;
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Webhook handler failed", detail: e?.message ?? String(e) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
