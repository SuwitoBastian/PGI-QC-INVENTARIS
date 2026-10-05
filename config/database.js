
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbFolder = path.join(__dirname, "..", "database");

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

const dbMode = process.env.DB_MODE || "production";

if (!["production", "testing"].includes(dbMode)) {
    throw new Error("DB_MODE harus production atau testing.");
}

const dbFile =
    dbMode === "testing"
        ? "inventaris-testing.db"
        : "inventaris.db";

const dbPath = path.join(dbFolder, dbFile);

// Jangan membuat database testing kosong tanpa sengaja.
if (dbMode === "testing" && !fs.existsSync(dbPath)) {
    throw new Error("Database testing tidak ditemukan: " + dbPath);
}

const db = new Database(dbPath);

console.log("SQLite Connected");
console.log("Mode:", dbMode);
console.log("Database:", dbPath);

module.exports = db;
