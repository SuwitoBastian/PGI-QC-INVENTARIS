const express = require("express");

const router = express.Router();

const inventoryController = require("../controllers/inventoryController");

// Daftar Inventaris
router.get("/", inventoryController.index);

// Cetak Label QC
router.get(
    "/:id/label",
    inventoryController.printLabel
);

// Detail Inventaris
router.get("/:id", inventoryController.detail);

router.post("/:id/edit-qc", inventoryController.editQC);

// ===========================
// Manual QC
// ===========================
router.post(
    "/:id/manual-qc",
    inventoryController.manualQC
);

module.exports = router;