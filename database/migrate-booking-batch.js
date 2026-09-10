const db = require("../config/database");

console.log("");
console.log("======================================");
console.log(" MIGRATION BOOKING → BATCH");
console.log("======================================");
console.log("");

// ======================================
// BATCH
// Tambahkan booking_id
// ======================================

const batchColumns = db
    .prepare("PRAGMA table_info(batch)")
    .all();

const hasBookingId = batchColumns.some(
    column => column.name === "booking_id"
);

if (!hasBookingId) {
    db.prepare(`
        ALTER TABLE batch
        ADD COLUMN booking_id INTEGER
    `).run();

    console.log("✅ batch.booking_id ditambahkan");
} else {
    console.log("ℹ️ batch.booking_id sudah ada");
}


// ======================================
// CALENDAR BOOKING
// Tambahkan informasi Excel
// ======================================

const calendarColumns = db
    .prepare("PRAGMA table_info(calendar_booking)")
    .all();

const hasExcelPath = calendarColumns.some(
    column => column.name === "excel_path"
);

const hasExcelOriginalName = calendarColumns.some(
    column => column.name === "excel_original_name"
);

const hasExcelUploadedAt = calendarColumns.some(
    column => column.name === "excel_uploaded_at"
);


// --------------------------------------
// excel_path
// --------------------------------------

if (!hasExcelPath) {
    db.prepare(`
        ALTER TABLE calendar_booking
        ADD COLUMN excel_path TEXT
    `).run();

    console.log("✅ calendar_booking.excel_path ditambahkan");
} else {
    console.log("ℹ️ calendar_booking.excel_path sudah ada");
}


// --------------------------------------
// excel_original_name
// --------------------------------------

if (!hasExcelOriginalName) {
    db.prepare(`
        ALTER TABLE calendar_booking
        ADD COLUMN excel_original_name TEXT
    `).run();

    console.log(
        "✅ calendar_booking.excel_original_name ditambahkan"
    );
} else {
    console.log(
        "ℹ️ calendar_booking.excel_original_name sudah ada"
    );
}


// --------------------------------------
// excel_uploaded_at
// --------------------------------------

if (!hasExcelUploadedAt) {
    db.prepare(`
        ALTER TABLE calendar_booking
        ADD COLUMN excel_uploaded_at DATETIME
    `).run();

    console.log(
        "✅ calendar_booking.excel_uploaded_at ditambahkan"
    );
} else {
    console.log(
        "ℹ️ calendar_booking.excel_uploaded_at sudah ada"
    );
}


// ======================================
// INDEX
// ======================================

db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_batch_booking_id
    ON batch(booking_id)
`).run();

console.log("✅ Index batch.booking_id siap");


// ======================================
// SELESAI
// ======================================

console.log("");
console.log("======================================");
console.log(" MIGRATION SELESAI");
console.log("======================================");
console.log("");