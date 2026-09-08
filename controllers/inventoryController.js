const inventoryService = require("../services/inventoryService");
const activityService = require("../services/activityService");


// ===========================
// Halaman Inventaris
// ===========================

exports.index = (req, res) => {

    const batch =
        inventoryService.getActiveBatch(
            req.company
        );


    if (!batch) {

        return res.redirect("/");

    }


    const keyword =
        req.query.keyword || "";


    const status =
        req.query.status || "";


    const jenis =
        req.query.jenis || "";


    const items =
        inventoryService.searchInventaris(

            batch.id,

            keyword,

            status,

            jenis

        );


    res.render("inventaris", {

        batch,

        items,

        keyword,

        status,

        jenis,

        isHistory: false,

        currentPage: "inventaris"

    });

};


// ===========================
// Detail Inventaris
// ===========================

exports.detail = (req, res) => {

    const item =
        inventoryService.getById(
            req.params.id
        );


    if (!item) {

        return res.send(
            "Data tidak ditemukan"
        );

    }


    res.render("detail", {

        item,

        currentPage:
            "inventaris",

        success:
            req.query.success || null,

        error:
            req.query.error || null

    });

};


// ===========================
// Manual QC
// ===========================

exports.manualQC = (req, res) => {

    const id =
        req.params.id;


    const status =
        req.body.status;


    const rejectReason =
        (
            req.body.reject_reason ||
            ""
        ).trim();


    // =====================================
    // Reject wajib memiliki alasan
    // =====================================

    if (
        status === "REJECT" &&
        !rejectReason
    ) {

        return res.redirect(
            `/inventaris/${id}?error=reject-required`
        );

    }


    // =====================================
    // Ambil data inventaris
    // =====================================

    const item =
        inventoryService.getById(id);


    if (!item) {

        return res.redirect(
            "/inventaris?error=not-found"
        );

    }


    // =====================================
    // Hanya PENDING yang boleh di-QC
    // =====================================

    if (
        item.status !== "PENDING"
    ) {

        return res.redirect(
            `/inventaris/${id}?error=already-qc`
        );

    }


    // =====================================
    // Update QC
    // =====================================

    const result =
        inventoryService.manualQC(

            id,

            status,

            rejectReason

        );


    // =====================================
    // ACTIVITY LOG
    // =====================================

    try {

        if (result && result.changes > 0) {

            if (status === "DONE") {

                activityService.createActivity({

                    company:
                        item.company,

                    type:
                        "QC_DONE",

                    title:
                        "QC Selesai",

                    message:
                        `${item.company} - ` +
                        `${item.jenis || "Asset"} ` +
                        `${item.nf || item.imei || "-"}` +
                        ` dinyatakan DONE.`,

                    reference_id:
                        item.id

                });

            }


            if (status === "REJECT") {

                activityService.createActivity({

                    company:
                        item.company,

                    type:
                        "QC_REJECT",

                    title:
                        "QC Reject",

                    message:
                        `${item.company} - ` +
                        `${item.jenis || "Asset"} ` +
                        `${item.nf || item.imei || "-"}` +
                        ` dinyatakan REJECT.` +
                        ` Alasan: ${rejectReason}`,

                    reference_id:
                        item.id

                });

            }

        }

    } catch (activityError) {

        console.error(
            "⚠️ Gagal membuat activity log QC:",
            activityError
        );

    }


    // =====================================
    // Response
    // =====================================

    return res.redirect(
        `/inventaris/${id}?success=${status.toLowerCase()}`
    );

};


// ===========================
// Edit / Reset QC
// ===========================

exports.editQC = (req, res) => {

    const id =
        req.params.id;


    const item =
        inventoryService.getById(id);


    if (!item) {

        return res.redirect(
            "/inventaris?error=not-found"
        );

    }


    if (
        item.status === "PENDING"
    ) {

        return res.redirect(
            `/inventaris/${id}?error=already-pending`
        );

    }


    // =====================================
    // Reset QC
    // =====================================

    const result =
        inventoryService.resetQC(id);


    // =====================================
    // ACTIVITY LOG
    // =====================================

    try {

        if (result && result.changes > 0) {

            activityService.createActivity({

                company:
                    item.company,

                type:
                    "QC_RESET",

                title:
                    "QC Diulang",

                message:
                    `${item.company} - ` +
                    `${item.jenis || "Asset"} ` +
                    `${item.nf || item.imei || "-"}` +
                    ` dikembalikan ke status PENDING ` +
                    `untuk pemeriksaan ulang.`,

                reference_id:
                    item.id

            });

        }

    } catch (activityError) {

        console.error(
            "⚠️ Gagal membuat activity log reset QC:",
            activityError
        );

    }


    return res.redirect(
        `/inventaris/${id}?success=edit`
    );

};