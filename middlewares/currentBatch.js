const batchService = require("../services/batchService");

module.exports = (req, res, next) => {
    try {

        // =====================================================
        // COMPANY AKTIF USER
        // =====================================================

        const company = String(
            req.company || ""
        ).trim().toUpperCase();


        // =====================================================
        // BELUM ADA COMPANY
        // =====================================================

        if (!["PGI", "PEI"].includes(company)) {

            res.locals.currentBatch = null;

            return next();

        }


        // =====================================================
        // AMBIL BATCH ACTIVE SESUAI COMPANY
        // =====================================================

        const batch =
            batchService.getActiveBatch(company);


        res.locals.currentBatch =
            batch || null;


        next();

    } catch (err) {

        console.error(
            "CURRENT BATCH MIDDLEWARE ERROR:",
            err
        );

        res.locals.currentBatch = null;

        next();

    }
};