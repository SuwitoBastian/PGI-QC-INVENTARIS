const batchService = require("../services/batchService");

module.exports = (req, res, next) => {

    try {

        const batch = batchService.getActiveBatch();

        res.locals.currentBatch = batch || null;

    } catch (err) {

        res.locals.currentBatch = null;

    }

    next();

};