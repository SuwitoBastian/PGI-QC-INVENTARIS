const inventoryService = require("../services/inventoryService");
const dayjs = require("dayjs");
require("dayjs/locale/id");

dayjs.locale("id");

exports.index = (req, res) => {

    const summary =
    inventoryService.getDashboardSummary(req.company);

if (summary?.batch?.created_at) {

    summary.batch.created_at_formatted = dayjs(summary.batch.created_at)
        .format("DD MMMM YYYY • HH:mm") + " WIB";

}

    res.render("dashboard", {

        summary,
        
        company: req.company,
        
        currentPage: "dashboard"

    });

};