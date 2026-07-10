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

    currentPage: "inventaris"

});

};