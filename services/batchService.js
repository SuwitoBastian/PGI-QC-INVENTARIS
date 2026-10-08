const db = require("../config/database");

/**
 * Generate Batch Code
 * Contoh:
 * QC260702-001
 */
exports.generateBatchCode = (company) => {

    const now = new Date();

    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const prefix = `QC_${company}_${yy}${mm}${dd}`;

    const lastBatch = db.prepare(`
        SELECT batch_code
        FROM batch
        WHERE batch_code LIKE ?
        ORDER BY batch_code DESC
        LIMIT 1
    `).get(`${prefix}%`);

    let nomor = 1;

    if (lastBatch) {

        const lastNumber = parseInt(
            lastBatch.batch_code.split("_")[3]
        );

        nomor = lastNumber + 1;

    }

    return `${prefix}_${String(nomor).padStart(3, "0")}`;

};
const inventoryService = require("./inventoryService");

// =========================
// Batch Aktif
// =========================
exports.getActiveBatch = (company) => {

    return inventoryService.getActiveBatch(company);

};

// =========================
// Boleh Buat Batch Baru?
// =========================
exports.canCreateBatch = (company) => {

    return !inventoryService.hasActiveBatch(company);

};

// =========================
// Buat Batch
// =========================
exports.createBatch = (batch) => {

    return inventoryService.createBatch(batch);

};

// =========================
// Tutup Batch
// =========================
exports.closeBatch = (company) => {

    return inventoryService.closeBatch(company);

};

// =========================
// Validasi Close Batch
// =========================
exports.canCloseBatch = (company) => {

    return inventoryService.canCloseBatch(company);

};
exports.getHistory = (company) => {

    return db.prepare(`
        SELECT

            b.*,

            (
                SELECT COUNT(*)
                FROM inventaris i
                WHERE i.batch_id = b.id
            ) AS total,

            (
                SELECT COUNT(*)
                FROM inventaris i
                WHERE i.batch_id = b.id
                AND i.status = 'DONE'
            ) AS done,

            (
                SELECT COUNT(*)
                FROM inventaris i
                WHERE i.batch_id = b.id
                AND i.status = 'REJECT'
            ) AS reject,

            (
                SELECT COUNT(*)
                FROM inventaris i
                WHERE i.batch_id = b.id
                AND i.status = 'PENDING'
            ) AS pending

        FROM batch b

        WHERE b.company = ?
        AND b.status = 'FINISHED'

        ORDER BY b.closed_at DESC

    `).all(company);

};

// ==========================================
// Global Search Inventaris Riwayat
// ==========================================
exports.searchInventoryHistory = (
    company,
    keyword = "",
    status = "",
    jenis = ""
) => {

    const search = String(keyword || "").trim();
    const searchLike = `%${search}%`;

    let sql = `
        SELECT
            i.id,
            i.no,
            i.tanggal_masuk,
            i.jenis,
            i.merk,
            i.type,
            i.nf,
            i.gen,
            i.ram,
            i.imei,
            i.status,
            i.reject_reason,
            i.qc_name,
            i.ssd,
            i.ssd_health,
            i.bh,
            i.last_qc,
            i.company,

            b.id AS batch_id,
            b.batch_code,
            b.batch_name,
            b.closed_at

        FROM inventaris i

        INNER JOIN batch b
            ON b.id = i.batch_id

        WHERE b.company = ?
        AND b.status = 'FINISHED'

        AND (
            i.nf LIKE ?
            OR i.imei LIKE ?
            OR i.merk LIKE ?
            OR i.type LIKE ?
        )
    `;

    const params = [
        company,
        searchLike,
        searchLike,
        searchLike,
        searchLike
    ];

    if (status) {

        sql += `
            AND i.status = ?
        `;

        params.push(status);
    }

    if (jenis) {

        sql += `
            AND i.jenis = ?
        `;

        params.push(jenis);
    }

    sql += `
        ORDER BY
            b.closed_at DESC,
            i.no ASC
    `;

    return db.prepare(sql).all(...params);
};

// =========================
// Ambil Batch berdasarkan ID
// =========================
exports.getBatchById = (id) => {

    return db.prepare(`
        SELECT *
        FROM batch
        WHERE id = ?
    `).get(id);

};

// =========================
// Ambil Inventaris berdasarkan Batch
// =========================
exports.getInventarisByBatch = (batchId) => {

    return db.prepare(`
        SELECT *
        FROM inventaris
        WHERE batch_id = ?
        ORDER BY no ASC
    `).all(batchId);

};
// ==========================================
// Hapus Batch ACTIVE
// Reset Batch + Inventaris + Excel Booking
// Booking tetap dipertahankan
// ==========================================
exports.deleteBatch = (batchId, company) => {

    const batch = db.prepare(`
        SELECT *
        FROM batch
        WHERE id = ?
        AND company = ?
    `).get(
        batchId,
        company
    );

    if (!batch) {
        return {
            success: false,
            message: "Batch tidak ditemukan."
        };
    }


    // ==========================================
    // Hanya Batch ACTIVE
    // ==========================================

    if (batch.status !== "ACTIVE") {
        return {
            success: false,
            message: "Hanya Batch ACTIVE yang dapat dihapus."
        };
    }


    const transaction = db.transaction(() => {

        // ==========================================
        // Reset Booking
        // ==========================================

        if (batch.booking_id) {

            db.prepare(`
                UPDATE calendar_booking
                SET
                    excel_path = NULL,
                    excel_original_name = NULL,
                    excel_uploaded_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                batch.booking_id
            );

        }


        // ==========================================
        // Hapus Batch
        //
        // Inventaris akan ikut terhapus karena
        // foreign key batch_id -> batch.id
        // menggunakan ON DELETE CASCADE.
        // ==========================================

        db.prepare(`
            DELETE FROM batch
            WHERE id = ?
            AND company = ?
        `).run(
            batchId,
            company
        );

    });


    transaction();


    return {
        success: true,
        batch
    };
};