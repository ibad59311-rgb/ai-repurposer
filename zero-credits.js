const Database = require("better-sqlite3");

const db = new Database("data.sqlite");
const email = "ibad59311@gmail.com";

db.prepare("UPDATE users SET credits = 0 WHERE email = ?").run(email);

console.log("Credits set to 0 for", email);
