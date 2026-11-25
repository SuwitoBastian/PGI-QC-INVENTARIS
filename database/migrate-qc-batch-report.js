const db = require("../config/database");

console.log("=== MIGRATION QC BATCH REPORT ===");

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS qc_batch_report (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL UNIQUE,
            company TEXT NOT NULL,
            report_text TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),
            attempts INTEGER NOT NULL DEFAULT 0,
            sending_at DATETIME,
            sent_at DATETIME,
            wa_message_id TEXT,
            last_error TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_qc_batch_report_status
        ON qc_batch_report(status);
    `);

    console.log("PASS: tabel qc_batch_report siap.");
    console.log("=== MIGRATION SELESAI ===");
} catch (error) {
    console.error("MIGRATION GAGAL:", error);
    process.exitCode = 1;
}
