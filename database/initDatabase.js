const db = require("../config/database");

console.log("");
console.log("==================================");
console.log(" DATABASE INITIALIZER");
console.log("==================================");
console.log("");


// ==================================================
// HELPER - CEK COLUMN
// ==================================================

function columnExists(tableName, columnName) {

    const columns = db.prepare(`
        PRAGMA table_info(${tableName})
    `).all();

    return columns.some(column => column.name === columnName);
}


// ==================================================
// HELPER - TAMBAH COLUMN JIKA BELUM ADA
// ==================================================

function addColumnIfNotExists(tableName, columnName, definition) {

    if (!columnExists(tableName, columnName)) {

        db.prepare(`
            ALTER TABLE ${tableName}
            ADD COLUMN ${columnName} ${definition}
        `).run();

        console.log(
            `✅ Column ${tableName}.${columnName} berhasil ditambahkan`
        );

    }

}


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

    company TEXT,

    type TEXT NOT NULL,

    title TEXT NOT NULL,

    message TEXT,

    reference_id INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);
`).run();


// ==================================================
// MIGRATION ACTIVITY LOG
// ==================================================
//
// Database lama sudah mempunyai activity_log:
//
// id
// batch_id
// activity
// nf
// created_at
//
// Jangan hapus tabel lama.
// Tambahkan column baru jika belum tersedia.
//
// ==================================================

addColumnIfNotExists(
    "activity_log",
    "company",
    "TEXT"
);

addColumnIfNotExists(
    "activity_log",
    "type",
    "TEXT"
);

addColumnIfNotExists(
    "activity_log",
    "title",
    "TEXT"
);

addColumnIfNotExists(
    "activity_log",
    "message",
    "TEXT"
);

addColumnIfNotExists(
    "activity_log",
    "reference_id",
    "INTEGER"
);


// =====================
// TABEL CALENDAR BOOKING
// =====================

db.prepare(`
CREATE TABLE IF NOT EXISTS calendar_booking (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    company TEXT NOT NULL DEFAULT 'PGI',

    booking_date TEXT NOT NULL,

    asset_type TEXT,

    asset_count INTEGER DEFAULT 0,

    requester TEXT,

    location TEXT,

    notes TEXT,

    status TEXT NOT NULL DEFAULT 'TENTATIVE',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

);
`).run();


// =====================
// INDEX CALENDAR BOOKING
// =====================

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_calendar_booking_date
ON calendar_booking(booking_date);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_calendar_booking_company
ON calendar_booking(company);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_calendar_booking_status
ON calendar_booking(status);
`).run();


// =====================
// INDEX ACTIVITY LOG
// =====================

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
ON activity_log(created_at);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_activity_log_company
ON activity_log(company);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_activity_log_type
ON activity_log(type);
`).run();


// =====================
// INDEX BATCH
// =====================

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_batch_company
ON batch(company);
`).run();

db.prepare(`
CREATE INDEX IF NOT EXISTS idx_batch_status
ON batch(status);
`).run();


// =====================
// INDEX INVENTARIS
// =====================

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


console.log("");
console.log("==================================");
console.log(" DATABASE SIAP DIGUNAKAN");
console.log("==================================");
console.log("");