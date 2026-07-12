const inventoryService = require("../services/inventoryService");

exports.index = (req, res) => {

    const batch = inventoryService.getActiveBatch(req.company);

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
exports.detail = (req, res) => {

    const item = inventoryService.getById(req.params.id);

    if (!item) {
        return res.send("Data tidak ditemukan");
    }

    res.render("detail", {

        item,

        currentPage: "inventaris",

        success: req.query.success || null,

        error: req.query.error || null

    });

};
exports.manualQC = (req, res) => {

    const id = req.params.id;

    const status = req.body.status;

    const rejectReason = (req.body.reject_reason || "").trim();

    // Reject wajib memiliki alasan
    if (
        status === "REJECT" &&
        !rejectReason
    ) {

        return res.redirect(
            `/inventaris/${id}?error=reject-required`
        );

    }

    const item = inventoryService.getById(id);

    if (!item) {

        return res.redirect(
            "/inventaris?error=not-found"
        );

    }

    if (item.status !== "PENDING") {

        return res.redirect(
            `/inventaris/${id}?error=already-qc`
        );

    }

    inventoryService.manualQC(
        id,
        status,
        rejectReason
    );

    return res.redirect(
        `/inventaris/${id}?success=${status.toLowerCase()}`
    );

};

exports.editQC = (req, res) => {

    const id = req.params.id;

    const item = inventoryService.getById(id);

    if (!item) {

        return res.redirect(
            "/inventaris?error=not-found"
        );

    }

    if (item.status === "PENDING") {

        return res.redirect(
            `/inventaris/${id}?error=already-pending`
        );

    }

    inventoryService.resetQC(id);

    return res.redirect(
        `/inventaris/${id}?success=edit`
    );

};