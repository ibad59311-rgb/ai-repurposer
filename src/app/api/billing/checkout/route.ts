import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const PRICE_MAP: Record<string, { env: string; plan: "starter" | "creator" | "pro" }> = {
  starter: { env: "STRIPE_PRICE_ID_STARTER", plan: "starter" },
  creator: { env: "STRIPE_PRICE_ID_CREATOR", plan: "creator" },
  pro: { env: "STRIPE_PRICE_ID_PRO", plan: "pro" },
};

export async function POST(req: Request) {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { tier } = (await req.json().catch(() => ({}))) as { tier?: string };
  const chosen = tier && PRICE_MAP[tier] ? PRICE_MAP[tier] : null;
  if (!chosen) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const priceId = process.env[chosen.env];
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  if (!priceId) return NextResponse.json({ error: `Missing ${chosen.env}` }, { status: 500 });

  const userRes = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
  const email = userRes.rows[0]?.email as string | undefined;
  if (!email) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const subRes = await sql`
    SELECT stripe_customer_id
    FROM subscriptions
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  let customerId = (subRes.rows[0]?.stripe_customer_id as string | undefined) ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });
    customerId = customer.id;

    await sql`
      INSERT INTO subscriptions (user_id, stripe_customer_id, status, plan)
      VALUES (${userId}, ${customerId}, 'none', 'free')
      ON CONFLICT (user_id) DO UPDATE
      SET stripe_customer_id = EXCLUDED.stripe_customer_id,
          updated_at = now()
    `;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard?canceled=1`,
    allow_promotion_codes: true,
    metadata: { user_id: userId, plan: chosen.plan },
  });

  return NextResponse.json({ url: session.url });
}
