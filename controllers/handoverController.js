const handoverService = require("../services/handoverService");
const handoverPdfService = require("../services/handoverPdfService");
const digitalSignatureService = require("../services/digitalSignatureService");
const calendarService = require("../services/calendarService");
const batchService = require("../services/batchService");
const inventoryService = require("../services/inventoryService");
const activityService = require("../services/activityService");


function hasRole(req, role) {
    return String(req.user?.role || "").trim().toUpperCase() === role;
}
/**
 * ==========================================
 * CREATE GA → IT HANDOVER
 * ==========================================
 *
 * Membuat dokumen Tanda Terima GA → IT
 * berdasarkan Batch.
 *
 * Status awal dokumen:
 * PENDING
 *
 * QC belum boleh dilakukan sebelum
 * dokumen GA → IT di-approve oleh IT.
 */
exports.createGaToIt = async (req, res) => {
    try {

        if (!hasRole(req, "GA")) {
            return res.status(403).json({
                success: false,
                message: "Akses hanya untuk Staff GA."
            });
        }

        const company = req.company || "PGI";

        // ==========================================
        // VALIDASI BATCH
        // ==========================================

        const batchId = Number(
            req.body.batch_id || req.params.batchId
        );

        if (!batchId) {
            return res.status(400).json({
                success: false,
                message: "Batch tidak ditemukan."
            });
        }

        const batch =
            batchService.getBatchById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch tidak ditemukan."
            });
        }

        if (batch.company !== company) {
            return res.status(403).json({
                success: false,
                message:
                    "Batch bukan milik company tersebut."
            });
        }

        if (batch.status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima GA → IT hanya dapat dibuat untuk batch aktif."
            });
        }

        // ==========================================
        // CEK DOKUMEN EXISTING
        // ==========================================

        const existing =
            handoverService
                .getByBatch(batchId)
                .find(
                    item =>
                        item.direction === "GA_TO_IT"
                );

        if (existing) {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima GA → IT untuk batch ini sudah dibuat.",
                handover: existing
            });
        }

        // ==========================================
        // VALIDASI NAMA PENYERAH
        // ==========================================

        const senderName =
            String(
                req.body.sender_name || ""
            ).trim();

        if (!senderName) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama yang menyerahkan wajib dipilih."
            });
        }

        // ==========================================
        // AMBIL DIGITAL SIGNATURE GA
        // ==========================================

        const senderSignature =
            digitalSignatureService
                .getActiveByName(senderName);

        if (!senderSignature) {
            return res.status(400).json({
                success: false,
                message:
                    `Digital signature untuk "${senderName}" tidak ditemukan.`
            });
        }

        // ==========================================
        // PASTIKAN YANG DIPILIH ADALAH GA
        // ==========================================

        if (
            String(senderSignature.jabatan || "")
                .trim()
                .toLowerCase() !== "general affairs"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama yang menyerahkan untuk GA → IT harus berasal dari General Affairs."
            });
        }

        // ==========================================
        // SUMMARY INVENTARIS
        // ==========================================

        const summary =
            inventoryService
                .getHandoverSummaryByBatch(batchId);

        if (!summary || summary.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Data inventaris batch belum tersedia."
            });
        }

        // ==========================================
        // MAX 6 JENIS
        // ==========================================

        if (summary.length > 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Jumlah jenis aset melebihi kapasitas tabel Tanda Terima GA → IT."
            });
        }

        // ==========================================
        // BOOKING
        // ==========================================

        const booking =
            batch.booking_id
                ? calendarService.getBookingById(
                    batch.booking_id
                )
                : null;

        if (!booking) {
            return res.status(400).json({
                success: false,
                message:
                    "Booking untuk batch ini tidak ditemukan."
            });
        }

        if (booking.company !== batch.company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company booking tidak sesuai dengan company batch."
            });
        }

        if (booking.status !== "APPROVED") {
            return res.status(400).json({
                success: false,
                message:
                    "Booking harus berstatus APPROVED sebelum Tanda Terima GA → IT dibuat."
            });
        }

        // ==========================================
        // CREATE HANDOVER
        // PENERIMA MASIH KOSONG
        // ==========================================

        const handoverId =
            handoverService.create({
                batch_id: batchId,
                booking_id:
                    batch.booking_id || null,

                direction:
                    "GA_TO_IT",

                sender_name:
                    senderSignature.nama,

                sender_signature_path:
                    senderSignature.signature_path,

                receiver_name:
                    null,

                receiver_signature_path:
                    null,

                status:
                    "PENDING",

                created_by:
                    req.user?.display_name ||
                    req.user?.nama ||
                    req.user?.name ||
                    "SYSTEM"
            });

        // ==========================================
        // GENERATE PDF
        // PENERIMA BELUM DIISI
        // ==========================================

        const pdfPath =
            await handoverPdfService.generateGaToIt({
                batch,
                handoverId,

                bookingDate:
                    booking.booking_date,

                location: booking.location,

                senderName:
                    senderSignature.nama,

                senderSignaturePath:
                    senderSignature.signature_path,

                receiverName:
                    "",

                receiverSignaturePath:
                    null,

                summary
            });

        // ==========================================
        // SIMPAN PDF
        // ==========================================

        handoverService.updatePdfPath(
            handoverId,
            pdfPath
        );

        // ==========================================
        // ACTIVITY LOG
        // GA → IT CREATED
        // ==========================================

        try {
            activityService.createActivity({
                company: batch.company,
                type: "GA_TO_IT_CREATED",
                title: "Tanda Terima GA → IT Dibuat",
                message:
                    `${batch.company} membuat Tanda Terima GA → IT ` +
                    `untuk batch ${batch.batch_code}. ` +
                    `Penyerah: ${senderSignature.nama}.`,
                reference_id: handoverId
            });
        } catch (activityError) {
            console.error(
                "⚠️ Gagal membuat activity log GA → IT:",
                activityError
            );
        }

        return res.json({
            success: true,
            message:
                "Tanda Terima GA → IT berhasil dibuat.",

            handover_id:
                handoverId,

            pdf_path:
                pdfPath,

            status:
                "PENDING"
        });

    } catch (error) {
        console.error(
            "❌ createGaToIt error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal membuat Tanda Terima GA → IT.",
            error:
                error.message
        });
    }
};
// ==========================================
// GET HANDOVER BY BATCH
// ==========================================

