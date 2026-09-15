const db = require("../config/database");

// ==========================================
// GET HANDOVER BY ID
// ==========================================

exports.getById = (id) => {
    return db.prepare(`
        SELECT
            hd.*,
            b.batch_code,
            b.company,
            b.status AS batch_status,
            cb.booking_date,
            cb.asset_type,
            cb.asset_count
        FROM handover_document hd
        LEFT JOIN batch b
            ON b.id = hd.batch_id
        LEFT JOIN calendar_booking cb
            ON cb.id = hd.booking_id
        WHERE hd.id = ?
        LIMIT 1
    `).get(id);
};


// ==========================================
// GET HANDOVER BY BATCH
// ==========================================

exports.getByBatch = (batchId) => {
    return db.prepare(`
        SELECT
            hd.*,
            b.batch_code,
            b.company,
            b.status AS batch_status,
            cb.booking_date,
            cb.asset_type,
            cb.asset_count
        FROM handover_document hd
        LEFT JOIN batch b
            ON b.id = hd.batch_id
        LEFT JOIN calendar_booking cb
            ON cb.id = hd.booking_id
        WHERE hd.batch_id = ?
        ORDER BY hd.created_at ASC, hd.id ASC
    `).all(batchId);
};


// ==========================================
// GET HANDOVER BY BOOKING
// ==========================================

exports.getByBooking = (bookingId) => {
    return db.prepare(`
        SELECT
            hd.*,
            b.batch_code,
            b.company,
            b.status AS batch_status,
            cb.booking_date,
            cb.asset_type,
            cb.asset_count
        FROM handover_document hd
        LEFT JOIN batch b
            ON b.id = hd.batch_id
        LEFT JOIN calendar_booking cb
            ON cb.id = hd.booking_id
        WHERE hd.booking_id = ?
        ORDER BY hd.created_at ASC, hd.id ASC
    `).all(bookingId);
};


// ==========================================
// GET PENDING HANDOVER
// ==========================================

exports.getPendingByBatch = (batchId, direction) => {
    return db.prepare(`
        SELECT
            hd.*,
            b.batch_code,
            b.company,
            b.status AS batch_status
        FROM handover_document hd
        LEFT JOIN batch b
            ON b.id = hd.batch_id
        WHERE hd.batch_id = ?
        AND hd.direction = ?
        AND hd.status = 'PENDING'
        ORDER BY hd.created_at DESC, hd.id DESC
        LIMIT 1
    `).get(batchId, direction);
};


// ==========================================
// CREATE HANDOVER
// ==========================================

exports.create = (data) => {
    const stmt = db.prepare(`
        INSERT INTO handover_document
        (
            batch_id,
            booking_id,
            direction,

            sender_name,
            sender_signature_path,

            receiver_name,
            receiver_signature_path,

            pdf_path,

            status,

            created_by,
            created_at
        )
        VALUES
        (
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?,
            'PENDING',
            ?,
            CURRENT_TIMESTAMP
        )
    `);

    const result = stmt.run(
        data.batch_id || null,
        data.booking_id || null,
        data.direction,

        data.sender_name || null,
        data.sender_signature_path || null,

        data.receiver_name || null,
        data.receiver_signature_path || null,

        data.pdf_path || null,

        data.created_by || null
    );

    return result.lastInsertRowid;
};


// ==========================================
// UPDATE PDF PATH
// ==========================================

exports.updatePdfPath = (id, pdfPath) => {
    return db.prepare(`
        UPDATE handover_document
        SET pdf_path = ?
        WHERE id = ?
    `).run(pdfPath, id);
};

// ==========================================
// UPDATE RECEIVER
// Dipakai saat pihak penerima melakukan approval
// ==========================================

exports.updateReceiver = (
    id,
    receiverName,
    receiverSignaturePath
) => {
    return db.prepare(`
        UPDATE handover_document
        SET
            receiver_name = ?,
            receiver_signature_path = ?
        WHERE id = ?
        AND status = 'PENDING'
    `).run(
        receiverName,
        receiverSignaturePath,
        id
    );
};


// ==========================================
// APPROVE HANDOVER
// ==========================================

exports.approve = (id, approvedBy) => {
    return db.prepare(`
        UPDATE handover_document
        SET
            status = 'APPROVED',
            approved_by = ?,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND status = 'PENDING'
    `).run(
        approvedBy,
        id
    );
};


// ==========================================
// CHECK GA → IT APPROVED
// ==========================================

exports.isGaToItApproved = (batchId) => {
    const row = db.prepare(`
        SELECT id
        FROM handover_document
        WHERE batch_id = ?
        AND direction = 'GA_TO_IT'
        AND status = 'APPROVED'
        ORDER BY approved_at DESC, id DESC
        LIMIT 1
    `).get(batchId);

    return !!row;
};


// ==========================================
// CHECK IT → GA APPROVED
// ==========================================

exports.isItToGaApproved = (batchId) => {
    const row = db.prepare(`
        SELECT id
        FROM handover_document
        WHERE batch_id = ?
        AND direction = 'IT_TO_GA'
        AND status = 'APPROVED'
        ORDER BY approved_at DESC, id DESC
        LIMIT 1
    `).get(batchId);

    return !!row;
};