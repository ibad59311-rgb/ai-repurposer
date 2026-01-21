import { db } from "./db";

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

export function getPlan(userId: string): Plan {
  const row = db.prepare("SELECT status, plan FROM subscriptions WHERE user_id = ?").get(userId) as { status?: string; plan?: string } | undefined;
  const status = row?.status;
  const plan = row?.plan as Plan | undefined;

  if (status === "active" || status === "past_due") {
    if (plan === "starter" || plan === "creator" || plan === "pro") return plan;
    return "pro";
  }
  return "free";
}

export function ensureMonthlyCredits(userId: string) {
  const now = yyyymmNow();
  const user = db.prepare("SELECT credits_reset_yyyymm FROM users WHERE id = ?").get(userId) as { credits_reset_yyyymm: string } | undefined;
  if (!user) return;

  if (user.credits_reset_yyyymm !== now) {
    const plan = getPlan(userId);
    db.prepare("UPDATE users SET credits = ?, credits_reset_yyyymm = ? WHERE id = ?").run(CREDITS[plan], now, userId);
  }
}
