const express = require("express");

const router = express.Router();

const calendarController =
    require("../controllers/calendarController");


// =====================
// CALENDAR API
// =====================

// GET semua booking berdasarkan bulan
// /api/calendar?month=2026-09&company=ALL
router.get(
    "/",
    calendarController.index
);


// GET detail booking
// /api/calendar/1
router.get(
    "/:id",
    calendarController.detail
);


// CREATE booking
// POST /api/calendar
router.post(
    "/",
    calendarController.create
);


// UPDATE booking
// PUT /api/calendar/1
router.put(
    "/:id",
    calendarController.update
);


// CANCEL booking
// PATCH /api/calendar/1/cancel
router.patch(
    "/:id/cancel",
    calendarController.cancel
);


// DELETE booking
// DELETE /api/calendar/1
router.delete(
    "/:id",
    calendarController.remove
);


module.exports = router;