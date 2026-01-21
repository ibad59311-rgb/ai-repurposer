export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { CREDITS, type Plan } from "@/lib/credits";

const PRICE_MAP: Record<string, { env: string; plan: Plan }> = {
  starter: { env: "STRIPE_PRICE_ID_STARTER", plan: "starter" },
  creator: { env: "STRIPE_PRICE_ID_CREATOR", plan: "creator" },
  pro: { env: "STRIPE_PRICE_ID_PRO", plan: "pro" },
};

const RANK: Record<Plan, number> = { free: 0, starter: 1, creator: 2, pro: 3 };

function yyyymmNow() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function syncCreditsNow(userId: string, plan: Plan) {
  const now = yyyymmNow();
  await sql`
    UPDATE users
    SET credits = ${CREDITS[plan]}, credits_reset_yyyymm = ${now}
    WHERE id = ${userId}
  `;
}

export async function POST(req: Request) {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { tier } = (await req.json().catch(() => ({}))) as { tier?: string };
  const chosen = tier && PRICE_MAP[tier] ? PRICE_MAP[tier] : null;
  if (!chosen) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const priceId = process.env[chosen.env];
  if (!priceId) return NextResponse.json({ error: `Missing ${chosen.env}` }, { status: 500 });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // user email
  const u = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
  const email = u.rows[0]?.email as string | undefined;
  if (!email) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // current subscription row (may be missing)
  const s = await sql`
    SELECT stripe_customer_id, stripe_subscription_id, status, plan
    FROM subscriptions
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  let customerId = (s.rows[0]?.stripe_customer_id as string | undefined) ?? null;
  const subId = (s.rows[0]?.stripe_subscription_id as string | undefined) ?? null;
  const status = (s.rows[0]?.status as string | undefined) ?? "none";
  const currentPlan = ((s.rows[0]?.plan as Plan | undefined) ?? "free");

  // Ensure customer exists
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });
    customerId = customer.id;

    await sql`
      INSERT INTO subscriptions (user_id, stripe_customer_id, status, plan)
      VALUES (${userId}, ${customerId}, 'none', 'free')
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        updated_at = NOW()
    `;
  }

  const isActive = status === "active" || status === "past_due";

  // If already on Pro, lock purchases; force Portal usage
  if (isActive && currentPlan === "pro") {
    return NextResponse.json(
      { error: "Already on Pro. Use Manage billing to change or cancel." },
      { status: 409 }
    );
  }

  // If active subscription exists, upgrade IN PLACE (prevents buying multiple subs)
  if (isActive && subId) {
    if (RANK[chosen.plan] <= RANK[currentPlan]) {
      return NextResponse.json(
        { error: "You can only upgrade to a higher plan from your current plan." },
        { status: 400 }
      );
    }

    // Retrieve subscription + item id
    const sub = await stripe.subscriptions.retrieve(subId);
    const itemId = sub.items?.data?.[0]?.id;
    if (!itemId) return NextResponse.json({ error: "Subscription item not found" }, { status: 500 });

    const updated = await stripe.subscriptions.update(subId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
    });

    // Update DB immediately (webhook will also keep it consistent)
    await sql`
      UPDATE subscriptions
      SET status = ${updated.status},
          plan = ${chosen.plan},
          stripe_subscription_id = ${updated.id},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    await syncCreditsNow(userId, chosen.plan);

    return NextResponse.json({ ok: true, upgraded: true });
  }

  // Otherwise: first-time purchase => Checkout
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId!,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    allow_promotion_codes: true,
    metadata: { user_id: userId, plan: chosen.plan },
  });

  return NextResponse.json({ url: session.url });
}

