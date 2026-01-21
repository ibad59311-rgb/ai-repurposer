import { sql } from "@/lib/db";

export type Plan = "free" | "starter" | "creator" | "pro";

export const CREDITS: Record<Plan, number> = {
  free: 3,
  starter: 10,
  creator: 50,
  pro: 200,
};

function yyyymmNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

export async function getPlan(userId: string): Promise<Plan> {
  const { rows } = await sql`
    SELECT status, plan
    FROM subscriptions
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  const status = rows[0]?.status as string | undefined;
  const plan = rows[0]?.plan as Plan | undefined;

  if (status === "active" || status === "past_due") {
    if (plan === "starter" || plan === "creator" || plan === "pro") return plan;
    return "pro";
  }
  return "free";
}

export async function ensureMonthlyCredits(userId: string) {
  const now = yyyymmNow();

  const u = await sql`
    SELECT credits_reset_yyyymm
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const last = u.rows[0]?.credits_reset_yyyymm as string | undefined;
  if (!last) return;

  if (last !== now) {
    const plan = await getPlan(userId);
    await sql`
      UPDATE users
      SET credits = ${CREDITS[plan]}, credits_reset_yyyymm = ${now}
      WHERE id = ${userId}
    `;
  }
}
