const calendarService = require("../services/calendarService");
const activityService = require("../services/activityService");


// ==================================================
// GET /api/calendar
// ==================================================

exports.index = (req, res) => {

    try {

        const month =
            req.query.month ||
            new Date().toISOString().slice(0, 7);

        const company =
            req.query.company || "ALL";

        const bookings =
            calendarService.getBookingsByMonth(
                month,
                company
            );

        const summary =
            calendarService.getMonthlySummary(
                month,
                company
            );

        return res.json({
            success: true,
            month,
            company,
            bookings,
            summary
        });

    } catch (error) {

        console.error(
            "❌ Calendar index error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data kalender"
        });

    }

};


// ==================================================
// GET /api/calendar/:id
// ==================================================

exports.detail = (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const booking =
            calendarService.getBookingById(id);

        if (!booking) {

            return res.status(404).json({
                success: false,
                message: "Booking tidak ditemukan"
            });

        }

        return res.json({
            success: true,
            booking
        });

    } catch (error) {

        console.error(
            "❌ Calendar detail error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil detail booking"
        });

    }

};


// ==================================================
// POST /api/calendar
// CREATE BOOKING
// ==================================================

exports.create = (req, res) => {

    try {

        const {
            company,
            booking_date,
            asset_type,
            asset_count,
            requester,
            location,
            notes,
            status
        } = req.body;


        // ==============================
        // VALIDASI COMPANY
        // ==============================

        if (!["PGI", "PEI"].includes(company)) {

            return res.status(400).json({
                success: false,
                message: "Company tidak valid"
            });

        }


        // ==============================
        // VALIDASI TANGGAL
        // ==============================

        if (!booking_date) {

            return res.status(400).json({
                success: false,
                message: "Tanggal booking wajib diisi"
            });

        }


        // ==============================
        // VALIDASI STATUS
        // ==============================

        const allowedStatus = [
            "CONFIRMED",
            "TENTATIVE",
            "CANCELLED"
        ];

        const bookingStatus =
            status || "TENTATIVE";

        if (!allowedStatus.includes(bookingStatus)) {

            return res.status(400).json({
                success: false,
                message: "Status booking tidak valid"
            });

        }


        // ==============================
        // CHECK CONFLICT
        // ==============================

        const conflict =
            calendarService.checkConflict({
                booking_date
            });


        if (conflict.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    `Tanggal ${booking_date} sudah dibooking: ` +
                    `${conflict.map(item =>
                        `${item.company} (${item.status})`
                    ).join(", ")}`,
                existingBookings: conflict
            });

        }


        // ==============================
        // CREATE BOOKING
        // ==============================

        const booking =
            calendarService.createBooking({

                company,

                booking_date,

                asset_type:
                    asset_type || null,

                asset_count:
                    Number(asset_count) || 0,

                requester:
                    requester || null,

                location:
                    location || null,

                notes:
                    notes || null,

                status:
                    bookingStatus

            });


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company: booking.company,

                type: "BOOKING_CREATED",

                title: "Booking QC Baru",

                message:
                    `${booking.company} melakukan booking ` +
                    `${booking.asset_type || "asset"} sebanyak ` +
                    `${booking.asset_count || 0} unit ` +
                    `untuk tanggal ${booking.booking_date}.`,

                reference_id: booking.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        return res.status(201).json({

            success: true,

            message: "Booking berhasil dibuat",

            booking

        });


    } catch (error) {

        console.error(
            "❌ Calendar create error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Gagal membuat booking"

        });

    }

};


// ==================================================
// PUT /api/calendar/:id
// UPDATE BOOKING
// ==================================================

