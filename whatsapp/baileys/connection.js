const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const router = require("../messageRouter");
const Message = require("./Message");

const { loadSession } = require("./session");
const { setSocket } = require("./socket");

async function connect() {

    const { state, saveCreds } =
        await loadSession();

    const { version } =
        await fetchLatestBaileysVersion();

    console.log("");
    console.log("================================");
    console.log("Starting PGI QC Baileys...");
    console.log("================================");

    const sock = makeWASocket({

        version,

        auth: {
            creds: state.creds,

            keys: makeCacheableSignalKeyStore(
                state.keys,
                pino({ level: "silent" })
            )
        },

        logger: pino({
            level: "silent"
        }),

        browser: [
            "PGI QC Inventaris",
            "Chrome",
            "1.0.0"
        ]

    });

    setSocket(sock);

    sock.ev.on(
        "creds.update",
        saveCreds
    );

    sock.ev.on(
    "messages.upsert",
    async ({ messages, type }) => {

        if (type !== "notify")
            return;

        for (const raw of messages) {

            try {

                if (!raw.message)
                    continue;

                const msg =
                    new Message(raw);

                console.log("");
                console.log("📩 PESAN MASUK BAILEYS");
                console.log("FROM :", msg.from);
                console.log("BODY :", msg.body);
                console.log("MEDIA:", msg.hasMedia);

                await router.handle(msg);

            } catch (err) {

                console.error("");
                console.error("❌ MESSAGE ROUTER ERROR");
                console.error(err);

            }

        }

    }
);

    sock.ev.on(
        "connection.update",
        (update) => {

            const {
                connection,
                lastDisconnect,
                qr
            } = update;

            if (qr) {

                console.clear();

                console.log("");
                console.log("================================");
                console.log("SCAN QR WHATSAPP QC");
                console.log("================================");

                qrcode.generate(qr, {
                    small: true
                });
            }

            if (connection === "connecting") {
                console.log("🟡 Connecting...");
            }

            if (connection === "open") {

                console.log("");
                console.log("================================");
                console.log("🟢 PGI QC BAILEYS CONNECTED");
                console.log("================================");
            }

            if (connection === "close") {

                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                console.log("🔴 Connection Closed");

                if (shouldReconnect) {

                    console.log("♻️ Reconnecting...");

                    setTimeout(() => {
                        connect();
                    }, 3000);

                } else {

                    console.log("❌ Session Logout");

                }
            }

        }
    );

    return sock;
}

module.exports = {
    connect
};