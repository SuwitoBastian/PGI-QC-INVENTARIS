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
            created_at,
            booking_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        batch.batch_code,
        batch.batch_name,
        batch.source_file,
        batch.company || "PGI",
        batch.total_item,
        "ACTIVE",
        batch.created_at,
        batch.booking_id || null
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

/**
 * Total seluruh inventaris berdasarkan company
 * Mencakup semua batch, bukan hanya batch aktif.
 */
exports.getTotalInventarisByCompany = (company = "PGI") => {
    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM inventaris
        WHERE company = ?
    `).get(company).total;
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

    const jenisFilter = String(jenis)
        .trim()
        .toLowerCase();

    if (jenisFilter === "laptop") {

        sql += `
            AND (
                LOWER(TRIM(jenis)) = 'laptop'
                OR LOWER(TRIM(jenis)) LIKE 'laptop %'
            )
        `;

    } else {

        sql += `
            AND LOWER(TRIM(jenis)) = LOWER(TRIM(?))
        `;

        params.push(jenis);

    }
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
// Prioritas:
// 1. Inventory PENDING
// 2. Batch ACTIVE
// 3. Jika lebih dari 1 kandidat/item cocok,
//    jangan asal pilih
// =====================================

exports.findByCandidates = (candidates) => {

    if (!Array.isArray(candidates) || candidates.length === 0) {
        return null;
    }

    for (const barcode of candidates) {

        const rows = db.prepare(`
            SELECT
                i.*,
                b.batch_code,
                b.company AS batch_company,
                b.status AS batch_status
            FROM inventaris i
            INNER JOIN batch b
                ON b.id = i.batch_id
            WHERE
                (
                    TRIM(i.nf) = TRIM(?)
                    OR
                    TRIM(i.imei) = TRIM(?)
                )
                AND b.status = 'ACTIVE'
            ORDER BY
                CASE
                    WHEN i.status = 'PENDING' THEN 0
                    ELSE 1
                END,
                i.id DESC
        `).all(
            barcode,
            barcode
        );

        if (!rows.length) {
            continue;
        }

        // =====================================
        // Prioritaskan item PENDING
        // =====================================

        const pendingRows = rows.filter(
            item => item.status === "PENDING"
        );

        // =====================================
        // Jika hanya ada 1 PENDING
        // → aman dipilih
        // =====================================

        if (pendingRows.length === 1) {

            return {
                item: pendingRows[0],
                barcode,
                ambiguous: false
            };

        }

        // =====================================
        // Jika ada >1 PENDING
        // → jangan tebak
        // =====================================

        if (pendingRows.length > 1) {

            return {
                item: null,
                barcode,
                ambiguous: true,
                matches: pendingRows
            };

        }

        // =====================================
        // Kalau tidak ada PENDING,
        // berarti semua sudah diproses
        // → tetap ambil satu untuk memberi
        // informasi status lama
        // =====================================

        return {
            item: rows[0],
            barcode,
            ambiguous: false
        };
    }

    return null;
};
// =====================================
// OCR - Update Status QC berdasarkan ID
// =====================================

exports.updateStatusById = (
    id,
    status,
    rejectReason,
    photoPath
) => {

    if (!id) {
        throw new Error(
            "ID inventaris tidak ditemukan."
        );
    }

    const result = db.prepare(`
        UPDATE inventaris
        SET
            status = ?,
            reject_reason = ?,
            photo_path = ?,
            last_qc = datetime('now','localtime'),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND status = 'PENDING'
    `).run(
        status,
        rejectReason || "",
        photoPath || null,
        id
    );

    if (result.changes === 0) {
        throw new Error(
            "Inventaris tidak dapat diupdate. " +
            "Data mungkin sudah diproses."
        );
    }

    return result;
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
    rejectReason,
    qcName,
    ssd,
    ssdHealth,
    bh
) => {

    return db.prepare(`
        UPDATE inventaris
        SET
            status = ?,
            reject_reason = ?,
            qc_name = ?,
            ssd = ?,
            ssd_health = ?,
            bh = ?,
            last_qc = datetime('now','localtime'),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(

        status,

        status === "REJECT"
            ? rejectReason
            : "",

        qcName || null,
        ssd || null,
        ssdHealth || null,
        bh || null,

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
            qc_name = NULL,
            ssd = NULL,
            ssd_health = NULL,
            bh = NULL,
            last_qc = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(id);

};
// ==========================================
// GET HANDOVER SUMMARY BY BATCH
// ==========================================

exports.getHandoverSummaryByBatch = (batchId) => {
    return db.prepare(`
        SELECT
            jenis,
            COUNT(*) AS qty
        FROM inventaris
        WHERE batch_id = ?
        GROUP BY jenis
        ORDER BY jenis ASC
    `).all(batchId);
};