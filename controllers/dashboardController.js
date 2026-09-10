const inventoryService = require("../services/inventoryService");
const calendarService = require("../services/calendarService");
const dayjs = require("dayjs");
require("dayjs/locale/id");

dayjs.locale("id");

exports.index = (req, res) => {
    const summary =
        inventoryService.getDashboardSummary(req.company);

    const totalInventarisKeseluruhan =
        inventoryService.getTotalInventarisByCompany(req.company);

    const upcomingBookings =
        calendarService.getUpcomingBookings(req.company, 5);

    if (summary?.batch?.created_at) {
        summary.batch.created_at_formatted =
            dayjs(summary.batch.created_at)
                .format("DD MMMM YYYY • HH:mm") + " WIB";
    }

    res.render("dashboard", {
        summary,
        totalInventarisKeseluruhan,
        upcomingBookings,
        company: req.company,
        currentPage: "dashboard"
    });
};