const express = require("express");

const router = express.Router();

const upload = require("../config/upload");

const batchController = require("../controllers/batchController");

router.get(
    "/",
    batchController.index
);

router.get(
    "/history",
    batchController.history
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
// Jalankan Booking → Batch
// ===========================
router.post(
    "/run-booking",
    batchController.runBooking
);

router.post(
    "/delete", 
    batchController.deleteBatch);

// ===========================
// Detail Batch
// ===========================
router.get(
    "/:id",
    batchController.detail
);

module.exports = router;
