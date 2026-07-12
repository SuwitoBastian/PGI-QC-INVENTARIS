const logger = require("./utils/logger");
const photoHandler = require("./photoHandler");
const ocrService = require("../services/ocrService");
const inventoryService = require("../services/inventoryService");
const replyService = require("./replyService");

exports.process = async (msg, result) => {

    logger.section("QC MASUK");

    logger.info("Status :", result.status);
    logger.info("Reject :", result.rejectReason || "-");

    logger.line();

    //------------------------------------------------
    // SIMPAN FOTO
    //------------------------------------------------

    const photo = await photoHandler.savePhoto(msg);

    logger.success("Foto :", photo.fileName);

    logger.line();

    //------------------------------------------------
    // OCR
    //------------------------------------------------

    const ocr = await ocrService.scan(photo.filePath);

    logger.section("OCR");

    if (!ocr.success) {

        logger.error("OCR :", "Barcode tidak ditemukan");

        try {

            await replyService.ocrFailed(msg);

        } catch (err) {

            console.error("❌ Reply Error");
            console.error(err);

        }

        return;

    }

    logger.success(
        "Candidate :",
        `${ocr.candidates.length} ditemukan`
    );

    logger.info(
        "Confidence :",
        `${ocr.confidence.toFixed(2)} %`
    );

    logger.line();

    //------------------------------------------------
    // DATABASE
    //------------------------------------------------

    const resultDb =
        inventoryService.findByCandidates(
            ocr.candidates
        );

    if (!resultDb) {

        logger.error(
            "Database :",
            "Barcode tidak ditemukan"
        );

        try {

            await replyService.notFound(
                msg,
                ocr.candidates[0] || "-"
            );

        } catch (err) {

            console.error("❌ Reply Error");
            console.error(err);

        }

        return;

    }

    const item = resultDb.item;

    const barcode = resultDb.barcode;

    logger.section("DATABASE");

    logger.success("Barcode :", barcode);
    logger.success("NF :", item.nf || "-");
    logger.success("IMEI :", item.imei || "-");
    logger.success("Merk :", item.merk);
    logger.success("Type :", item.type);
    logger.success("Status Lama :", item.status);

    logger.line();

    //------------------------------------------------
    // UPDATE DATABASE
    //------------------------------------------------

    const relativePhotoPath = photo.filePath
        .replace(/\\/g, "/")
        .replace(/^.*\/uploads/, "/uploads");

    inventoryService.updateStatus(

        barcode,

        result.status,

        result.rejectReason,

        relativePhotoPath

    );

    logger.section("QC BERHASIL");

    logger.success(
        "Status Baru :",
        result.status
    );

    if (result.rejectReason) {

        logger.info(
            "Alasan :",
            result.rejectReason
        );

    }

    logger.success(
        "Status Database :",
        "Berhasil diupdate"
    );

    //------------------------------------------------
    // BALAS WHATSAPP
    //------------------------------------------------

    try {

        console.log("📤 Mengirim balasan WhatsApp...");
        console.log("FROM :", msg.from);

        if (result.status === "DONE") {

            await replyService.success(

                msg,

                item,

                "DONE"

            );

        } else {

            await replyService.reject(

                msg,

                item,

                result.rejectReason

            );

        }

        console.log("✅ Balasan WhatsApp berhasil dikirim");

    } catch (err) {

        console.error("❌ Reply Error");
        console.error(err);

    }

};