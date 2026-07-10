exports.changeCompany = (req, res) => {

    const company = req.body.company;

    if (!["PGI", "PEI"].includes(company)) {
        return res.redirect("/");
    }

    req.session.company = company;

    res.redirect("/");

};