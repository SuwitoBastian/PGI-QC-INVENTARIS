const express = require("express");

const router = express.Router();

const authController =
    require("../controllers/authController");

const {
    redirectIfAuthenticated
} = require("../middlewares/auth");


// =====================================
// LOGIN PAGE
// =====================================

router.get(
    "/login",
    redirectIfAuthenticated,
    authController.loginPage
);


// =====================================
// LOGIN
// =====================================

router.post(
    "/login",
    redirectIfAuthenticated,
    authController.login
);


// =====================================
// LOGOUT
// =====================================

router.post(
    "/logout",
    authController.logout
);


module.exports = router;