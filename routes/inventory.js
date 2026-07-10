const express = require("express");

const router = express.Router();

const inventoryController = require("../controllers/inventoryController");

// Daftar Inventaris
router.get("/", inventoryController.index);

// Detail Inventaris
router.get("/:id", inventoryController.detail);

module.exports = router;