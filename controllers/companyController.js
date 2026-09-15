// =====================================
// CHANGE COMPANY
// =====================================

exports.changeCompany = (req, res) => {

    // =================================
    // HARUS LOGIN
    // =================================

    if (!req.session || !req.session.user) {

        return res.redirect("/login");

    }


    const user = req.session.user;


    // =================================
    // HANYA IT SUPPORT
    // =================================

    if (user.company !== "ALL") {

        return res.redirect("/");

    }


    // =================================
    // COMPANY YANG DIPILIH
    // =================================

    const company =
        req.body.company;


    if (!["PGI", "PEI"].includes(company)) {

        return res.redirect("/");

    }


    // =================================
    // SIMPAN COMPANY PILIHAN IT
    // =================================

    req.session.selectedCompany =
        company;


    res.redirect("/");

};