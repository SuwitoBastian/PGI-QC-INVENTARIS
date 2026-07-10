module.exports = (req, res, next) => {

    if (!req.session.company) {
        req.session.company = "PGI";
    }

    req.company = req.session.company;

    res.locals.company = req.company;

    next();

};