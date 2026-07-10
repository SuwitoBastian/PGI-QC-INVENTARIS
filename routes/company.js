const express = require("express");

const router = express.Router();

const companyController =
require("../controllers/companyController");

router.post("/", companyController.changeCompany);

module.exports = router;