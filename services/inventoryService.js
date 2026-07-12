const db = require("../config/database");

/**
 * Membuat Batch Baru
 */
exports.createBatch = (batch) => {

    const stmt = db.prepare(`
        INSERT INTO batch
        (
            batch_code,
            batch_name,
            source_file,
            company,
            total_item,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        batch.batch_code,
        batch.batch_name,
        batch.source_file,
        batch.company || "PGI",
        batch.total_item,
        "ACTIVE",
        batch.created_at
    );

    return result.lastInsertRowid;

};

/**
 * Menyimpan Inventaris
 */
exports.insertInventaris = (items) => {

    const stmt = db.prepare(`
        INSERT INTO inventaris
        (
            batch_id,
            no,
            tanggal_masuk,
            jenis,
            merk,
            type,
            nf,
            gen,
            ram,
            imei,
            status,
            reject_reason,
            company,
            updated_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            CURRENT_TIMESTAMP
        )
    `);

    const insertMany = db.transaction((rows) => {

        for (const item of rows) {

        stmt.run(

            item.batch_id,
            item.no,
            item.tanggal_masuk,
            item.jenis,
            item.merk,
            item.type,
            item.nf,
            item.gen,
            item.ram,
            item.imei,
            item.status,
            item.reject_reason,
            item.company || "PGI"

);

        }

    });

    insertMany(items);

};

/**
 * Batch Aktif
 */
exports.getActiveBatch = (company = "PGI") => {

    return db.prepare(`
        SELECT *
        FROM batch
        WHERE company = ?
        AND status = 'ACTIVE'
        LIMIT 1
    `).get(company);

};

/**
 * Ambil Semua Inventaris
 */
exports.getAllInventaris = () => {

    return db.prepare(`
        SELECT *
        FROM inventaris
        ORDER BY no ASC
    `).all();

};

/**
 * Cari Inventaris berdasarkan NF
 */

/**
 * Update Status
 */
exports.countTotal = (batchId) => {

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM inventaris
        WHERE batch_id=?
    `).get(batchId);

};
exports.countPending = (batchId) => {

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM inventaris
        WHERE batch_id=?
        AND status='PENDING'
    `).get(batchId);

};
exports.countDone = (batchId) => {

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM inventaris
        WHERE batch_id=?
        AND status='DONE'
    `).get(batchId);

};
exports.countReject = (batchId) => {

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM inventaris
        WHERE batch_id=?
        AND status='REJECT'
    `).get(batchId);

};
exports.getDashboardSummary = (company = "PGI") => {

    const batch = exports.getActiveBatch(company);

    if (!batch) return null;

    const total = exports.countTotal(batch.id).total;

    const pending = exports.countPending(batch.id).total;

    const done = exports.countDone(batch.id).total;

    const reject = exports.countReject(batch.id).total;

    return {

        batch,

        total,

        pending,

        done,

        reject,

        progress:
            total === 0
                ? 0
                : Number((((done + reject) / total) * 100).toFixed(2))

    };

};
exports.getInventarisByBatch = (batchId) => {

    return db.prepare(`
        SELECT *
        FROM inventaris
        WHERE batch_id = ?
        ORDER BY no ASC
    `).all(batchId);

};
exports.searchInventaris = (
    batchId,
    keyword,
    status,
    jenis
) => {

    let sql = `
        SELECT *
        FROM inventaris
        WHERE batch_id = ?
    `;

    const params = [batchId];

    if (keyword) {
        sql += `
            AND (
                nf LIKE ?
                OR imei LIKE ?
                OR merk LIKE ?
                OR type LIKE ?
            )
        `;

        params.push(
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`
        );
    }

    if (status) {

        sql += `
            AND status = ?
        `;

        params.push(status);

    }

    if (jenis) {

    sql += `
        AND jenis = ?
    `;

    params.push(jenis);

}

    sql += `
        ORDER BY no ASC
    `;

    return db.prepare(sql).all(...params);

};
/**
 * Ambil 1 Inventaris berdasarkan ID
 */
exports.getById = (id) => {

    return db.prepare(`
        SELECT *
        FROM inventaris
        WHERE id = ?
    `).get(id);

};
// =====================================
// =====================================
// Cari Barang berdasarkan NF pada Batch Aktif
// =====================================

exports.findByNF = (barcode) => {

    return db.prepare(`
        SELECT *
        FROM inventaris
        WHERE
            TRIM(nf)=TRIM(?)
            OR
            TRIM(imei)=TRIM(?)
        LIMIT 1
    `).get(
        barcode,
        barcode
    );

};
// =====================================
// Cari dari banyak kandidat OCR
// =====================================

