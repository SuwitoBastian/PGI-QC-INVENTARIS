const express = require("express");

const router = express.Router();

const calendarPageController =
    require("../controllers/calendarPageController");


// =====================================
// CALENDAR PAGE
// =====================================

router.get(
    "/",
    calendarPageController.index
);


module.exports = router;