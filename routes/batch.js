const express = require("express");

const router = express.Router();

const upload = require("../config/upload");

const batchController = require("../controllers/batchController");

router.get(
    "/",
    batchController.index
);

router.post(
    "/import",
    upload.single("excel"),
    batchController.importExcel
);

router.post(
    "/close",
    batchController.closeBatch
);

// ===========================
// Detail Batch
// ===========================
router.get(
    "/:id",
    batchController.detail
);

module.exports = router;