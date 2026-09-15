const inventoryService = require("../services/inventoryService");
const activityService = require("../services/activityService");
const handoverService = require("../services/handoverService");

// ===========================
// Helper
// ===========================

function getCompany(req) {
    return String(req.company || "").trim().toUpperCase();
}

function isValidCompany(company) {
    return ["PGI", "PEI"].includes(company);
}

function isAuthorizedItem(item, company) {
    return item && item.company === company;
}


// ===========================
// Halaman Inventaris
// ===========================

exports.index = (req, res) => {

    const company = getCompany(req);

    if (!isValidCompany(company)) {
        return res.status(403).send("Company tidak valid.");
    }

    const batch = inventoryService.getActiveBatch(company);

    if (!batch) {
        return res.redirect("/");
    }

    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const jenis = req.query.jenis || "";

    const items = inventoryService.searchInventaris(
        batch.id,
        keyword,
        status,
        jenis
    );

    // ==========================================
    // HANDOVER GATE
    // Company wajib memiliki GA → IT APPROVED
    // ==========================================

    let handoverLocked = false;

    if (batch.company === company) {

        const gaToItApproved =
            handoverService.isGaToItApproved(batch.id);

        handoverLocked = !gaToItApproved;
    }

    return res.render("inventaris", {

        batch,
        items,

        keyword,
        status,
        jenis,

        isHistory: false,

        currentPage: "inventaris",

        // TRUE = halaman inventaris terkunci
        // FALSE = inventaris normal
        handoverLocked

    });

};


// ===========================
// Detail Inventaris
// ===========================

exports.detail = (req, res) => {

    const company = getCompany(req);

    if (!isValidCompany(company)) {
        return res.status(403).send("Company tidak valid.");
    }

    const item =
        inventoryService.getById(req.params.id);

    if (!item) {

        return res.status(404).send(
            "Data tidak ditemukan"
        );

    }

    // =====================================
    // COMPANY AUTHORIZATION
    // User hanya boleh melihat inventory
    // milik company yang sedang aktif.
    // =====================================

    if (!isAuthorizedItem(item, company)) {

        return res.status(403).send(
            "Anda tidak memiliki akses ke data inventaris ini."
        );

    }

    // =====================================
    // GATE TANDA TERIMA GA → IT
    // =====================================

    const gaToItApproved =
        handoverService.isGaToItApproved(
            item.batch_id
        );

    if (!gaToItApproved) {

        return res.redirect(
            `/inventaris?error=handover-required`
        );

    }

    return res.render("detail", {

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

    const company = getCompany(req);

    if (!isValidCompany(company)) {
        return res.status(403).send("Company tidak valid.");
    }


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
    // Status QC harus valid
    // =====================================

    if (
        status !== "DONE" &&
        status !== "REJECT"
    ) {

        return res.redirect(
            `/inventaris/${id}?error=invalid-status`
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
    // COMPANY AUTHORIZATION
    // Jangan pernah mengizinkan user
    // mengubah inventory company lain.
    // =====================================

    if (!isAuthorizedItem(item, company)) {

        return res.status(403).send(
            "Anda tidak memiliki akses ke data inventaris ini."
        );

    }


    // =====================================
    // GATE TANDA TERIMA GA → IT
    // =====================================

    const gaToItApproved =
        handoverService.isGaToItApproved(
            item.batch_id
        );

    if (!gaToItApproved) {

        return res.redirect(
            `/inventaris/${id}?error=handover-required`
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

    const company = getCompany(req);

    if (!isValidCompany(company)) {
        return res.status(403).send("Company tidak valid.");
    }


    const item =
        inventoryService.getById(id);


    if (!item) {

        return res.redirect(
            "/inventaris?error=not-found"
        );

    }


    // =====================================
    // COMPANY AUTHORIZATION
    // =====================================

    if (!isAuthorizedItem(item, company)) {

        return res.status(403).send(
            "Anda tidak memiliki akses ke data inventaris ini."
        );

    }


    // =====================================
    // GATE TANDA TERIMA GA → IT
    // =====================================

    const gaToItApproved =
        handoverService.isGaToItApproved(
            item.batch_id
        );

    if (!gaToItApproved) {

        return res.redirect(
            `/inventaris/${id}?error=handover-required`
        );

    }


    // =====================================
    // Hanya hasil QC yang boleh di-reset
    // =====================================

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