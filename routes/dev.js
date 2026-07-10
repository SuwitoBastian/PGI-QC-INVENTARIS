const multer = require("multer");

const upload = multer({

    dest:"uploads/test"

});
const express = require("express");

const router = express.Router();

const developerController = require("../controllers/developerController");

router.post(
    "/barcode",
    upload.single("barcode"),
    developerController.upload
);

router.get("/", developerController.index);

router.get("/barcode", developerController.barcode);

module.exports = router;