exports.getByBatch = (req, res) => {
    try {
        const company = req.company || "PGI";
        const batchId = Number(req.params.batchId);

        if (!batchId) {
            return res.status(400).json({
                success: false,
                message: "Batch ID tidak valid."
            });
        }

        const batch = batchService.getBatchById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch tidak ditemukan."
            });
        }

        if (batch.company !== company) {
            return res.status(403).json({
                success: false,
                message: "Batch bukan milik company tersebut."
            });
        }

        const handovers =
            handoverService.getByBatch(batchId);

        return res.json({
            success: true,
            batch: {
                id: batch.id,
                batch_code: batch.batch_code,
                company: batch.company,
                status: batch.status
            },
            handovers
        });

    } catch (error) {
        console.error(
            "❌ getByBatch handover error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data handover.",
            error: error.message
        });
    }
};
// ==========================================
// GET HANDOVER STATUS BY BATCH
// ==========================================

exports.getStatusByBatch = (req, res) => {
    try {
        const company = req.company || "PGI";
        const batchId = Number(req.params.batchId);

        if (!batchId) {
            return res.status(400).json({
                success: false,
                message: "Batch ID tidak valid."
            });
        }

        const batch = batchService.getBatchById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch tidak ditemukan."
            });
        }

        if (batch.company !== company) {
            return res.status(403).json({
                success: false,
                message: "Batch bukan milik company tersebut."
            });
        }

        // ==========================================
        // AMBIL HANDOVER GA → IT
        // ==========================================

        const handovers =
            handoverService.getByBatch(batchId);

        const gaToIt =
            handovers.find(
                (item) => item.direction === "GA_TO_IT"
            ) || null;

        const gaToItApproved =
            handoverService.isGaToItApproved(batchId);

        // ==========================================
        // ATURAN CREATE GA → IT
        // ==========================================

        const canCreateGaToIt =
            batch.company === company &&
            batch.status === "ACTIVE" &&
            !gaToIt;

        // ==========================================
        // ATURAN MULAI QC
        // ==========================================

        const canStartQc =
            batch.company === company &&
            batch.status === "ACTIVE" &&
            gaToItApproved;

        return res.json({
            success: true,

            batch: {
                id: batch.id,
                batch_code: batch.batch_code,
                company: batch.company,
                status: batch.status
            },

            ga_to_it: gaToIt,

            ga_to_it_approved: gaToItApproved,

            can_create_ga_to_it: canCreateGaToIt,

            can_start_qc: canStartQc
        });

    } catch (error) {
        console.error(
            "❌ getStatusByBatch handover error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil status handover.",
            error: error.message
        });
    }
};
// ==========================================
// APPROVE GA → IT HANDOVER
// ==========================================

