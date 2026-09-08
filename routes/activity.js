const express = require("express");

const router =
    express.Router();

const activityController =
    require("../controllers/activityController");


router.get(
    "/",
    activityController.index
);


module.exports = router;