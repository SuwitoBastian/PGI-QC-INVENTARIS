const fs = require("fs");
const path = require("path");

exports.savePhoto = async (msg) => {

    const media = await msg.downloadMedia();

    if (!media) {
        throw new Error("Media gagal didownload.");
    }

    const extension = media.mimetype.split("/")[1];

    const now = new Date();

    const fileName =
        `QC_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.${extension}`;

    const folder = path.join(__dirname, "../uploads/barcode");

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    const filePath = path.join(folder, fileName);

    fs.writeFileSync(
        filePath,
        media.data,
        "base64"
    );

    return {

        fileName,

        filePath

    };

};