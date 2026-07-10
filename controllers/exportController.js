const exportService = require("../services/exportService");

// ======================================
// Export Batch Aktif
// ======================================
exports.exportExcel = async (req, res) => {

    console.log("Company Export :", req.company);

    try {

        await exportService.exportExcel(req.company, res);

    } catch (err) {

        console.error(err);

        res.status(500).send("Export gagal.");

    }

};

// ======================================
// Export Batch History
// ======================================
exports.exportBatch = async (req, res) => {

    try {

        await exportService.exportBatch(

            req.params.id,

            res

        );

    } catch (err) {

        console.error(err);

        res.status(500).send("Export Batch gagal.");

    }

};