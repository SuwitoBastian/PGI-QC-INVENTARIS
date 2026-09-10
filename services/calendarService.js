const db = require("../config/database");


// ==================================================
// GET BOOKING BY MONTH
// ==================================================

function getBookingsByMonth(month, company = "ALL") {

    let sql = `
        SELECT
            cb.*,
            b.id AS batch_id,
            b.batch_code,
            b.status AS batch_status
        FROM calendar_booking cb
        LEFT JOIN batch b
            ON b.booking_id = cb.id
        WHERE cb.booking_date LIKE ?
    `;

    const params = [`${month}%`];

    if (company !== "ALL") {

        sql += `
            AND cb.company = ?
        `;

        params.push(company);

    }

    sql += `
        ORDER BY cb.booking_date ASC, cb.id ASC
    `;

    return db.prepare(sql).all(...params);
}


// ==================================================
// GET BOOKING BY ID
// ==================================================

function getBookingById(id) {

    return db.prepare(`
        SELECT
            cb.*,
            b.id AS batch_id,
            b.batch_code,
            b.status AS batch_status
        FROM calendar_booking cb
        LEFT JOIN batch b
            ON b.booking_id = cb.id
        WHERE cb.id = ?
    `).get(id);
}


// ==================================================
// CHECK CONFLICT
// ==================================================
//
// RULE:
// 1 tanggal = hanya boleh 1 booking aktif
// PGI dan PEI tetap saling bentrok
//
// CANCELLED tidak dianggap bentrok.
//
// excludeId digunakan saat EDIT,
// supaya booking yang sedang diedit
// tidak dianggap bentrok dengan dirinya sendiri.
//
// ==================================================

function checkConflict({
    booking_date,
    excludeId = null
}) {

    let sql = `
        SELECT *
        FROM calendar_booking
        WHERE booking_date = ?
        AND status != 'CANCELLED'
    `;

    const params = [booking_date];

    if (excludeId) {

        sql += `
            AND id != ?
        `;

        params.push(excludeId);

    }

    sql += `
        ORDER BY id ASC
    `;

    return db.prepare(sql).all(...params);
}


// ==================================================
// COUNT ACTIVE BOOKINGS
// ==================================================

function countActiveBookings() {

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM calendar_booking
        WHERE status != 'CANCELLED'
    `).get().total;
}


// ==================================================
// GET UPCOMING BOOKINGS
// ==================================================

function getUpcomingBookings(
    company,
    limit = 5,
    today = null
) {

    const activeCompany =
        String(company || "").trim().toUpperCase();

    const date =
        today ||
        new Date().toISOString().slice(0, 10);

    let sql = `
        SELECT
            cb.*,
            b.id AS batch_id,
            b.batch_code,
            b.status AS batch_status
        FROM calendar_booking cb
        LEFT JOIN batch b
            ON b.booking_id = cb.id
        WHERE cb.booking_date >= ?
        AND cb.status != 'CANCELLED'
        AND (b.status IS NULL OR b.status != 'FINISHED')
    `;

    const params = [date];

    if (activeCompany && activeCompany !== "ALL") {

        sql += `
            AND cb.company = ?
        `;

        params.push(activeCompany);

    }

    sql += `
        ORDER BY cb.booking_date ASC, cb.id ASC
        LIMIT ?
    `;

    params.push(Number(limit) || 5);

    return db.prepare(sql).all(...params);
}


// ==================================================
// CREATE BOOKING
// ==================================================

function createBooking(data) {

    // ==============================
    // CHECK CONFLICT
    // ==============================

    const conflict = checkConflict({
        booking_date: data.booking_date
    });


    if (conflict.length > 0) {

        return {
            success: false,
            conflict: true,
            message:
                `Tanggal ${data.booking_date} sudah memiliki booking aktif.`,
            existingBookings: conflict
        };

    }

    // ==============================
    // CHECK JUMLAH ASET
    // ==============================

    const assetCount = Number(data.asset_count);

    if (!Number.isInteger(assetCount) || assetCount < 1) {

        return {
            success: false,
            message:
                "Jumlah aset harus diisi minimal 1."
        };

    }

    if (assetCount > 50) {

        return {
            success: false,
            limitReached: true,
            message:
                "Jumlah aset dalam 1 booking maksimal 50 aset."
        };

    }

    // ==============================
    // INSERT
    // ==============================

    const stmt = db.prepare(`
        INSERT INTO calendar_booking (
            company,
            booking_date,
            asset_type,
            asset_count,
            requester,
            location,
            notes,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);


    const result = stmt.run(

        data.company,

        data.booking_date,

        data.asset_type || null,

        Number(data.asset_count) || 0,

        data.requester || null,

        data.location || null,

        data.notes || null,

        data.status || "TENTATIVE"

    );


    // ==============================
    // AMBIL DATA BOOKING LENGKAP
    // ==============================

    const booking =
        getBookingById(result.lastInsertRowid);


    // ==============================
    // RETURN
    // ==============================

    return {

        success: true,

        id: result.lastInsertRowid,

        ...booking

    };

}


