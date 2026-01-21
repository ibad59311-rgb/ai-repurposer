const Database = require("better-sqlite3");

const db = new Database("data.sqlite");

const yyyymm = new Date().toISOString().slice(0,7).replace("-", "");
const email = "ibad59311@gmail.com";

db.prepare(
  "UPDATE users SET credits = 10, credits_reset_yyyymm = ? WHERE email = ?"
).run(yyyymm, email);

console.log("Credits topped up to 10 for", email);
