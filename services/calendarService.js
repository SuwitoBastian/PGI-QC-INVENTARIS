const db = require("../config/database");


// ==================================================
// GET BOOKING BY MONTH
// ==================================================

function getBookingsByMonth(month, company = "ALL") {

    let sql = `
        SELECT *
        FROM calendar_booking
        WHERE booking_date LIKE ?
    `;

    const params = [`${month}%`];

    if (company !== "ALL") {

        sql += ` AND company = ?`;

        params.push(company);

    }

    sql += `
        ORDER BY booking_date ASC, id ASC
    `;

    return db.prepare(sql).all(...params);
}


// ==================================================
// GET BOOKING BY ID
// ==================================================

function getBookingById(id) {

    return db.prepare(`
        SELECT *
        FROM calendar_booking
        WHERE id = ?
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

    const result = db.prepare(`
        DELETE FROM calendar_booking
        WHERE id = ?
    `).run(id);


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

    createBooking,

    updateBooking,

    cancelBooking,

    deleteBooking,

    getMonthlySummary

};