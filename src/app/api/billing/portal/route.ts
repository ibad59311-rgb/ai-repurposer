import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

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

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
