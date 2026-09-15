const activityService = require("../services/activityService");

exports.index = (req, res) => {
    try {
        // ==========================================
        // USER ROLE
        // ==========================================

        const role = String(
            req.user?.role || ""
        )
            .trim()
            .toUpperCase();


        // ==========================================
        // LIMIT
        // ==========================================

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 10,
                1
            ),
            10
        );


        // ==========================================
        // IT SUPPORT
        // ==========================================
        // IT boleh melihat activity PGI + PEI.
        //
        // Jika ada ?company=PGI
        // → hanya PGI
        //
        // Jika ada ?company=PEI
        // → hanya PEI
        //
        // Jika tidak ada filter
        // → semua company PGI + PEI
        // ==========================================

        if (role === "IT") {

            const requestedCompany =
                String(
                    req.query.company || ""
                )
                    .trim()
                    .toUpperCase();


            // ------------------------------------------
            // IT FILTER PGI / PEI
            // ------------------------------------------

            if (
                requestedCompany === "PGI" ||
                requestedCompany === "PEI"
            ) {

                const activities =
                    activityService.getActivitiesByCompany(
                        requestedCompany,
                        limit
                    );

                return res.json({
                    success: true,
                    company: requestedCompany,
                    activities
                });
            }


            // ------------------------------------------
            // IT TANPA FILTER
            // PGI + PEI
            // ------------------------------------------

            const activities =
                activityService.getLatestActivities(
                    limit
                );

            return res.json({
                success: true,
                company: "ALL",
                activities
            });
        }


        // ==========================================
        // GA
        // ==========================================
        // GA tetap terkunci ke company session.
        // Tidak boleh meminta company lain lewat query.
        // ==========================================

        const company = String(
            req.company || "PGI"
        )
            .trim()
            .toUpperCase();


        const activities =
            activityService.getActivitiesByCompany(
                company,
                limit
            );


        return res.json({
            success: true,
            company,
            activities
        });

    } catch (error) {

        console.error(
            "❌ Activity index error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil activity log"
        });
    }
};