exports.update = (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const existing =
            calendarService.getBookingById(id);


        // ==============================
        // CHECK EXISTING
        // ==============================

        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking tidak ditemukan"

            });

        }


        const {
            company,
            booking_date,
            asset_type,
            asset_count,
            requester,
            location,
            notes,
            status
        } = req.body;


        // ==============================
        // VALIDASI COMPANY
        // ==============================

        if (!["PGI", "PEI"].includes(company)) {

            return res.status(400).json({

                success: false,

                message:
                    "Company tidak valid"

            });

        }


        // ==============================
        // VALIDASI TANGGAL
        // ==============================

        if (!booking_date) {

            return res.status(400).json({

                success: false,

                message:
                    "Tanggal booking wajib diisi"

            });

        }


        // ==============================
        // VALIDASI STATUS
        // ==============================

        const allowedStatus = [
            "CONFIRMED",
            "TENTATIVE",
            "CANCELLED"
        ];

        const bookingStatus =
            status || existing.status;


        if (!allowedStatus.includes(bookingStatus)) {

            return res.status(400).json({

                success: false,

                message:
                    "Status booking tidak valid"

            });

        }


        // ==============================
        // CHECK CONFLICT
        // ==============================

        const conflict =
            calendarService.checkConflict({

                booking_date,

                excludeId: id

            });


        if (conflict.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    `Tanggal ${booking_date} sudah dibooking: ` +
                    `${conflict.map(item =>
                        `${item.company} (${item.status})`
                    ).join(", ")}`,

                existingBookings:
                    conflict

            });

        }


        // ==============================
        // UPDATE BOOKING
        // ==============================

        const booking =
            calendarService.updateBooking(

                id,

                {

                    company,

                    booking_date,

                    asset_type:
                        asset_type || null,

                    asset_count:
                        Number(asset_count) || 0,

                    requester:
                        requester || null,

                    location:
                        location || null,

                    notes:
                        notes || null,

                    status:
                        bookingStatus

                }

            );


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company: booking.company,

                type: "BOOKING_UPDATED",

                title: "Booking QC Diperbarui",

                message:
                    `${booking.company} memperbarui booking ` +
                    `${booking.asset_type || "asset"} sebanyak ` +
                    `${booking.asset_count || 0} unit ` +
                    `untuk tanggal ${booking.booking_date}.`,

                reference_id: booking.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        return res.json({

            success: true,

            message:
                "Booking berhasil diperbarui",

            booking

        });


    } catch (error) {

        console.error(
            "❌ Calendar update error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Gagal memperbarui booking"

        });

    }

};


// ==================================================
// PATCH /api/calendar/:id/cancel
// CANCEL BOOKING
// ==================================================

exports.cancel = (req, res) => {

    try {

        const id =
            Number(req.params.id);


        // ==============================
        // GET BOOKING
        // ==============================

        const existing =
            calendarService.getBookingById(id);


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking tidak ditemukan"

            });

        }


        // ==============================
        // CANCEL
        // ==============================

        const booking =
            calendarService.cancelBooking(id);


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company: existing.company,

                type: "BOOKING_CANCELLED",

                title: "Booking QC Dibatalkan",

                message:
                    `Booking ${existing.company} ` +
                    `tanggal ${existing.booking_date} ` +
                    `(${existing.asset_type || "asset"} ` +
                    `${existing.asset_count || 0} unit) ` +
                    `telah dibatalkan.`,

                reference_id: existing.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        return res.json({

            success: true,

            message:
                "Booking berhasil dibatalkan",

            booking

        });


    } catch (error) {

        console.error(
            "❌ Calendar cancel error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Gagal membatalkan booking"

        });

    }

};


// ==================================================
// DELETE /api/calendar/:id
// DELETE BOOKING
// ==================================================

exports.remove = (req, res) => {

    try {

        const id =
            Number(req.params.id);


        const existing =
            calendarService.getBookingById(id);


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking tidak ditemukan"

            });

        }


        calendarService.deleteBooking(id);


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company: existing.company,

                type: "BOOKING_DELETED",

                title: "Booking QC Dihapus",

                message:
                    `Booking ${existing.company} ` +
                    `tanggal ${existing.booking_date} ` +
                    `telah dihapus.`,

                reference_id: existing.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        return res.json({

            success: true,

            message:
                "Booking berhasil dihapus"

        });


    } catch (error) {

        console.error(
            "❌ Calendar delete error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Gagal menghapus booking"

        });

    }

};