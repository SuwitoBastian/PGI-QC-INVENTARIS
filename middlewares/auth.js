// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================


// =====================================
// REQUIRE LOGIN
// =====================================

const requireAuth = (req, res, next) => {

    // ---------------------------------
    // Belum login
    // ---------------------------------

    if (!req.session || !req.session.user) {

        // API request
        if (
            req.path.startsWith("/api/") ||
            req.path.startsWith("/internal/")
        ) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized. Silakan login terlebih dahulu."
            });

        }


        // Web request
        return res.redirect("/login");

    }


    // ---------------------------------
    // User tersedia
    // ---------------------------------

    req.user = req.session.user;

    res.locals.user = req.user;


    next();

};


// =====================================
// REDIRECT JIKA SUDAH LOGIN
// =====================================

const redirectIfAuthenticated = (req, res, next) => {

    if (req.session && req.session.user) {

        return res.redirect("/");

    }

    next();

};


// =====================================
// EXPORT
// =====================================

module.exports = {

    requireAuth,

    redirectIfAuthenticated

};