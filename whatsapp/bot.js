const { Client, LocalAuth } = require("whatsapp-web.js");
const router = require("./messageRouter");
const qrcode = require("qrcode-terminal");
const logger = require("./utils/logger");

const client = new Client({

    

    authStrategy: new LocalAuth({

        clientId: "pgi-qc"

    }),

    puppeteer: {

    headless: false,

    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--no-first-run",
        "--no-default-browser-check"
    ]

}

});

// ==============================
// EVENT QR
// ==============================

client.on("qr", (qr) => {

    console.log("");
    console.log("📱 Scan QR WhatsApp");

    qrcode.generate(qr, {
        small: true
    });

});

// ==============================
// READY
// ==============================

client.on("ready", () => {

    logger.section("PGI QC BOT READY");

});

// ==============================
// LOADING
// ==============================

client.on("loading_screen", (percent, message) => {

    console.log(`Loading ${percent}% - ${message}`);

});

// ==============================
// AUTH FAILED
// ==============================

client.on("auth_failure", (msg) => {

    console.log("");
    console.log("❌ AUTH FAILURE");
    console.log(msg);

});

// ==============================
// DISCONNECTED
// ==============================

client.on("disconnected", (reason) => {

    console.log("");
    console.log("❌ BOT DISCONNECTED");
    console.log(reason);

});

// ==============================
// PESAN MASUK
// ==============================

client.on("message", async (msg) => {

    try {

        await router.handle(msg);

    } catch (err) {

        console.error("");
        console.error("❌ BOT ERROR");
        console.error(err);

    }

});

// ==============================

// ==============================
// START
// ==============================



client.initialize();



module.exports = client;