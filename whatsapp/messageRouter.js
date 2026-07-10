const parser = require("./parser");
const qcHandler = require("./qcHandler");

exports.handle = async (msg) => {

    // Abaikan pesan dari bot sendiri
    if (msg.fromMe) return;

    // Abaikan grup
    if (msg.from.endsWith("@g.us")) return;

    // Abaikan status WhatsApp
    if (msg.from === "status@broadcast") return;

    // Harus ada foto
    if (!msg.hasMedia) return;

    // Harus ada caption
    if (!msg.body || msg.body.trim() === "") return;

    // Parsing laporan QC
    const parsed = parser.parseQCMessage(msg.body);

    // Bukan format #QC
    if (!parsed) return;

    // Format salah
    if (!parsed.success) {

    await msg.client.sendMessage(
        msg.from,
        parsed.message
    );

    return;

}

    try {

        console.log("");
        console.log("========================================");
        console.log("📩 LAPORAN QC DITERIMA");
        console.log("========================================");
        console.log("Pengirim :", msg.from);
        console.log("Status   :", parsed.status);

        if (parsed.rejectReason) {
            console.log("Alasan   :", parsed.rejectReason);
        }

        console.log("========================================");

        await qcHandler.process(msg, parsed);

    } catch (err) {

        console.error("❌ QC Handler Error");
        console.error(err);

    }

};