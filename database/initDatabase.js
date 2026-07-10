const db = require("../config/database");

console.log("");
console.log("==================================");
console.log(" DATABASE INITIALIZER");
console.log("==================================");
console.log("");

// =====================
// TABEL BATCH
// =====================
db.prepare(`
CREATE TABLE IF NOT EXISTS batch (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    batch_code TEXT UNIQUE NOT NULL,

    batch_name TEXT NOT NULL,

    source_file TEXT,

    company TEXT NOT NULL DEFAULT 'PGI',

    total_item INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    closed_at DATETIME

);
`).run();


// =====================
// TABEL INVENTARIS
// =====================
db.prepare(`
CREATE TABLE IF NOT EXISTS inventaris (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    batch_id INTEGER NOT NULL,

    no INTEGER,

    tanggal_masuk TEXT,

    jenis TEXT,

    merk TEXT,

    type TEXT,

    nf TEXT NOT NULL,

    gen TEXT,

    ram TEXT,

    imei TEXT,

    status TEXT DEFAULT 'PENDING',

    reject_reason TEXT,

    last_qc DATETIME,

    photo_path TEXT,

    company TEXT NOT NULL DEFAULT 'PGI',

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(batch_id)
        REFERENCES batch(id)
        ON DELETE CASCADE

);
`).run();


// =====================
// TABEL ACTIVITY LOG
// =====================
db.prepare(`
CREATE TABLE IF NOT EXISTS activity_log (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    batch_id INTEGER,

    activity TEXT,

    nf TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(batch_id)
        REFERENCES batch(id)
        ON DELETE CASCADE

);
`).run();


// =====================
// INDEX
// =====================

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_batch_company
ON batch(company);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_batch_status
ON batch(status);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_inventory_batch
ON inventaris(batch_id);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_inventory_nf
ON inventaris(nf);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_inventory_company
ON inventaris(company);
`).run();

console.log("✅ Semua tabel berhasil dibuat");
console.log("✅ Semua index berhasil dibuat");

console.log("");
console.log("==================================");
console.log(" DATABASE SIAP DIGUNAKAN");
console.log("==================================");
console.log("");