// =====================================
// FILTER LOG INTERNAL BAILEYS / SIGNAL
// =====================================

const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;

function shouldIgnoreLog(args) {

    if (
        typeof args[0] === "string" &&
        args[0].startsWith("Closing session:")
    ) {
        return true;
    }

    return false;
}

console.log = (...args) => {
    if (shouldIgnoreLog(args)) return;
    originalConsoleLog(...args);
};

console.info = (...args) => {
    if (shouldIgnoreLog(args)) return;
    originalConsoleInfo(...args);
};

console.warn = (...args) => {
    if (shouldIgnoreLog(args)) return;
    originalConsoleWarn(...args);
};


const express = require("express");
require("dotenv").config();

const session = require("express-session");


// =====================================
// DATABASE
// =====================================

require("./database/initDatabase");


// =====================================
// ROUTES
// =====================================

const companyRoute =
    require("./routes/company");

const batchRoutes =
    require("./routes/batch");

const dashboardRoute =
    require("./routes/dashboard");

const inventoryRoute =
    require("./routes/inventory");

const devRoute =
    require("./routes/dev");

const exportRoutes =
    require("./routes/export");

const feedbackReminderRoute =
    require("./routes/feedbackReminder");

// =====================================
// CALENDAR
// =====================================

// Calendar API
const calendarRoute =
    require("./routes/calendar");

// Calendar Page
const calendarPageRoute =
    require("./routes/calendarPage");

const activityRoute =
    require("./routes/activity");


// =====================================
// MIDDLEWARE
// =====================================

const companyMiddleware =
    require("./middlewares/company");

const currentBatch =
    require("./middlewares/currentBatch");

const path = require("path");


// =====================================
// EXPRESS APP
// =====================================

const app = express();

const PORT =
    process.env.PORT || 3001;


// =====================================
// STATIC FILES
// =====================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// =====================================
// VIEW ENGINE
// =====================================

app.set(
    "view engine",
    "ejs"
);


// =====================================
// BODY PARSER
// =====================================

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.json()
);


// =====================================
// SESSION
// =====================================

app.use(
    session({
        secret: "PGI-QC-2026",
        resave: false,
        saveUninitialized: true
    })
);


// =====================================
// COMPANY MIDDLEWARE
// =====================================

app.use(
    companyMiddleware
);


// =====================================
// CURRENT BATCH
// =====================================

app.use(
    currentBatch
);


// =====================================
// UPLOADS
// =====================================

app.use(
    "/uploads",
    express.static("uploads")
);


// =====================================
// ROUTES
// =====================================

// IMPORTANT:
// Internal API harus diletakkan SEBELUM
// dashboard route "/"


// -------------------------------------
// Feedback Reminder
// -------------------------------------

app.use(
    "/internal/feedback-reminder",
    feedbackReminderRoute
);


// -------------------------------------
// Calendar API
// -------------------------------------
//
// GET    /api/calendar
// GET    /api/calendar/:id
// POST   /api/calendar
// PUT    /api/calendar/:id
// PATCH  /api/calendar/:id/cancel
// DELETE /api/calendar/:id

app.use(
    "/api/calendar",
    calendarRoute
);


// -------------------------------------
// Calendar Page
// -------------------------------------
//
// GET /kalender

app.use(
    "/kalender",
    calendarPageRoute
);

app.use(
    "/api/activity",
    activityRoute
);


// -------------------------------------
// Dashboard
// -------------------------------------

app.use(
    "/",
    dashboardRoute
);


// -------------------------------------
// Batch
// -------------------------------------

app.use(
    "/batch",
    batchRoutes
);


// -------------------------------------
// Company
// -------------------------------------

app.use(
    "/company",
    companyRoute
);


// -------------------------------------
// Inventaris
// -------------------------------------

app.use(
    "/inventaris",
    inventoryRoute
);


// -------------------------------------
// Development
// -------------------------------------

app.use(
    "/dev",
    devRoute
);


// -------------------------------------
// Export
// -------------------------------------

app.use(
    "/export",
    exportRoutes
);


// =====================================
// HTTP SERVER
// =====================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server berjalan pada port ${PORT}`
        );

    }
);


// =====================================
// WHATSAPP BAILEYS
// =====================================

const {
    connect
} = require(
    "./whatsapp/baileys/connection"
);


connect().catch((err) => {

    console.error(
        "❌ Gagal menjalankan WhatsApp Baileys"
    );

    console.error(err);

});