// ==================================================
// UPDATE BOOKING
// ==================================================

function updateBooking(id, data) {

    // ==============================
    // GET EXISTING
    // ==============================

    const existing =
        getBookingById(id);


    if (!existing) {

        return {

            success: false,

            message:
                "Booking tidak ditemukan."

        };

    }

    // ==============================
    // BOOKING SUDAH MEMILIKI BATCH
    // ==============================

    if (existing.batch_id) {

        return {
            success: false,
            message:
                existing.batch_status === "FINISHED"
                    ? "Booking sudah selesai karena Batch telah ditutup dan tidak dapat diubah."
                    : "Booking sudah memiliki Batch dan tidak dapat diubah."
        };

    }


    // ==============================
    // CHECK CONFLICT
    // ==============================

    const conflict =
        checkConflict({

            booking_date:
                data.booking_date,

            excludeId:
                id

        });


    if (conflict.length > 0) {

        return {

            success: false,

            conflict: true,

            message:
                `Tanggal ${data.booking_date} sudah memiliki booking aktif.`,

            existingBookings:
                conflict

        };

    }


    // ==============================
    // UPDATE
    // ==============================

    db.prepare(`
        UPDATE calendar_booking
        SET
            company = ?,
            booking_date = ?,
            asset_type = ?,
            asset_count = ?,
            requester = ?,
            location = ?,
            notes = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(

        data.company,

        data.booking_date,

        data.asset_type || null,

        Number(data.asset_count) || 0,

        data.requester || null,

        data.location || null,

        data.notes || null,

        data.status || "TENTATIVE",

        id

    );


    // ==============================
    // AMBIL DATA BOOKING TERBARU
    // ==============================

    const booking =
        getBookingById(id);


    // ==============================
    // RETURN
    // ==============================

    return {

        success: true,

        id,

        ...booking

    };

}


// ==================================================
// ATTACH EXCEL TO BOOKING
// ==================================================
//
// Excel disimpan sebagai file preparation.
// Belum membuat batch.
//
// ==================================================

function attachExcelToBooking(
    id,
    {
        excel_path,
        excel_original_name
    }
) {

    // ==============================
    // GET BOOKING
    // ==============================

    const existing =
        getBookingById(id);


    if (!existing) {

        return {

            success: false,

            message:
                "Booking tidak ditemukan."

        };

    }

    // ==============================
    // BOOKING SUDAH MEMILIKI BATCH
    // ==============================

    if (existing.batch_id) {

        return {
            success: false,
            message:
                existing.batch_status === "FINISHED"
                    ? "Booking sudah selesai dan file Excel tidak dapat diubah."
                    : "Booking sudah memiliki Batch dan file Excel tidak dapat diganti."
        };

    }


    // ==============================
    // CANCELLED TIDAK BOLEH UPLOAD
    // ==============================

    if (existing.status === "CANCELLED") {

        return {

            success: false,

            message:
                "Booking yang sudah dibatalkan tidak dapat menerima file Excel."

        };

    }


    // ==============================
    // UPDATE FILE
    // ==============================

    db.prepare(`
        UPDATE calendar_booking
        SET
            excel_path = ?,
            excel_original_name = ?,
            excel_uploaded_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(

        excel_path || null,

        excel_original_name || null,

        id

    );


    // ==============================
    // AMBIL DATA TERBARU
    // ==============================

    const booking =
        getBookingById(id);


    // ==============================
    // RETURN
    // ==============================

    return {

        success: true,

        id,

        ...booking

    };

}


// ==================================================
// CANCEL BOOKING
// ==================================================

function cancelBooking(id) {

    // ==============================
    // GET EXISTING
    // ==============================

    const existing =
        getBookingById(id);


    if (!existing) {

        return {

            success: false,

            message:
                "Booking tidak ditemukan."

        };

    }

    // ==============================
    // BOOKING SUDAH MEMILIKI BATCH
    // ==============================

    if (existing.batch_id) {

        return {
            success: false,
            message:
                existing.batch_status === "FINISHED"
                    ? "Booking sudah selesai dan tidak dapat dibatalkan."
                    : "Booking sudah memiliki Batch dan tidak dapat dibatalkan."
        };

    }


    // ==============================
    // UPDATE STATUS
    // ==============================

    db.prepare(`
        UPDATE calendar_booking
        SET
            status = 'CANCELLED',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(id);


    // ==============================
    // AMBIL DATA TERBARU
    // ==============================

    const booking =
        getBookingById(id);


    // ==============================
    // RETURN
    // ==============================

    return {

        success: true,

        id,

        ...booking

    };

}


// ==================================================
// DELETE BOOKING
// ==================================================

function deleteBooking(id) {

    // ==============================
    // AMBIL BOOKING
    // ==============================

    const existing =
        getBookingById(id);


    // ==============================
    // BOOKING TIDAK DITEMUKAN
    // ==============================

    if (!existing) {

        return {
            success: false,
            message:
                "Booking tidak ditemukan."
        };

    }


    // ==============================
    // BOOKING SUDAH MEMILIKI BATCH
    // ==============================

    if (existing.batch_id) {

        return {
            success: false,
            message:
                existing.batch_status === "FINISHED"
                    ? "Booking sudah selesai dan tidak dapat dihapus."
                    : "Booking sudah memiliki Batch dan tidak dapat dihapus."
        };

    }


    // ==============================
    // HAPUS BOOKING
    // ==============================

    const result =
        db.prepare(`
            DELETE FROM calendar_booking
            WHERE id = ?
        `).run(id);


    // ==============================
    // RETURN
    // ==============================

    return {
        success:
            result.changes > 0
    };

}


// ==================================================
// MONTHLY SUMMARY
// ==================================================

function getMonthlySummary(month, company = "ALL") {

    let sql = `
        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'CONFIRMED'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS confirmed,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'TENTATIVE'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS tentative,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'CANCELLED'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS cancelled

        FROM calendar_booking
        WHERE booking_date LIKE ?
    `;


    const params =
        [`${month}%`];


    if (company !== "ALL") {

        sql += `
            AND company = ?
        `;

        params.push(company);

    }


    return db.prepare(sql).get(...params);

}


// ==================================================
// EXPORT
// ==================================================

module.exports = {

    getBookingsByMonth,

    getBookingById,

    checkConflict,

    countActiveBookings,

    getUpcomingBookings,

    createBooking,

    updateBooking,

    attachExcelToBooking,

    cancelBooking,

    deleteBooking,

    getMonthlySummary

};