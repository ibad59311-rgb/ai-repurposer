import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const PRICE_MAP: Record<string, { env: string; plan: string }> = {
  starter: { env: "STRIPE_PRICE_ID_STARTER", plan: "starter" },
  creator: { env: "STRIPE_PRICE_ID_CREATOR", plan: "creator" },
  pro: { env: "STRIPE_PRICE_ID_PRO", plan: "pro" },
};

function safeErr(e: any) {
  return {
    name: e?.name ?? "Error",
    message: e?.message ?? String(e),
    type: e?.type ?? null,
    code: e?.code ?? null,
    status: e?.status ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get(cookieName)?.value;
    const userId = verifySession(token);
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { tier?: string };
    const tier = body?.tier;
    const chosen = tier && PRICE_MAP[tier] ? PRICE_MAP[tier] : null;
    if (!chosen) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    const priceId = process.env[chosen.env];
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    if (!priceId) return NextResponse.json({ error: `Missing ${chosen.env}` }, { status: 500 });

    // quick env sanity (does not leak secret)
    const sk = process.env.STRIPE_SECRET_KEY || "";
    if (!sk) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    if (!sk.startsWith("sk_test_") && !sk.startsWith("sk_live_")) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY looks invalid (must start sk_test_ or sk_live_)" }, { status: 500 });
    }

    const user = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const subRow = db.prepare("SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?").get(userId) as { stripe_customer_id?: string } | undefined;
    let customerId = subRow?.stripe_customer_id || null;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: userId } });
      customerId = customer.id;

      db.prepare(`
        INSERT INTO subscriptions (user_id, stripe_customer_id, status, plan)
        VALUES (?, ?, 'none', 'free')
        ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id, updated_at=datetime('now')
      `).run(userId, customerId);
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
  } catch (e: any) {
    const detail = safeErr(e);
    console.error("checkout error:", detail);
    return NextResponse.json({ error: "Checkout failed", detail }, { status: detail.status ?? 500 });
  }
}
