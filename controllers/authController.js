const db = require("../config/database");
const bcrypt = require("bcryptjs");
const activityService = require("../services/activityService");

// =====================================
// HALAMAN LOGIN
// =====================================

exports.loginPage = (req, res) => {

    if (req.session.user) {

        return res.redirect("/");

    }

    const error =
        req.query.error || null;

    res.render("login", {
        error
    });

};


// =====================================
// PROSES LOGIN
// =====================================

exports.login = async (req, res) => {

    try {

        const username =
            String(
                req.body.username || ""
            ).trim();

        const password =
            String(
                req.body.password || ""
            );


        // ---------------------------------
        // Validasi input
        // ---------------------------------

        if (!username || !password) {

            return res.redirect(
                "/login?error=Username+dan+password+wajib+diisi."
            );

        }


        // ---------------------------------
        // Cari user
        // ---------------------------------

        const user =
            db.prepare(`
                SELECT
                    id,
                    username,
                    password_hash,
                    role,
                    company,
                    display_name,
                    status
                FROM users
                WHERE username = ?
                LIMIT 1
            `).get(username);


        if (!user) {

            return res.redirect(
                "/login?error=Username+atau+password+salah."
            );

        }


        // ---------------------------------
        // Cek status
        // ---------------------------------

        if (user.status !== "ACTIVE") {

            return res.redirect(
                "/login?error=Akun+tidak+aktif."
            );

        }


        // ---------------------------------
        // Cek password
        // ---------------------------------

        const passwordValid =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!passwordValid) {

            return res.redirect(
                "/login?error=Username+atau+password+salah."
            );

        }


        // =================================
        // REGENERATE SESSION
        // =================================

        req.session.regenerate((err) => {

            if (err) {

                console.error(
                    "SESSION REGENERATE ERROR:",
                    err
                );

                return res.redirect(
                    "/login?error=Gagal+membuat+session."
                );

            }


            // ---------------------------------
            // Simpan user ke session
            // ---------------------------------

            req.session.user = {

                id: user.id,

                username: user.username,

                role: user.role,

                company: user.company,

                display_name: user.display_name

            };


            // =================================
            // COMPANY
            // =================================

            if (user.company === "PGI") {

                /*
                 * GA PGI
                 * Company terkunci PGI
                 */

                req.session.selectedCompany =
                    "PGI";

            }

            else if (user.company === "PEI") {

                /*
                 * GA PEI
                 * Company terkunci PEI
                 */

                req.session.selectedCompany =
                    "PEI";

            }

            else if (user.company === "ALL") {

                /*
                 * IT Support
                 * Default masuk PGI
                 */

                req.session.selectedCompany =
                    "PGI";

            }


            // =================================
            // SIMPAN SESSION
            // =================================

            req.session.save((saveErr) => {

                if (saveErr) {

                    console.error(
                        "SESSION SAVE ERROR:",
                        saveErr
                    );

                    return res.redirect(
                        "/login?error=Gagal+menyimpan+session."
                    );

                }


                // =================================
                // ACTIVITY LOG LOGIN
                // =================================

                try {

                    activityService.createActivity({

                        company:
                            user.company || null,

                        type:
                            "LOGIN",

                        title:
                            "Login Berhasil",

                        message:
                            `${user.display_name || user.username} ` +
                            `berhasil login ke sistem.`,

                        reference_id:
                            user.id

                    });

                }

                catch (activityError) {

                    // Activity log gagal tidak boleh
                    // menggagalkan proses login.

                    console.error(
                        "⚠️ Gagal membuat activity log login:",
                        activityError
                    );

                }


                return res.redirect("/");

            });

        });

    }


    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.redirect(
            "/login?error=Terjadi+kesalahan+server."
        );

    }

};


// =====================================
// LOGOUT
// =====================================

exports.logout = (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.error(
                "LOGOUT SESSION ERROR:",
                err
            );

        }

        res.clearCookie(
            "connect.sid"
        );

        return res.redirect("/login");

    });

};