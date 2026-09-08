const path = require("path");

const excelService = require("../services/excelService");
const inventoryService = require("../services/inventoryService");
const batchService = require("../services/batchService");
const calendarService = require("../services/calendarService");
const activityService = require("../services/activityService");


// ===========================
// Halaman Import
// ===========================
exports.index = (req, res) => {

    let company = req.company || "PGI";

    let booking = null;


    // ==========================================
    // Jika halaman dibuka dari Booking Kalender
    // ==========================================

    if (req.query.booking_id) {

        booking =
            calendarService.getBookingById(
                req.query.booking_id
            );


        // Jika booking ditemukan,
        // gunakan company dari booking

        if (booking) {

            company = booking.company;

        }

    }


    // ==========================================
    // Ambil Batch Active berdasarkan company
    // ==========================================

    const activeBatch =
        batchService.getActiveBatch(company);


    res.render("batch", {

        activeBatch,

        booking,

        company,

        currentPage: "batch"

    });

};


// ===========================
// Import Excel
// ===========================
exports.importExcel = (req, res) => {

    try {

        // ===========================
        // Cek file
        // ===========================

        if (!req.file) {

            return res.send(
                "File belum dipilih"
            );

        }


        // ===========================
        // Company
        // ===========================

        let company =
            req.company || "PGI";

        let booking = null;


        // ==========================================
        // Jika import berasal dari Booking Kalender
        // ==========================================

        if (req.body.booking_id) {

            booking =
                calendarService.getBookingById(
                    req.body.booking_id
                );


            // Booking tidak ditemukan

            if (!booking) {

                return res.status(404).send(`
                    <h2>Booking Kalender tidak ditemukan.</h2>

                    <br>

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }


            // Booking dibatalkan

            if (booking.status === "CANCELLED") {

                return res.status(400).send(`
                    <h2>Booking Kalender sudah dibatalkan.</h2>

                    <p>
                        Booking #${booking.id}
                        tidak dapat digunakan untuk membuat Batch.
                    </p>

                    <br>

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }


            // ==========================================
            // PENTING
            // Company mengikuti Booking
            // ==========================================

            company =
                booking.company;

        }


        // ===========================
        // Cek Batch Aktif
        // ===========================

        const activeBatch =
            batchService.getActiveBatch(company);


        // ===========================
        // Baca Excel
        // ===========================

        const data =
            excelService.readExcel(
                req.file.path
            );


        // ===========================
        // Validasi Header
        // ===========================

        const validation =
            excelService.validateHeader(
                data
            );


        if (!validation.valid) {

            return res.send(
                validation.message
            );

        }


        // ===========================
        // Mapping Data
        // ===========================

        const mappedData =
            excelService.mapData(
                data
            );


        // ===========================
        // Set Company
        // ===========================

        mappedData.forEach(item => {

            item.company =
                company;

        });


        // ===========================
        // Validasi Isi Data
        // ===========================

        const errors =
            excelService.validateData(
                mappedData
            );


        if (errors.length > 0) {

            return res.send(
                errors.join("<br>")
            );

        }


        // ======================================
        // IMPORT KE BATCH AKTIF
        // ======================================

        if (req.body.importType === "append") {

            if (!activeBatch) {

                return res.send(`
                    <h2>Batch Aktif tidak ditemukan.</h2>

                    <p>
                        Tidak ditemukan Batch ACTIVE
                        untuk company ${company}.
                    </p>

                    <br>

                    <a href="/batch">
                        Kembali
                    </a>
                `);

            }


            mappedData.forEach(item => {

                item.batch_id =
                    activeBatch.id;

            });


            const result =
                inventoryService.insertInventarisAppend(
                    activeBatch.id,
                    mappedData
                );


            // ======================================
            // ACTIVITY LOG - IMPORT TAMBAHAN
            // ======================================

            try {

                activityService.createActivity({

                    company,

                    type:
                        "BATCH_IMPORTED",

                    title:
                        "Inventaris Ditambahkan",

                    message:
                        `${mappedData.length} data inventaris ` +
                        `berhasil ditambahkan ke batch ` +
                        `${activeBatch.batch_code}.`,

                    reference_id:
                        activeBatch.id

                });

            } catch (activityError) {

                console.error(
                    "⚠️ Gagal membuat activity log import tambahan:",
                    activityError
                );

            }


            return res.render(
                "import-result",
                {

                    batch:
                        activeBatch,

                    result,

                    currentPage:
                        "batch"

                }
            );

        }


        // ======================================
        // IMPORT BATCH BARU
        // Cek apakah masih ada batch ACTIVE
        // ======================================

        if (activeBatch) {

            return res.status(400).send(`
                <h2>
                    Masih ada Batch ACTIVE
                    untuk company ${company}.
                </h2>

                <p>
                    Silakan tutup batch tersebut
                    terlebih dahulu sebelum membuat batch baru.
                </p>

                <br>

                <a href="/batch">
                    Kembali
                </a>
            `);

        }


        // ======================================
        // Generate Batch Code
        // ======================================

        const batchCode =
            batchService.generateBatchCode(
                company
            );


        // ======================================
        // Simpan Batch
        // ======================================

        const dayjs =
            require("dayjs");

        require("dayjs/locale/id");

        dayjs.locale("id");


        const batchId =
            batchService.createBatch({

                batch_code:
                    batchCode,

                batch_name:
                    path.parse(
                        req.file.originalname
                    ).name,

                source_file:
                    req.file.originalname,

                company,

                total_item:
                    mappedData.length,

                created_at:
                    dayjs().format(
                        "YYYY-MM-DD HH:mm:ss"
                    )

            });


        // ======================================
        // Tambahkan batch_id
        // ======================================

        mappedData.forEach(item => {

            item.batch_id =
                batchId;


            // Semua import baru
            // dimulai dari PENDING

            item.status =
                "PENDING";

            item.reject_reason =
                "";

        });


        console.log(
            "================================"
        );

        console.log(
            "Jumlah Data Excel :",
            mappedData.length
        );

        console.log(
            "Company           :",
            company
        );

        console.log(
            "Booking ID        :",
            booking
                ? booking.id
                : "-"
        );

        console.log(
            "Data Pertama      :",
            mappedData[0]
        );

        console.log(
            "================================"
        );


        // ======================================
        // Simpan Inventaris
        // ======================================

        inventoryService.insertInventaris(
            mappedData
        );


        // Debug

        console.table(
            mappedData
        );


        // ======================================
        // ACTIVITY LOG - BATCH BARU
        // ======================================

        try {

            activityService.createActivity({

                company,

                type:
                    "BATCH_CREATED",

                title:
                    "Batch Baru Dibuat",

                message:
                    `Batch ${batchCode} berhasil dibuat ` +
                    `dengan ${mappedData.length} data inventaris.`,

                reference_id:
                    batchId

            });


            // ==================================
            // ACTIVITY LOG - IMPORT
            // ==================================

            activityService.createActivity({

                company,

                type:
                    "BATCH_IMPORTED",

                title:
                    "Import Inventaris Berhasil",

                message:
                    `${mappedData.length} data inventaris ` +
                    `berhasil diimport ke batch ${batchCode}.`,

                reference_id:
                    batchId

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log batch:",
                activityError
            );

        }


        // ======================================
        // Response
        // ======================================

        return res.render(
            "import-result",
            {

                batch: {

                    id:
                        batchId,

                    batch_code:
                        batchCode,

                    batch_name:
                        path.parse(
                            req.file.originalname
                        ).name,

                    company

                },

                result: {

                    inserted:
                        mappedData.length,

                    duplicate:
                        0

                },

                currentPage:
                    "batch"

            }
        );


    } catch (err) {

        console.error(
            "IMPORT BATCH ERROR :",
            err
        );


        return res.status(500).send(`
            <h2>Terjadi kesalahan saat import.</h2>

            <p>
                ${err.message}
            </p>

            <br>

            <a href="/batch">
                Kembali
            </a>
        `);

    }

};


// ===========================
// Tutup Batch
// ===========================

exports.closeBatch = (req, res) => {

    try {

        // ======================================
        // Cek apakah batch boleh ditutup
        // ======================================

        const result =
            batchService.canCloseBatch(
                req.company
            );


        if (!result.canClose) {

            return res.status(400).json({

                success: false,

                message:
                    `Masih ada ${result.pending} inventaris yang berstatus PENDING.`

            });

        }


        // ======================================
        // Ambil Batch Aktif Sebelum Ditutup
        // ======================================

        const activeBatch =
            batchService.getActiveBatch(
                req.company
            );


        // ======================================
        // Tutup Batch
        // ======================================

        batchService.closeBatch(
            req.company
        );


        // ======================================
        // ACTIVITY LOG - BATCH CLOSED
        // ======================================

        try {

            if (activeBatch) {

                activityService.createActivity({

                    company:
                        activeBatch.company,

                    type:
                        "BATCH_CLOSED",

                    title:
                        "Batch Ditutup",

                    message:
                        `Batch ${activeBatch.batch_code} ` +
                        `telah ditutup.`,

                    reference_id:
                        activeBatch.id

                });

            }

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log close batch:",
                activityError
            );

        }


        // ======================================
        // Response
        // ======================================

        return res.json({

            success: true,

            message:
                "Batch berhasil ditutup."

        });


    } catch (err) {

        console.error(
            "CLOSE BATCH ERROR :",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};


// ===========================
// Detail Batch
// ===========================

exports.detail = (req, res) => {

    const batch =
        batchService.getBatchById(
            req.params.id
        );


    if (!batch) {

        return res.status(404).send(
            "Batch tidak ditemukan."
        );

    }


    const keyword =
        req.query.keyword || "";


    const status =
        req.query.status || "";


    const jenis =
        req.query.jenis || "";


    const items =
        inventoryService.searchInventaris(

            batch.id,

            keyword,

            status,

            jenis

        );


    res.render("inventaris", {

        batch,

        items,

        keyword,

        status,

        jenis,

        isHistory: true,

        currentPage: "batch-history"

    });

};


// ===========================
// Halaman Riwayat Batch
// ===========================

exports.history = (req, res) => {

    const activeBatch =
        batchService.getActiveBatch(
            req.company
        );


    const history =
        batchService.getHistory(
            req.company
        );


    res.render("history", {

        activeBatch,

        history,

        company:
            req.company,

        currentPage:
            "history"

    });

};