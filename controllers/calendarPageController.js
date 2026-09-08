// =====================================
// CALENDAR PAGE CONTROLLER
// =====================================

function index(req, res) {

    const company =
        req.company || "PGI";

    res.render(
        "calendar",
        {
            company,
            currentPage: "calendar"
        }
    );
}


module.exports = {
    index
};