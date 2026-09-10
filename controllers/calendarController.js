const calendarService = require("../services/calendarService");
const activityService = require("../services/activityService");
const excelService = require("../services/excelService");


// ==================================================
// COMPANY ACCESS CONTROL
// ==================================================

function getActiveCompany(req) {
    return String(req.company || "").trim().toUpperCase();
}


function canManageBooking(req, booking) {

    const activeCompany =
        getActiveCompany(req);

    return (
        ["PGI", "PEI"].includes(activeCompany) &&
        booking &&
        booking.company === activeCompany
    );

}


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

            message:
                "Gagal mengambil data kalender"

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

                message:
                    "Booking tidak ditemukan"

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

            message:
                "Gagal mengambil detail booking"

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
            booking_date,
            asset_type,
            asset_count,
            requester,
            location,
            notes,
            status
        } = req.body;


        const company =
            getActiveCompany(req);


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
            status || "TENTATIVE";


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

                existingBookings:
                    conflict

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
        // HANDLE SERVICE FAILURE
        // ==============================

        if (!booking || booking.success === false) {

            if (booking && booking.limitReached) {

                return res.status(409).json({

                    success: false,

                    limitReached: true,

                    message:
                        booking.message ||
                        "Jumlah booking aktif sudah mencapai batas maksimal."

                });

            }


            if (booking && booking.conflict) {

                return res.status(409).json({

                    success: false,

                    conflict: true,

                    message:
                        booking.message ||
                        "Tanggal booking sudah memiliki booking aktif.",

                    existingBookings:
                        booking.existingBookings || []

                });

            }


            return res.status(400).json({

                success: false,

                message:
                    booking?.message ||
                    "Booking gagal dibuat"

            });

        }


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company:
                    booking.company,

                type:
                    "BOOKING_CREATED",

                title:
                    "Booking QC Baru",

                message:
                    `${booking.company} melakukan booking ` +
                    `${booking.asset_type || "asset"} sebanyak ` +
                    `${booking.asset_count || 0} unit ` +
                    `untuk tanggal ${booking.booking_date}.`,

                reference_id:
                    booking.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        // ==============================
        // RESPONSE
        // ==============================

        return res.status(201).json({

            success: true,

            message:
                "Booking berhasil dibuat",

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


        // ==========================================
        // BOOKING SELESAI TIDAK BOLEH DIUBAH
        // ==========================================

        if (existing.batch_status === "FINISHED") {

            return res.status(400).json({

                success: false,

                message:
                    "Booking sudah selesai karena Batch telah ditutup. Booking tidak dapat diubah."

            });

        }


        // ==============================
        // CHECK OWNERSHIP
        // ==============================

        if (!canManageBooking(req, existing)) {

            return res.status(403).json({

                success: false,

                message:
                    "Anda tidak memiliki akses untuk mengubah booking perusahaan lain."

            });

        }


        const {
            booking_date,
            asset_type,
            asset_count,
            requester,
            location,
            notes,
            status
        } = req.body;


        // Company tidak boleh dipindahkan saat edit.

        const company =
            existing.company;


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

                excludeId:
                    id

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
        // HANDLE SERVICE FAILURE
        // ==============================

        if (!booking || booking.success === false) {

            return res.status(
                booking?.conflict ? 409 : 400
            ).json({

                success: false,

                conflict:
                    booking?.conflict || false,

                message:
                    booking?.message ||
                    "Booking gagal diperbarui",

                existingBookings:
                    booking?.existingBookings || []

            });

        }


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company:
                    booking.company,

                type:
                    "BOOKING_UPDATED",

                title:
                    "Booking QC Diperbarui",

                message:
                    `${booking.company} memperbarui booking ` +
                    `${booking.asset_type || "asset"} sebanyak ` +
                    `${booking.asset_count || 0} unit ` +
                    `untuk tanggal ${booking.booking_date}.`,

                reference_id:
                    booking.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        // ==============================
        // RESPONSE
        // ==============================

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
// POST /api/calendar/:id/excel
// UPLOAD EXCEL PREPARATION
// ==================================================

// ==================================================
// POST /api/calendar/:id/excel
// UPLOAD EXCEL PREPARATION
// ==================================================

// ==================================================
// POST /api/calendar/:id/excel
// UPLOAD EXCEL PREPARATION
// ==================================================

exports.uploadExcel = (req, res) => {

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


        // ==========================================
        // BOOKING SELESAI TIDAK BOLEH UPLOAD/GANTI
        // ==========================================

        if (existing.batch_status === "FINISHED") {

            return res.status(400).json({

                success: false,

                message:
                    "Booking sudah selesai karena Batch telah ditutup. File Excel tidak dapat diubah."

            });

        }


        // ==========================================
        // BOOKING SUDAH MEMILIKI BATCH
        // TIDAK BOLEH GANTI / UPLOAD EXCEL LAGI
        // ==========================================

        if (existing.batch_id) {

            return res.status(400).json({

                success: false,

                message:
                    "Booking sudah memiliki Batch. File Excel tidak dapat diganti."

            });

        }


        // ==============================
        // CHECK OWNERSHIP
        // ==============================

        if (!canManageBooking(req, existing)) {

            return res.status(403).json({

                success: false,

                message:
                    "Anda tidak memiliki akses untuk mengubah booking perusahaan lain."

            });

        }


        // ==============================
        // CHECK STATUS
        // ==============================

        if (existing.status === "CANCELLED") {

            return res.status(400).json({

                success: false,

                message:
                    "Booking yang sudah dibatalkan tidak dapat menerima file Excel."

            });

        }


        // ==============================
        // CHECK FILE
        // ==============================

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "File Excel wajib diupload."

            });

        }


        // ==============================
        // VALIDASI EXTENSION
        // ==============================

        const originalName =
            String(
                req.file.originalname || ""
            ).trim();


        const extension =
            originalName
                .toLowerCase()
                .split(".")
                .pop();


        const allowedExtensions = [
            "xlsx",
            "xls"
        ];


        if (!allowedExtensions.includes(extension)) {

            return res.status(400).json({

                success: false,

                message:
                    "File harus berformat .xlsx atau .xls."

            });

        }


        // ==============================
        // BACA EXCEL
        // ==============================

        const rows =
            excelService.readExcel(
                req.file.path
            );


        if (!rows || rows.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "File Excel tidak memiliki data."

            });

        }


        // ==============================
        // VALIDASI HEADER
        // ==============================

        const headerValidation =
            excelService.validateHeader(
                rows
            );


        if (
            !headerValidation ||
            headerValidation.valid !== true
        ) {

            return res.status(400).json({

                success: false,

                message:
                    headerValidation?.message ||
                    "Format header Excel tidak sesuai dengan format Batch."

            });

        }


        // ==============================
        // MAP DATA
        // ==============================

        const mappedData =
            excelService.mapData(
                rows
            );


        // ==============================
        // VALIDASI DATA
        // ==============================

        const dataErrors =
            excelService.validateData(
                mappedData
            );


        if (
            Array.isArray(dataErrors) &&
            dataErrors.length > 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    dataErrors.join("\n")

            });

        }


        // ==============================
        // LIMIT MAKSIMAL 50 ASET
        // ==============================

        if (mappedData.length > 50) {

            return res.status(400).json({

                success: false,

                limitReached: true,

                message:
                    "Jumlah aset dalam Excel maksimal 50 aset."

            });

        }


        // ==============================
        // SIMPAN FILE KE BOOKING
        // ==============================

        const result =
            calendarService.attachExcelToBooking(

                id,

                {

                    excel_path:
                        req.file.path,

                    excel_original_name:
                        originalName

                }

            );


        if (!result || result.success === false) {

            return res.status(400).json({

                success: false,

                message:
                    result?.message ||
                    "Gagal menyimpan file Excel."

            });

        }


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company:
                    existing.company,

                type:
                    "BOOKING_EXCEL_UPLOADED",

                title:
                    "Excel Booking Diupload",

                message:
                    `${existing.company} mengupload file ` +
                    `${originalName} untuk booking ` +
                    `tanggal ${existing.booking_date}.`,

                reference_id:
                    existing.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        // ==============================
        // RESPONSE
        // ==============================

        return res.json({

            success: true,

            message:
                "File Excel berhasil disimpan sebagai preparation.",

            booking:
                result

        });


    } catch (error) {

        console.error(
            "❌ Calendar upload Excel error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Gagal mengupload file Excel"

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


        const existing =
            calendarService.getBookingById(id);


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking tidak ditemukan"

            });

        }


        // ==========================================
        // BOOKING SELESAI TIDAK BOLEH DIBATALKAN
        // ==========================================

        if (existing.batch_status === "FINISHED") {

            return res.status(400).json({

                success: false,

                message:
                    "Booking sudah selesai karena Batch telah ditutup. Booking tidak dapat dibatalkan."

            });

        }


        // ==============================
        // CHECK OWNERSHIP
        // ==============================

        if (!canManageBooking(req, existing)) {

            return res.status(403).json({

                success: false,

                message:
                    "Anda tidak memiliki akses untuk membatalkan booking perusahaan lain."

            });

        }


        // ==============================
        // CANCEL
        // ==============================

        const booking =
            calendarService.cancelBooking(id);


        if (!booking || booking.success === false) {

            return res.status(400).json({

                success: false,

                message:
                    booking?.message ||
                    "Booking gagal dibatalkan"

            });

        }


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company:
                    existing.company,

                type:
                    "BOOKING_CANCELLED",

                title:
                    "Booking QC Dibatalkan",

                message:
                    `Booking ${existing.company} ` +
                    `tanggal ${existing.booking_date} ` +
                    `(${existing.asset_type || "asset"} ` +
                    `${existing.asset_count || 0} unit) ` +
                    `telah dibatalkan.`,

                reference_id:
                    existing.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        // ==============================
        // RESPONSE
        // ==============================

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


        // ==========================================
        // BOOKING SUDAH MEMILIKI BATCH
        // TIDAK BOLEH DIHAPUS
        // ==========================================

        if (existing.batch_id) {

            return res.status(400).json({

                success: false,

                message:
                    existing.batch_status === "FINISHED"
                        ? "Booking sudah selesai dan tidak dapat dihapus."
                        : "Booking sudah memiliki Batch dan tidak dapat dihapus."

            });

        }


        // ==============================
        // CHECK OWNERSHIP
        // ==============================

        if (!canManageBooking(req, existing)) {

            return res.status(403).json({

                success: false,

                message:
                    "Anda tidak memiliki akses untuk menghapus booking perusahaan lain."

            });

        }


        // ==============================
        // DELETE
        // ==============================

        calendarService.deleteBooking(id);


        // ==============================
        // ACTIVITY LOG
        // ==============================

        try {

            activityService.createActivity({

                company:
                    existing.company,

                type:
                    "BOOKING_DELETED",

                title:
                    "Booking QC Dihapus",

                message:
                    `Booking ${existing.company} ` +
                    `tanggal ${existing.booking_date} ` +
                    `telah dihapus.`,

                reference_id:
                    existing.id

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log:",
                activityError
            );

        }


        // ==============================
        // RESPONSE
        // ==============================

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