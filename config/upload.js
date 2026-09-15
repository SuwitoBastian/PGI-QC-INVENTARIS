const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/excel");
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        cb(
            null,
            `${Date.now()}${ext}`
        );
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [
        ".xlsx",
        ".xls"
    ];

    const allowedMimeTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (
        allowedExtensions.includes(ext) &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        return cb(null, true);
    }

    return cb(
        new Error("File harus berupa Excel (.xlsx atau .xls).")
    );
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});