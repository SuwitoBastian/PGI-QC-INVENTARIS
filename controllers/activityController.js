const activityService = require("../services/activityService");

exports.index = (req, res) => {
    try {
        // Company diambil dari middleware/session.
        // Jangan ambil dari query ?company= agar user tidak bisa
        // meminta activity perusahaan lain.
        const company = String(req.company || "PGI").toUpperCase();

        // Maksimal 10 activity
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            10
        );

        const activities =
            activityService.getActivitiesByCompany(company, limit);

        return res.json({
            success: true,
            company,
            activities
        });
    } catch (error) {
        console.error("❌ Activity index error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil activity log"
        });
    }
};