exports.findByCandidates = (candidates) => {

    for (const barcode of candidates) {

        const item = db.prepare(`
            SELECT *
            FROM inventaris
            WHERE
                TRIM(nf)=TRIM(?)
                OR
                TRIM(imei)=TRIM(?)
            LIMIT 1
        `).get(
            barcode,
            barcode
        );

        if (item) {

            return {

                item,

                barcode

            };

        }

    }

    return null;

};
// =====================================
// OCR - Update Status QC
// =====================================
exports.updateStatus = (
    barcode,
    status,
    rejectReason,
    photoPath
) => {

    db.prepare(`
        UPDATE inventaris
        SET
            status=?,
            reject_reason=?,
            photo_path=?,
            last_qc=datetime('now','localtime')
        WHERE
            TRIM(nf)=TRIM(?)
            OR
            TRIM(imei)=TRIM(?)
    `).run(
        status,
        rejectReason,
        photoPath,
        barcode,
        barcode
    );

};
// =====================================
// Cek NF pada Batch
// =====================================

exports.findNFInBatch = (batchId, nf, imei) => {

    return db.prepare(`
        SELECT id
        FROM inventaris
        WHERE batch_id = ?
        AND (
            nf = ?
            OR imei = ?
        )
        LIMIT 1
    `).get(
        batchId,
        nf,
        imei
    );

};
// =====================================
// Ambil Nomor Urut Terakhir
// =====================================

exports.getLastNo = (batchId) => {

    const row = db.prepare(`
        SELECT MAX(no) AS lastNo
        FROM inventaris
        WHERE batch_id = ?
    `).get(batchId);

    return row?.lastNo || 0;

};
// =====================================
// Import Tambahan (Append)
// =====================================

exports.insertInventarisAppend = (batchId, items) => {

    const stmt = db.prepare(`
        INSERT INTO inventaris
        (
            batch_id,
            no,
            tanggal_masuk,
            jenis,
            merk,
            type,
            nf,
            gen,
            ram,
            imei,
            status,
            reject_reason,
            company,
            updated_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            CURRENT_TIMESTAMP
        )
    `);

    let inserted = 0;
    let duplicate = 0;

    let nextNo =
    exports.getLastNo(batchId) + 1;

    const insertMany = db.transaction((rows) => {

        for (const item of rows) {

            const exist = exports.findNFInBatch(
                batchId,
                item.nf,
                item.imei
            );

            if (exist) {

                duplicate++;
                continue;

            }

            stmt.run(
                batchId,
                nextNo,
                item.tanggal_masuk,
                item.jenis,
                item.merk,
                item.type,
                item.nf,
                item.gen,
                item.ram,
                item.imei,
                "PENDING",
                "",
                item.company || "PGI"
);

            inserted++;
            nextNo++;

        }

    });

    insertMany(items);

    return {

        inserted,
        duplicate

    };

};
// =====================================
// Tutup Batch Aktif
// =====================================

exports.closeBatch = (company) => {

    return db.prepare(`
        UPDATE batch
        SET
            status = 'FINISHED',
            closed_at = datetime('now','localtime')
        WHERE company = ?
        AND status = 'ACTIVE'
    `).run(company);

};
// =====================================
// Cek apakah Batch Aktif boleh ditutup
// =====================================

exports.canCloseBatch = (company) => {

    const batch = exports.getActiveBatch(company);

    if (!batch) {

        return {
            canClose: false,
            pending: 0
        };

    }

    const row = db.prepare(`
        SELECT COUNT(*) AS total
        FROM inventaris
        WHERE batch_id = ?
        AND status = 'PENDING'
    `).get(batch.id);

    return {

        canClose: row.total === 0,

        pending: row.total

    };

};
// =====================================
// Manual QC dari Dashboard
// =====================================

exports.manualQC = (
    id,
    status,
    rejectReason
) => {

    return db.prepare(`
        UPDATE inventaris
        SET
            status = ?,
            reject_reason = ?,
            last_qc = datetime('now','localtime'),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(

        status,

        status === "REJECT"
            ? rejectReason
            : "",

        id

    );

};
// =====================================
// Reset QC (Edit QC)
// =====================================

exports.resetQC = (id) => {

    return db.prepare(`
        UPDATE inventaris
        SET
            status = 'PENDING',
            reject_reason = '',
            last_qc = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(id);

};