const { getSocket } = require('../whatsapp/baileys/socket');
const reportService = require("./qcReportService");

function getTargetGroupJid() {
    const jid = String(process.env.QC_REPORT_GROUP_JID || "").trim();
    if (!jid) throw new Error("QC_REPORT_GROUP_JID belum diatur di file .env.");
    if (!jid.endsWith("@g.us")) throw new Error("QC_REPORT_GROUP_JID harus berupa JID grup WhatsApp yang berakhiran @g.us.");
    return jid;
}

exports.sendBatchReport = async (batchId) => {
    const report = reportService.getReportByBatch(batchId);
    if (!report) throw new Error("Laporan batch belum tersedia.");

    if (report.status === "SENT") {
        return { sent: true, alreadySent: true, status: "SENT" };
    }

    const claim = reportService.claimReportForSending(batchId);
    if (claim.changes !== 1) {
        const current = reportService.getReportByBatch(batchId);
        return {
            sent: current?.status === "SENT",
            alreadySent: current?.status === "SENT",
            status: current?.status || "UNKNOWN",
            message: current?.status === "SENDING"
                ? "Laporan sedang dalam proses pengiriman."
                : "Laporan belum dapat dikirim ulang dari status saat ini."
        };
    }

    try {
        const jid = getTargetGroupJid();
        const socket = getSocket();
        if (!socket || !socket.user || typeof socket.sendMessage !== "function") {
            throw new Error("Koneksi WhatsApp Admin belum aktif.");
        }

        const result = await socket.sendMessage(jid, { text: report.report_text });
        const messageId = result?.key?.id || null;
        reportService.markReportSent(batchId, messageId);

        return { sent: true, alreadySent: false, status: "SENT", messageId };
    } catch (error) {
        reportService.markReportFailed(batchId, error);
        return { sent: false, status: "FAILED", error: error.message };
    }
};
