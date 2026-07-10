const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Pastikan folder database ada
const dbFolder = path.join(__dirname, "..", "database");

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder);
}

// Lokasi database
const dbPath = path.join(dbFolder, "inventaris.db");

// Membuka / membuat database
const db = new Database(dbPath);

console.log("✅ SQLite Connected");

module.exports = db;