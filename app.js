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


// Database
require("./database/initDatabase");

// Routes
const companyRoute = require("./routes/company");

const batchRoutes = require("./routes/batch");

const app = express();

const PORT = process.env.PORT || 3000;

const dashboardRoute = require("./routes/dashboard");

const inventoryRoute = require("./routes/inventory");

const companyMiddleware = require("./middlewares/company");

const devRoute = require("./routes/dev");
const path = require("path");

const exportRoutes = require("./routes/export");

app.use(express.static(path.join(__dirname,"public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// View Engine
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "PGI-QC-2026",
    resave: false,
    saveUninitialized: true
}));

app.use(companyMiddleware);

const currentBatch = require("./middlewares/currentBatch");

app.use(currentBatch);
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/", dashboardRoute);
app.use("/batch", batchRoutes);
app.use("/company", companyRoute);
app.use("/inventaris", inventoryRoute);
app.use("/dev", devRoute);
app.use("/export", exportRoutes);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server berjalan pada port ${PORT}`);
});
const { connect } = require("./whatsapp/baileys/connection");

connect().catch((err) => {
    console.error("❌ Gagal menjalankan WhatsApp Baileys");
    console.error(err);
});