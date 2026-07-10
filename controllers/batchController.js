const path = require("path");

const excelService = require("../services/excelService");
const inventoryService = require("../services/inventoryService");
const batchService = require("../services/batchService");

// ===========================
// Halaman Import
// ===========================
exports.index = (req, res) => {

    const activeBatch =
    batchService.getActiveBatch(req.company);

    const history =
    batchService.getHistory(req.company);

    res.render("batch",{

    activeBatch,

    history,

    company: req.company,

    currentPage:"batch"

});;

};

// ===========================
// Import Excel
// ===========================
exports.importExcel = (req, res) => {

    // Cek file
    if (!req.file) {
        return res.send("File belum dipilih");
    }
    // Cek apakah ada Batch Aktif
    const activeBatch =
    batchService.getActiveBatch(req.company);

    // Baca Excel
    const data = excelService.readExcel(req.file.path);

    // Validasi Header
    const validation = excelService.validateHeader(data);

    if (!validation.valid) {
        return res.send(validation.message);
    }

    // Mapping Data
    const mappedData = excelService.mapData(data);

    const company = req.company;

    mappedData.forEach(item => {
        item.company = company;
    });

    // Validasi Isi Data
    const errors = excelService.validateData(mappedData);

    if (errors.length > 0) {
        return res.send(errors.join("<br>"));
    }
    
    // ======================================
// IMPORT KE BATCH AKTIF
// ======================================

if (req.body.importType === "append") {

    if (!activeBatch) {

        return res.send(`
            <h2>Batch Aktif tidak ditemukan.</h2>

            <a href="/batch">
                Kembali
            </a>
        `);

    }

    mappedData.forEach(item => {

        item.batch_id = activeBatch.id;

    });

    const result =
        inventoryService.insertInventarisAppend(
            activeBatch.id,
            mappedData
        );

    return res.render("import-result", {

    batch: activeBatch,

    result,

    currentPage:"batch"

});
// ======================================
// IMPORT BATCH BARU
// Cek apakah masih ada batch ACTIVE
// ======================================

if (activeBatch) {

    return res.status(400).send(`
        <h2>Masih ada Batch ACTIVE untuk company ${req.company}.</h2>

        <p>
            Silakan tutup batch tersebut terlebih dahulu sebelum membuat batch baru.
        </p>

        <br>

        <a href="/batch">
            Kembali
        </a>
    `);

}
}
    // Generate Batch Code
    const batchCode = batchService.generateBatchCode(req.company);

    // Simpan Batch
    const dayjs = require("dayjs");
require("dayjs/locale/id");

dayjs.locale("id");

const batchId =
batchService.createBatch({

    batch_code: batchCode,

    batch_name: path.parse(req.file.originalname).name,

    source_file: req.file.originalname,

    company,

    total_item: mappedData.length,

    created_at: dayjs().format("YYYY-MM-DD HH:mm:ss")

});

    // Tambahkan batch_id ke setiap data
    mappedData.forEach(item => {
        item.batch_id = batchId;

        // Semua import baru dimulai dari PENDING
        item.status = "PENDING";
        item.reject_reason = "";
    });
    console.log("================================");
console.log("Jumlah Data Excel :", mappedData.length);
console.log("Data Pertama :", mappedData[0]);
console.log("================================");
    // Simpan Inventaris
    inventoryService.insertInventaris(mappedData);

    // Debug
    console.table(mappedData);

    // Response
    return res.render("import-result", {

    batch: {

        batch_code: batchCode,

        batch_name: path.parse(req.file.originalname).name

    },

    result: {

        inserted: mappedData.length,

        duplicate: 0

    },

    currentPage:"batch"

});

};
// ===========================
// Tutup Batch
// ===========================

exports.closeBatch = (req, res) => {

    try {

        const result =
            batchService.canCloseBatch(req.company);

        if (!result.canClose) {

            return res.status(400).json({

                success: false,

                message: `Masih ada ${result.pending} inventaris yang berstatus PENDING.`

            });

        }

        batchService.closeBatch(req.company);

        return res.json({

            success: true,

            message: "Batch berhasil ditutup."

        });

    } catch (err) {

        console.error("CLOSE BATCH ERROR :", err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
// ===========================
// Detail Batch
// ===========================
exports.detail = (req, res) => {

    const batch =
        batchService.getBatchById(req.params.id);

    if (!batch) {

        return res.status(404).send("Batch tidak ditemukan.");

    }

    const items =
        batchService.getInventarisByBatch(batch.id);

    res.render("inventaris", {

        batch,

        items,

        keyword: "",

        status: "",

        jenis: "",

        isHistory: true,

        currentPage: "batch"

    });

};