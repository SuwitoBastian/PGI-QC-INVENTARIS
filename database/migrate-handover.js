const Database = require("better-sqlite3");

const db = new Database("./database/inventaris.db");

console.log("=== MIGRATION DIGITAL HANDOVER ===");

try {
    // ==========================================
    // 1. DIGITAL SIGNATURE
    // ==========================================

    db.exec(`
        CREATE TABLE IF NOT EXISTS digital_signature (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            jabatan TEXT,
            signature_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("PASS: digital_signature siap");


    // ==========================================
    // 2. HANDOVER DOCUMENT
    // ==========================================

    db.exec(`
        CREATE TABLE IF NOT EXISTS handover_document (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            batch_id INTEGER,
            booking_id INTEGER,

            direction TEXT NOT NULL,

            sender_name TEXT,
            sender_signature_path TEXT,

            receiver_name TEXT,
            receiver_signature_path TEXT,

            pdf_path TEXT,

            status TEXT NOT NULL DEFAULT 'PENDING',

            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            approved_by TEXT,
            approved_at DATETIME,

            FOREIGN KEY (batch_id)
                REFERENCES batch(id)
                ON DELETE CASCADE,

            FOREIGN KEY (booking_id)
                REFERENCES calendar_booking(id)
                ON DELETE CASCADE
        );
    `);

    console.log("PASS: handover_document siap");


    // ==========================================
    // 3. INDEX
    // ==========================================

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_digital_signature_status
        ON digital_signature(status);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_handover_batch_id
        ON handover_document(batch_id);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_handover_booking_id
        ON handover_document(booking_id);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_handover_direction
        ON handover_document(direction);
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_handover_status
        ON handover_document(status);
    `);

    console.log("PASS: index siap");

    console.log("");
    console.log("=== MIGRATION SELESAI ===");

} catch (error) {
    console.error("");
    console.error("MIGRATION GAGAL:");
    console.error(error);
    process.exitCode = 1;
} finally {
    db.close();
}