exports.approveGaToIt = async (req, res) => {
    try {

        if (!hasRole(req, "IT")) {
            return res.status(403).json({
                success: false,
                message: "Akses hanya untuk Staff IT."
            });
        }

        const company =
            req.company || "PGI";

        const handoverId =
            Number(req.params.handoverId);

        // ==========================================
        // VALIDASI ID
        // ==========================================

        if (!handoverId) {
            return res.status(400).json({
                success: false,
                message:
                    "Handover ID tidak valid."
            });
        }

        // ==========================================
        // AMBIL HANDOVER
        // ==========================================

        const handover =
            handoverService.getById(
                handoverId
            );

        if (!handover) {
            return res.status(404).json({
                success: false,
                message:
                    "Dokumen handover tidak ditemukan."
            });
        }

        // ==========================================
        // VALIDASI DIRECTION
        // ==========================================

        if (
            handover.direction !==
            "GA_TO_IT"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Dokumen ini bukan Tanda Terima GA → IT."
            });
        }

        // ==========================================
        // AMBIL BATCH
        // ==========================================

        const batch =
            handover.batch_id
                ? batchService.getBatchById(
                    handover.batch_id
                )
                : null;

        if (!batch) {
            return res.status(404).json({
                success: false,
                message:
                    "Batch handover tidak ditemukan."
            });
        }

        // ==========================================
        // COMPANY
        // ==========================================

        if (
            batch.company !== company
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Batch bukan milik company tersebut."
            });
        }

        // ==========================================
        // STATUS
        // ==========================================

        if (
            handover.status ===
            "APPROVED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima GA → IT sudah di-approve."
            });
        }

        if (
            handover.status !==
            "PENDING"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima GA → IT tidak dapat di-approve."
            });
        }

        // ==========================================
        // VALIDASI PENERIMA IT
        // ==========================================

        const receiverName =
            String(
                req.body.receiver_name || ""
            ).trim();

        if (!receiverName) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama penerima IT wajib dipilih."
            });
        }

        // ==========================================
        // AMBIL SIGNATURE IT
        // ==========================================

        const receiverSignature =
            digitalSignatureService
                .getActiveByName(
                    receiverName
                );

        if (!receiverSignature) {
            return res.status(400).json({
                success: false,
                message:
                    `Digital signature IT untuk "${receiverName}" tidak ditemukan.`
            });
        }

        // ==========================================
        // PASTIKAN STAFF IT
        // ==========================================

        if (
            String(
                receiverSignature.jabatan || ""
            )
                .trim()
                .toLowerCase() !==
            "it support"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Penerima GA → IT harus berasal dari IT Support."
            });
        }

        // ==========================================
        // UPDATE PENERIMA
        // ==========================================

        const receiverUpdate =
            handoverService.updateReceiver(
                handoverId,
                receiverSignature.nama,
                receiverSignature.signature_path
            );

        if (
            !receiverUpdate ||
            receiverUpdate.changes === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Data penerima gagal disimpan."
            });
        }

        // ==========================================
        // GENERATE ULANG PDF FINAL
        // ==========================================

        const summary =
            inventoryService
                .getHandoverSummaryByBatch(
                    batch.id
                );

        const booking =
            batch.booking_id
                ? calendarService.getBookingById(
                    batch.booking_id
                )
                : null;

        if (!booking) {
            return res.status(400).json({
                success: false,
                message:
                    "Booking untuk batch ini tidak ditemukan."
            });
        }

        const pdfPath =
            await handoverPdfService.generateGaToIt({
                batch,

                handoverId,

                bookingDate:
                    booking.booking_date,

                location: booking.location,

                senderName:
                    handover.sender_name,

                senderSignaturePath:
                    handover.sender_signature_path,

                receiverName:
                    receiverSignature.nama,

                receiverSignaturePath:
                    receiverSignature.signature_path,

                summary
            });

        handoverService.updatePdfPath(
            handoverId,
            pdfPath
        );

        // ==========================================
        // APPROVED BY = PENERIMA
        // ==========================================

        const approvedBy =
            receiverSignature.nama;

        const result =
            handoverService.approve(
                handoverId,
                approvedBy
            );

        if (
            !result ||
            result.changes === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Approval gagal dilakukan."
            });
        }

        const updated =
            handoverService.getById(
                handoverId
            );

        // ==========================================
        // ACTIVITY LOG
        // GA → IT APPROVED
        // ==========================================

        try {
            activityService.createActivity({
                company: batch.company,
                type: "GA_TO_IT_APPROVED",
                title: "Tanda Terima GA → IT Approved",
                message:
                    `${batch.company} menyetujui Tanda Terima GA → IT ` +
                    `untuk batch ${batch.batch_code}. ` +
                    `Penerima: ${receiverSignature.nama}.`,
                reference_id: handoverId
            });
        } catch (activityError) {
            console.error(
                "⚠️ Gagal membuat activity log GA → IT approval:",
                activityError
            );
        }

        return res.json({
            success: true,
            message:
                "Tanda Terima GA → IT berhasil di-approve.",

            handover:
                updated
        });

    } catch (error) {
        console.error(
            "❌ approveGaToIt error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal melakukan approval Tanda Terima GA → IT.",
            error:
                error.message
        });
    }
};
// ==========================================
// GET HANDOVER PDF
// ==========================================

