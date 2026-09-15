// =====================================
// COMPANY MIDDLEWARE
// =====================================

module.exports = (req, res, next) => {

    // =================================
    // BELUM LOGIN
    // =================================

    if (!req.session || !req.session.user) {

        req.company = null;

        res.locals.company = null;

        return next();
    }


    // =================================
    // COMPANY DARI USER LOGIN
    // =================================

    const user = req.session.user;


    // ---------------------------------
    // IT SUPPORT
    // Bisa akses PGI + PEI
    // ---------------------------------

    if (user.company === "ALL") {

        /*
         * Untuk IT, sementara gunakan
         * company yang dipilih di session
         * jika ada.
         *
         * Default IT = PGI
         */

        if (
            req.session.selectedCompany === "PGI" ||
            req.session.selectedCompany === "PEI"
        ) {

            req.company =
                req.session.selectedCompany;

        } else {

            req.company = "PGI";

        }

    }


    // ---------------------------------
    // GA PGI
    // Terkunci PGI
    // ---------------------------------

    else if (user.company === "PGI") {

        req.company = "PGI";

    }


    // ---------------------------------
    // GA PEI
    // Terkunci PEI
    // ---------------------------------

    else if (user.company === "PEI") {

        req.company = "PEI";

    }


    // ---------------------------------
    // COMPANY TIDAK VALID
    // ---------------------------------

    else {

        req.company = null;

    }


    res.locals.company = req.company;

    next();

};