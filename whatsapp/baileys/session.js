const path = require("path");

const {
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");

async function loadSession() {

    const sessionPath = path.join(
        __dirname,
        "../../session-qc"
    );

    return await useMultiFileAuthState(sessionPath);
}

module.exports = {
    loadSession
};