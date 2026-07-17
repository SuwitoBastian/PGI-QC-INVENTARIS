const fs = require("fs");
const path = require("path");

const {
    downloadMediaMessage
} = require("@whiskeysockets/baileys");


exports.savePhoto = async (msg) => {

    // =====================================
    // DOWNLOAD MEDIA DARI BAILEYS
    // =====================================

    const buffer = await downloadMediaMessage(
        msg.raw,
        "buffer",
        {},
        {
            reuploadRequest:
                msg.sock.updateMediaMessage
        }
    );

    if (!buffer) {
        throw new Error(
            "Media gagal didownload."
        );
    }


    // =====================================
    // DETEKSI TIPE MEDIA
    // =====================================

    const message =
        msg.raw.message;

    const mediaMessage =
        message.imageMessage ||
        message.videoMessage ||
        message.documentMessage;

    if (!mediaMessage) {
        throw new Error(
            "Tipe media tidak didukung."
        );
    }


    // =====================================
    // EXTENSION
    // =====================================

    const mimetype =
        mediaMessage.mimetype ||
        "image/jpeg";

    let extension =
        mimetype.split("/")[1] ||
        "jpg";

    // Contoh:
    // image/jpeg → jpeg
    // Kita normalkan menjadi jpg

    if (extension === "jpeg") {
        extension = "jpg";
    }


    // =====================================
    // NAMA FILE
    // =====================================

    const now =
        new Date();

    const fileName =
        `QC_${now.getFullYear()}` +
        `${String(now.getMonth() + 1).padStart(2, "0")}` +
        `${String(now.getDate()).padStart(2, "0")}_` +
        `${String(now.getHours()).padStart(2, "0")}` +
        `${String(now.getMinutes()).padStart(2, "0")}` +
        `${String(now.getSeconds()).padStart(2, "0")}.` +
        extension;


    // =====================================
    // FOLDER UPLOAD
    // =====================================

    const folder =
        path.join(
            __dirname,
            "../uploads/barcode"
        );

    if (!fs.existsSync(folder)) {

        fs.mkdirSync(
            folder,
            {
                recursive: true
            }
        );

    }


    // =====================================
    // SIMPAN FILE
    // =====================================

    const filePath =
        path.join(
            folder,
            fileName
        );

    fs.writeFileSync(
        filePath,
        buffer
    );


    // =====================================
    // RETURN
    // =====================================

    return {
        fileName,
        filePath
    };

};