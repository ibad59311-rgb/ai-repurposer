import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, cookieName } from "@/lib/auth";
import { sql } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const token = (await cookies()).get(cookieName)?.value;
  const userId = verifySession(token);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const subRes = await sql`
    SELECT stripe_customer_id
    FROM subscriptions
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  const customerId = subRes.rows[0]?.stripe_customer_id as string | undefined;
  if (!customerId) return NextResponse.json({ error: "No Stripe customer for user" }, { status: 400 });

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}

