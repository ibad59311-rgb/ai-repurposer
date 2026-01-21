const Database = require("better-sqlite3");

const db = new Database("data.sqlite");

// Create subscriptions table if missing (safe)
db.exec(`
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'none',
  plan TEXT NOT NULL DEFAULT 'free',
  current_period_end INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Add users.credits_reset_yyyymm safely (constant default only)
const ucols = db.prepare("PRAGMA table_info(users)").all().map(r => r.name);
if (!ucols.includes("credits_reset_yyyymm")) {
  // Constant default is required for ALTER TABLE ADD COLUMN in SQLite
  db.exec(`ALTER TABLE users ADD COLUMN credits_reset_yyyymm TEXT NOT NULL DEFAULT '000000'`);
}

// Backfill to current YYYYMM for existing rows
db.exec(`UPDATE users SET credits_reset_yyyymm = strftime('%Y%m','now') WHERE credits_reset_yyyymm = '000000' OR credits_reset_yyyymm IS NULL OR credits_reset_yyyymm = ''`);

console.log("DB migration OK");
