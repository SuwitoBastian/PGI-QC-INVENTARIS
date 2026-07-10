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