exports.getPdf = (req, res) => {
    try {

        const company =
            req.company || "PGI";

        const handoverId =
            Number(req.params.handoverId);


        // ==========================================
        // VALIDASI ID
        // ==========================================

        if (!handoverId) {
            return res.status(400).json({
                success: false,
                message: "Handover ID tidak valid."
            });
        }


        // ==========================================
        // AMBIL HANDOVER
        // ==========================================

        const handover =
            handoverService.getById(handoverId);


        if (!handover) {
            return res.status(404).json({
                success: false,
                message:
                    "Dokumen handover tidak ditemukan."
            });
        }


        // ==========================================
        // HANYA GA → IT / IT → GA
        // ==========================================

        if (
            handover.direction !== "GA_TO_IT" &&
            handover.direction !== "IT_TO_GA"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Direction Tanda Terima tidak valid."
            });
        }


        // ==========================================
        // AMBIL BATCH
        // ==========================================

        const batch =
            handover.batch_id
                ? batchService.getBatchById(
                    handover.batch_id
                )
                : null;


        if (!batch) {
            return res.status(404).json({
                success: false,
                message:
                    "Batch handover tidak ditemukan."
            });
        }


        // ==========================================
        // VALIDASI COMPANY
        // ==========================================

        if (batch.company !== company) {
            return res.status(403).json({
                success: false,
                message:
                    "Anda tidak memiliki akses ke dokumen ini."
            });
        }


        // ==========================================
        // VALIDASI FILE PDF
        // ==========================================

        if (!handover.pdf_path) {
            return res.status(404).json({
                success: false,
                message:
                    "File PDF handover belum tersedia."
            });
        }


        // ==========================================
        // KIRIM PDF
        // ==========================================

        return res.sendFile(
            handover.pdf_path,
            {
                headers: {
                    "Content-Type":
                        "application/pdf",

                    "Content-Disposition":
                        "inline"
                }
            }
        );


    } catch (error) {

        console.error(
            "❌ getPdf handover error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Gagal membuka PDF handover.",
            error:
                error.message
        });

    }
};
// =====================================================
// IT → GA
// =====================================================
exports.createItToGa = async (req, res) => {
    try {

        if (!hasRole(req, "IT")) {
            return res.status(403).json({
                success: false,
                message: "Akses hanya untuk Staff IT."
            });
        }

        const {
            batch_id,
            sender_name
        } = req.body;

        // ==========================================
        // VALIDASI BATCH
        // ==========================================

        if (!batch_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Batch wajib dipilih."
            });
        }

        const senderName =
            String(
                sender_name || ""
            ).trim();

        if (!senderName) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama yang menyerahkan wajib dipilih."
            });
        }

        const batch =
            batchService.getBatchById(
                batch_id
            );

        if (!batch) {
            return res.status(404).json({
                success: false,
                message:
                    "Batch tidak ditemukan."
            });
        }

        const company =
            req.company || "PGI";

        if (
            batch.company !== company
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Batch bukan milik company tersebut."
            });
        }

        // ==========================================
        // BATCH HARUS FINISHED
        // ==========================================

        if (
            batch.status !==
            "FINISHED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima IT → GA hanya dapat dibuat untuk batch yang sudah FINISHED."
            });
        }

        // ==========================================
        // CEK EXISTING
        // ==========================================

        const existing =
            handoverService
                .getByBatch(batch.id)
                .find(
                    h =>
                        h.direction ===
                        "IT_TO_GA"
                );

        if (existing) {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima IT → GA untuk batch ini sudah dibuat.",
                handover_id:
                    existing.id,
                status:
                    existing.status
            });
        }

        // ==========================================
        // SIGNATURE IT
        // ==========================================

        const senderSignature =
            digitalSignatureService
                .getActiveByName(
                    senderName
                );

        if (!senderSignature) {
            return res.status(400).json({
                success: false,
                message:
                    `Signature aktif untuk "${senderName}" tidak ditemukan.`
            });
        }

        // ==========================================
        // PASTIKAN IT SUPPORT
        // ==========================================

        if (
            String(
                senderSignature.jabatan || ""
            )
                .trim()
                .toLowerCase() !==
            "it support"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama yang menyerahkan untuk IT → GA harus berasal dari IT Support."
            });
        }

        // ==========================================
        // BOOKING
        // ==========================================

        const booking =
            calendarService.getBookingById(
                batch.booking_id
            );

        if (!booking) {
            return res.status(400).json({
                success: false,
                message:
                    "Booking yang terkait dengan batch tidak ditemukan."
            });
        }

        if (
            booking.company !==
            batch.company
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company booking tidak sesuai dengan batch."
            });
        }

        // ==========================================
        // SUMMARY
        // ==========================================

        const summaryItems =
            inventoryService
                .getHandoverSummaryByBatch(
                    batch.id
                );

        if (
            !summaryItems ||
            summaryItems.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Data inventaris untuk tanda terima tidak ditemukan."
            });
        }

        const pdfItems =
            summaryItems.slice(0, 5);

        // ==========================================
        // CREATE HANDOVER
        // PENERIMA KOSONG
        // ==========================================

        const handoverId =
            handoverService.create({
                batch_id:
                    batch.id,

                booking_id:
                    booking.id,

                direction:
                    "IT_TO_GA",

                sender_name:
                    senderSignature.nama,

                sender_signature_path:
                    senderSignature.signature_path,

                receiver_name:
                    null,

                receiver_signature_path:
                    null,

                created_by:
                    req.user?.display_name ||
                    req.user?.nama ||
                    req.user?.name ||
                    "SYSTEM"
            });

        // ==========================================
        // GENERATE PDF AWAL
        // ==========================================

        const pdfPath =
            await handoverPdfService.generateItToGa({
                batch,
                booking,

                summary: {
                    items:
                        pdfItems
                },

                senderName:
                    senderSignature.nama,

                senderSignaturePath:
                    senderSignature.signature_path,

                receiverName:
                    "",

                receiverSignaturePath:
                    null
            });

        handoverService.updatePdfPath(
            handoverId,
            pdfPath
        );

        // ==========================================
        // ACTIVITY LOG
        // IT → GA CREATED
        // ==========================================

        try {
            activityService.createActivity({
                company: batch.company,
                type: "IT_TO_GA_CREATED",
                title: "Tanda Terima IT → GA Dibuat",
                message:
                    `${batch.company} membuat Tanda Terima IT → GA ` +
                    `untuk batch ${batch.batch_code}. ` +
                    `Penyerah: ${senderSignature.nama}.`,
                reference_id: handoverId
            });
        } catch (activityError) {
            console.error(
                "⚠️ Gagal membuat activity log IT → GA:",
                activityError
            );
        }

        return res.json({
            success: true,
            message:
                "Tanda Terima IT → GA berhasil dibuat.",

            handover_id:
                handoverId,

            status:
                "PENDING",

            pdf_path:
                pdfPath
        });

    } catch (error) {

        console.error(
            "CREATE IT → GA ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Gagal membuat Tanda Terima IT → GA."
        });
    }
};
exports.approveItToGa = async (req, res) => {
    try {

        if (!hasRole(req, "GA")) {
            return res.status(403).json({
                success: false,
                message: "Akses hanya untuk Staff GA."
            });
        }

        const {
            handoverId
        } = req.params;

        const handover =
            handoverService.getById(
                handoverId
            );

        if (!handover) {
            return res.status(404).json({
                success: false,
                message:
                    "Tanda Terima tidak ditemukan."
            });
        }

        // ==========================================
        // DIRECTION
        // ==========================================

        if (
            handover.direction !==
            "IT_TO_GA"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Dokumen bukan Tanda Terima IT → GA."
            });
        }

        const company =
            req.company || "PGI";

        if (
            handover.company !==
            company
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Tanda Terima bukan milik company tersebut."
            });
        }

        // ==========================================
        // BATCH
        // ==========================================

        if (
            handover.batch_status !==
            "FINISHED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Batch belum FINISHED."
            });
        }

        // ==========================================
        // STATUS
        // ==========================================

        if (
            handover.status !==
            "PENDING"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Tanda Terima ini sudah diproses."
            });
        }

        // ==========================================
        // VALIDASI PENERIMA GA
        // ==========================================

        const receiverName =
            String(
                req.body?.receiver_name ||
                ""
            ).trim();

        if (!receiverName) {
            return res.status(400).json({
                success: false,
                message:
                    "Nama penerima GA wajib dipilih."
            });
        }

        // ==========================================
        // SIGNATURE GA
        // ==========================================

        const receiverSignature =
            digitalSignatureService
                .getActiveByName(
                    receiverName
                );

        if (!receiverSignature) {
            return res.status(400).json({
                success: false,
                message:
                    `Digital signature GA untuk "${receiverName}" tidak ditemukan.`
            });
        }

        // ==========================================
        // PASTIKAN GENERAL AFFAIRS
        // ==========================================

        if (
            String(
                receiverSignature.jabatan || ""
            )
                .trim()
                .toLowerCase() !==
            "general affairs"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Penerima IT → GA harus berasal dari General Affairs."
            });
        }

        // ==========================================
        // BATCH
        // ==========================================

        const batch =
            handover.batch_id
                ? batchService.getBatchById(
                    handover.batch_id
                )
                : null;

        if (!batch) {
            return res.status(404).json({
                success: false,
                message:
                    "Batch handover tidak ditemukan."
            });
        }

        const booking =
            batch.booking_id
                ? calendarService.getBookingById(
                    batch.booking_id
                )
                : null;

        if (!booking) {
            return res.status(400).json({
                success: false,
                message:
                    "Booking yang terkait dengan batch tidak ditemukan."
            });
        }

        // ==========================================
        // SUMMARY
        // ==========================================

        const summaryItems =
            inventoryService
                .getHandoverSummaryByBatch(
                    batch.id
                );

        if (
            !summaryItems ||
            summaryItems.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Data inventaris untuk tanda terima tidak ditemukan."
            });
        }

        const pdfItems =
            summaryItems.slice(0, 5);

        // ==========================================
        // UPDATE RECEIVER
        // ==========================================

        const receiverUpdate =
            handoverService.updateReceiver(
                handoverId,
                receiverSignature.nama,
                receiverSignature.signature_path
            );

        if (
            !receiverUpdate ||
            receiverUpdate.changes === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Data penerima gagal disimpan."
            });
        }

        // ==========================================
        // GENERATE PDF FINAL
        // ==========================================

        const pdfPath =
            await handoverPdfService.generateItToGa({
                batch,
                booking,

                summary: {
                    items:
                        pdfItems
                },

                senderName:
                    handover.sender_name,

                senderSignaturePath:
                    handover.sender_signature_path,

                receiverName:
                    receiverSignature.nama,

                receiverSignaturePath:
                    receiverSignature.signature_path
            });

        handoverService.updatePdfPath(
            handoverId,
            pdfPath
        );

        // ==========================================
        // APPROVED BY = PENERIMA
        // ==========================================

        const approvedBy =
            receiverSignature.nama;

        const result =
            handoverService.approve(
                handoverId,
                approvedBy
            );

        if (
            !result ||
            result.changes === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Gagal melakukan approval."
            });
        }

        const updated =
            handoverService.getById(
                handoverId
            );

        
        // ==========================================
        // ACTIVITY LOG
        // IT → GA APPROVED
        // ==========================================

        try {
            activityService.createActivity({
                company: batch.company,
                type: "IT_TO_GA_APPROVED",
                title: "Tanda Terima IT → GA Approved",
                message:
                    `${batch.company} menyetujui Tanda Terima IT → GA ` +
                    `untuk batch ${batch.batch_code}. ` +
                    `Penerima: ${receiverSignature.nama}.`,
                reference_id: handoverId
            });
        } catch (activityError) {
            console.error(
                "⚠️ Gagal membuat activity log IT → GA approval:",
                activityError
            );
        }
        
        return res.json({
            success: true,
            message:
                "Tanda Terima IT → GA berhasil APPROVED.",

            handover:
                updated
        });

    } catch (error) {

        console.error(
            "APPROVE IT → GA ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Gagal melakukan approval."
        });
    }
};

exports.getItToGaStatusByBatch = (req, res) => {
    try {
        const batchId = req.params.batchId;
        const company = req.company || "PGI";

        // ==========================================
        // AMBIL BATCH
        // ==========================================

        const batch = batchService.getBatchById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch tidak ditemukan."
            });
        }

        // ==========================================
        // VALIDASI COMPANY
        // ==========================================

        if (batch.company !== company) {
            return res.status(403).json({
                success: false,
                message: "Batch bukan milik company tersebut."
            });
        }

        // ==========================================
        // AMBIL HANDOVER IT → GA
        // ==========================================

        const handover = handoverService
            .getByBatch(batch.id)
            .find(h => h.direction === "IT_TO_GA") || null;

        // ==========================================
        // TENTUKAN STATE
        // ==========================================

        let state = "NOT_CREATED";

        if (handover) {
            if (handover.status === "APPROVED") {
                state = "APPROVED";
            } else {
                state = "PENDING";
            }
        }

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.json({
            success: true,

            batch: {
                id: batch.id,
                batch_code: batch.batch_code,
                company: batch.company,
                status: batch.status
            },

            it_to_ga: handover,

            state,

            can_create:
                batch.company === company &&
                batch.status === "FINISHED" &&
                !handover,

            can_approve:
                batch.company === company &&
                !!handover &&
                handover.status === "PENDING"
        });

    } catch (error) {
        console.error(
            "IT → GA STATUS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Gagal mengambil status IT → GA."
        });
    }
};
// =====================================================
// GET ACTIVE DIGITAL SIGNATURE
// Digunakan untuk Tanda Terima IT → GA
// =====================================================

exports.getActiveSignatures = (req, res) => {
    try {

        const signatures =
            digitalSignatureService.getActiveSignatures();

        return res.json({
            success: true,
            signatures
        });

    } catch (error) {

        console.error(
            "❌ getActiveSignatures error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil daftar digital signature.",
            error: error.message
        });

    }
};