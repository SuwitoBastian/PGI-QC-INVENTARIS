const path = require("path");

const excelService = require("../services/excelService");
const inventoryService = require("../services/inventoryService");
const batchService = require("../services/batchService");
const calendarService = require("../services/calendarService");
const activityService = require("../services/activityService");
const handoverService = require("../services/handoverService");


// =====================================================
// HELPER
// =====================================================

function getCompany(req) {
    return String(req.company || "")
        .trim()
        .toUpperCase();
}

function isValidCompany(company) {
    return ["PGI", "PEI"].includes(company);
}


// =====================================================
// HALAMAN BATCH / IMPORT
// =====================================================

exports.index = (req, res) => {

    try {

        const company = getCompany(req);

        if (!isValidCompany(company)) {
            return res.status(400).send(
                "Company tidak valid."
            );
        }

        let booking = null;

        // =================================================
        // Jika halaman dibuka dari Booking Kalender
        // =================================================

        if (req.query.booking_id) {

            booking =
                calendarService.getBookingById(
                    req.query.booking_id
                );

            if (!booking) {

                return res.status(404).send(
                    "Booking Kalender tidak ditemukan."
                );

            }

            // =================================================
            // SECURITY:
            // Booking harus milik company user
            // =================================================

            if (
                String(booking.company || "")
                    .trim()
                    .toUpperCase() !== company
            ) {

                return res.status(403).send(`
                    <h2>Akses Booking ditolak.</h2>

                    <p>
                        Booking ini milik company
                        <strong>${booking.company}</strong>.
                    </p>

                    <br>

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }

        }

        // =================================================
        // Batch ACTIVE berdasarkan company user
        // =================================================

        const activeBatch =
            batchService.getActiveBatch(company);

        return res.render("batch", {

            activeBatch,

            booking,

            company,

            currentPage: "batch"

        });

    } catch (error) {

        console.error(
            "BATCH INDEX ERROR:",
            error
        );

        return res.status(500).send(
            "Terjadi kesalahan saat membuka Batch."
        );

    }

};


// =====================================================
// IMPORT EXCEL
// =====================================================

exports.importExcel = (req, res) => {

    try {

        // =================================================
        // Cek file
        // =================================================

        if (!req.file) {

            return res.send(
                "File belum dipilih"
            );

        }


        // =================================================
        // Company selalu berasal dari session
        // =================================================

        const company = getCompany(req);

        if (!isValidCompany(company)) {

            return res.status(400).send(
                "Company tidak valid."
            );

        }


        let booking = null;


        // =================================================
        // Jika import berasal dari Booking Kalender
        // =================================================

        if (req.body.booking_id) {

            booking =
                calendarService.getBookingById(
                    req.body.booking_id
                );


            // =================================================
            // Booking tidak ditemukan
            // =================================================

            if (!booking) {

                return res.status(404).send(`
                    <h2>Booking Kalender tidak ditemukan.</h2>

                    <br>

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }


            // =================================================
            // SECURITY:
            // Booking HARUS milik company user
            // =================================================

            if (
                String(booking.company || "")
                    .trim()
                    .toUpperCase() !== company
            ) {

                return res.status(403).send(`
                    <h2>Akses Booking ditolak.</h2>

                    <p>
                        Booking ini milik company
                        <strong>${booking.company}</strong>.
                    </p>

                    <p>
                        Anda tidak memiliki akses
                        untuk menggunakan Booking tersebut.
                    </p>

                    <br>

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }


            // =================================================
            // Booking dibatalkan
            // =================================================

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


            // =================================================
            // BOOKING SUDAH MEMILIKI BATCH
            // =================================================

            if (booking.batch_id) {

                // =============================================
                // Batch sudah selesai
                // =============================================

                if (
                    booking.batch_status === "FINISHED"
                ) {

                    return res.status(400).send(`
                        <h2>Booking sudah selesai.</h2>

                        <p>
                            Booking #${booking.id}
                            sudah memiliki Batch
                            <strong>${booking.batch_code || ""}</strong>
                            yang telah ditutup.
                        </p>

                        <p>
                            Booking yang sudah selesai
                            tidak dapat digunakan untuk import ulang.
                        </p>

                        <br>

                        <a href="/batch/${booking.batch_id}">
                            Lihat Batch
                        </a>

                        &nbsp;

                        <a href="/kalender">
                            Kembali ke Kalender
                        </a>
                    `);

                }


                // =============================================
                // Batch masih ACTIVE
                // =============================================

                return res.status(400).send(`
                    <h2>Booking sudah memiliki Batch.</h2>

                    <p>
                        Booking #${booking.id}
                        sudah digunakan untuk membuat Batch
                        <strong>${booking.batch_code || ""}</strong>.
                    </p>

                    <p>
                        Booking tersebut tidak dapat digunakan
                        untuk membuat Batch atau import ulang.
                    </p>

                    <br>

                    <a href="/batch/${booking.batch_id}">
                        Lihat Batch
                    </a>

                    &nbsp;

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }

        }


        // =================================================
        // Batch ACTIVE
        // =================================================

        const activeBatch =
            batchService.getActiveBatch(company);


        // =================================================
        // Baca Excel
        // =================================================

        const data =
            excelService.readExcel(
                req.file.path
            );


        // =================================================
        // Validasi Header
        // =================================================

        const validation =
            excelService.validateHeader(
                data
            );


        if (!validation.valid) {

            return res.send(
                validation.message
            );

        }


        // =================================================
        // Mapping Data
        // =================================================

        const mappedData =
            excelService.mapData(
                data
            );


        // =================================================
        // Set Company
        // SECURITY:
        // Tidak mengambil company dari Excel
        // =================================================

        mappedData.forEach(item => {

            item.company =
                company;

        });


        // =================================================
        // Validasi Isi Data
        // =================================================

        const errors =
            excelService.validateData(
                mappedData
            );


        if (errors.length > 0) {

            return res.send(
                errors.join("<br>")
            );

        }


        // =================================================
        // IMPORT KE BATCH ACTIVE
        // =================================================

        if (
            req.body.importType === "append"
        ) {

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


            // =============================================
            // Pastikan batch active juga milik company
            // =============================================

            if (
                String(activeBatch.company || "")
                    .trim()
                    .toUpperCase() !== company
            ) {

                return res.status(403).send(
                    "Akses Batch ditolak."
                );

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


            // =============================================
            // Activity Log
            // =============================================

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


        // =================================================
        // IMPORT BATCH BARU
        // =================================================

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


        // =================================================
        // Generate Batch Code
        // =================================================

        const dayjs =
            require("dayjs");

        require("dayjs/locale/id");

        dayjs.locale("id");


        const batchCode =
            batchService.generateBatchCode(
                company
            );


        // =================================================
        // BOOKING RELATION
        // =================================================

        let matchedBooking = null;


        // =================================================
        // IMPORT DARI CALENDAR
        // =================================================

        if (booking) {

            matchedBooking =
                booking;

            console.log(
                "================================"
            );

            console.log(
                "IMPORT DARI CALENDAR"
            );

            console.log(
                "Booking ID :",
                booking.id
            );

            console.log(
                "Company    :",
                booking.company
            );

            console.log(
                "Tanggal    :",
                booking.booking_date
            );

            console.log(
                "================================"
            );

        } else {

            // =================================================
            // IMPORT BIASA DARI BATCH MANAGEMENT
            // Mekanisme matching lama tetap dipertahankan
            // =================================================

            let bookingDate = null;

            const rawBookingDate =
                mappedData[0]?.tanggal_masuk;


            if (rawBookingDate) {

                if (
                    typeof rawBookingDate ===
                    "number"
                ) {

                    const excelDate =
                        new Date(
                            (rawBookingDate - 25569) *
                            86400 *
                            1000
                        );

                    bookingDate =
                        dayjs(
                            excelDate
                        ).format(
                            "YYYY-MM-DD"
                        );

                } else {

                    bookingDate =
                        dayjs(
                            rawBookingDate
                        ).format(
                            "YYYY-MM-DD"
                        );

                }

            }


            if (bookingDate) {

                const candidates =
                    calendarService.findMatchingBooking(
                        company,
                        bookingDate,
                        mappedData.length
                    );


                if (
                    candidates.length === 1
                ) {

                    matchedBooking =
                        candidates[0];

                }

            }

        }


        // =================================================
        // SIMPAN EXCEL KE BOOKING
        // Hanya jika import berasal dari Calendar
        // =================================================

        if (booking) {

            const attachResult =
                calendarService.attachExcelToBooking(
                    booking.id,
                    {

                        excel_path:
                            req.file.path,

                        excel_original_name:
                            req.file.originalname

                    }
                );


            if (!attachResult.success) {

                return res.status(400).send(`
                    <h2>Gagal menyimpan Excel ke Booking.</h2>

                    <p>
                        ${
                            attachResult.message ||
                            "File Excel tidak dapat disimpan ke Booking."
                        }
                    </p>

                    <br>

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }


            // =============================================
            // Ambil booking terbaru
            // =============================================

            booking =
                calendarService.getBookingById(
                    booking.id
                );

        }


        // =================================================
        // SIMPAN BATCH
        // =================================================

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
                    ),

                booking_id:
                    matchedBooking
                        ? matchedBooking.id
                        : null

            });


        // =================================================
        // Tambahkan batch_id
        // =================================================

        mappedData.forEach(item => {

            item.batch_id =
                batchId;

            item.status =
                "PENDING";

            item.reject_reason =
                "";

        });


        // =================================================
        // DEBUG
        // =================================================

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
            matchedBooking
                ? matchedBooking.id
                : "-"
        );

        console.log(
            "Batch ID          :",
            batchId
        );

        console.log(
            "Batch Code        :",
            batchCode
        );

        console.log(
            "================================"
        );


        // =================================================
        // Simpan Inventaris
        // =================================================

        inventoryService.insertInventaris(
            mappedData
        );


        console.table(
            mappedData
        );


        // =================================================
        // ACTIVITY LOG
        // =================================================

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


        // =================================================
        // Response
        // =================================================

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


// =====================================================
// BUAT BATCH DARI BOOKING KALENDER
// =====================================================

exports.runBooking = (req, res) => {

    try {

        const bookingId =
            req.body.booking_id ||
            req.query.booking_id;


        if (!bookingId) {

            return res.status(400).send(`
                <h2>Booking ID tidak ditemukan.</h2>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // Ambil Booking
        // =================================================

        const booking =
            calendarService.getBookingById(
                bookingId
            );


        if (!booking) {

            return res.status(404).send(`
                <h2>Booking Kalender tidak ditemukan.</h2>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // Company user
        // =================================================

        const company =
            getCompany(req);


        if (!isValidCompany(company)) {

            return res.status(400).send(`
                <h2>Company tidak valid.</h2>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // SECURITY:
        // Booking harus milik company user
        // =================================================

        if (
            String(booking.company || "")
                .trim()
                .toUpperCase() !== company
        ) {

            return res.status(403).send(`
                <h2>Akses Booking ditolak.</h2>

                <p>
                    Booking ini milik company
                    <strong>${booking.company}</strong>.
                </p>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // Booking Cancelled
        // =================================================

        if (
            booking.status === "CANCELLED"
        ) {

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


        // =================================================
        // BOOKING SUDAH MEMILIKI BATCH
        // =================================================

        if (booking.batch_id) {

            if (
                booking.batch_status === "FINISHED"
            ) {

                return res.status(400).send(`
                    <h2>Booking sudah selesai.</h2>

                    <p>
                        Booking #${booking.id}
                        sudah selesai karena Batch
                        <strong>${booking.batch_code}</strong>
                        telah ditutup.
                    </p>

                    <br>

                    <a href="/batch/${booking.batch_id}">
                        Lihat Batch
                    </a>

                    &nbsp;

                    <a href="/kalender">
                        Kembali ke Kalender
                    </a>
                `);

            }


            return res.redirect(
                `/batch/${booking.batch_id}`
            );

        }


        // =================================================
        // Excel wajib tersedia
        // =================================================

        if (!booking.excel_path) {

            return res.redirect(
                `/batch?booking_id=${booking.id}`
            );

        }


        // =================================================
        // Cek Batch ACTIVE
        // =================================================

        const activeBatch =
            batchService.getActiveBatch(
                company
            );


        if (activeBatch) {

            return res.status(400).send(`
                <h2>Masih ada Batch ACTIVE.</h2>

                <p>
                    Batch
                    <strong>${activeBatch.batch_code}</strong>
                    masih aktif untuk company ${company}.
                </p>

                <p>
                    Silakan tutup Batch tersebut terlebih dahulu.
                </p>

                <br>

                <a href="/batch/${activeBatch.id}">
                    Lihat Batch
                </a>
            `);

        }


        // =================================================
        // Baca Excel dari Booking
        // =================================================

        const data =
            excelService.readExcel(
                booking.excel_path
            );


        // =================================================
        // Validasi Header
        // =================================================

        const validation =
            excelService.validateHeader(
                data
            );


        if (!validation.valid) {

            return res.status(400).send(`
                <h2>Format Excel tidak valid.</h2>

                <p>
                    ${validation.message}
                </p>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // Mapping Data
        // =================================================

        const mappedData =
            excelService.mapData(
                data
            );


        // =================================================
        // LIMIT MAKSIMAL 50 ASET
        // =================================================

        if (
            mappedData.length > 50
        ) {

            return res.status(400).send(`
                <h2>Jumlah aset melebihi batas.</h2>

                <p>
                    Excel berisi
                    <strong>${mappedData.length} aset</strong>.
                </p>

                <p>
                    Maksimal aset dalam 1 booking adalah
                    <strong>50 aset</strong>.
                </p>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // Set Company
        // =================================================

        mappedData.forEach(item => {

            item.company =
                company;

        });


        // =================================================
        // Validasi Isi Data
        // =================================================

        const errors =
            excelService.validateData(
                mappedData
            );


        if (errors.length > 0) {

            return res.status(400).send(`
                <h2>Data Excel tidak valid.</h2>

                <p>
                    ${errors.join("<br>")}
                </p>

                <br>

                <a href="/kalender">
                    Kembali ke Kalender
                </a>
            `);

        }


        // =================================================
        // Generate Batch Code
        // =================================================

        const batchCode =
            batchService.generateBatchCode(
                company
            );


        // =================================================
        // Generate Batch Name
        // =================================================

        const batchName =
            booking.excel_original_name
                ? path.parse(
                    booking.excel_original_name
                ).name
                : `Booking ${booking.id}`;


        // =================================================
        // Buat Batch
        // =================================================

        const dayjs =
            require("dayjs");

        require("dayjs/locale/id");

        dayjs.locale("id");


        const batchId =
            batchService.createBatch({

                batch_code:
                    batchCode,

                batch_name:
                    batchName,

                source_file:
                    booking.excel_original_name ||
                    "Booking Excel",

                company,

                total_item:
                    mappedData.length,

                created_at:
                    dayjs().format(
                        "YYYY-MM-DD HH:mm:ss"
                    ),

                booking_id:
                    booking.id

            });


        // =================================================
        // Hubungkan Inventaris ke Batch
        // =================================================

        mappedData.forEach(item => {

            item.batch_id =
                batchId;

            item.status =
                "PENDING";

            item.reject_reason =
                "";

        });


        // =================================================
        // Simpan Inventaris
        // =================================================

        inventoryService.insertInventaris(
            mappedData
        );


        // =================================================
        // Activity Log
        // =================================================

        try {

            activityService.createActivity({

                company,

                type:
                    "BATCH_CREATED",

                title:
                    "Batch Booking Dibuat",

                message:
                    `Batch ${batchCode} berhasil dibuat ` +
                    `dari Booking #${booking.id} ` +
                    `dengan ${mappedData.length} data inventaris.`,

                reference_id:
                    batchId

            });

        } catch (activityError) {

            console.error(
                "⚠️ Gagal membuat activity log batch booking:",
                activityError
            );

        }


        // =================================================
        // Response
        // =================================================

        return res.redirect(
            `/batch/${batchId}`
        );


    } catch (err) {

        console.error(
            "RUN BOOKING ERROR:",
            err
        );


        return res.status(500).send(`
            <h2>Terjadi kesalahan saat membuat Batch.</h2>

            <p>
                ${err.message}
            </p>

            <br>

            <a href="/kalender">
                Kembali ke Kalender
            </a>
        `);

    }

};


// =====================================================
// TUTUP BATCH
// =====================================================

exports.closeBatch = (req, res) => {

    try {

        const company =
            getCompany(req);


        if (!isValidCompany(company)) {

            return res.status(400).json({

                success: false,

                message:
                    "Company tidak valid."

            });

        }


        // =================================================
        // Cek apakah batch boleh ditutup
        // =================================================

        const result =
            batchService.canCloseBatch(
                company
            );


        if (!result.canClose) {

            return res.status(400).json({

                success: false,

                message:
                    `Masih ada ${result.pending} inventaris yang berstatus PENDING.`

            });

        }


        // =================================================
        // Ambil Batch Aktif sebelum ditutup
        // =================================================

        const activeBatch =
            batchService.getActiveBatch(
                company
            );


        // =================================================
        // Tutup Batch
        // =================================================

        batchService.closeBatch(
            company
        );


        // =================================================
        // Activity Log
        // =================================================

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


// =====================================================
// DETAIL BATCH
// =====================================================

exports.detail = (req, res) => {

    try {

        const company =
            getCompany(req);


        if (!isValidCompany(company)) {

            return res.status(400).send(
                "Company tidak valid."
            );

        }


        const batch =
            batchService.getBatchById(
                req.params.id
            );


        // =================================================
        // Batch tidak ditemukan
        // =================================================

        if (!batch) {

            return res.status(404).send(
                "Batch tidak ditemukan."
            );

        }


        // =================================================
        // SECURITY:
        // Batch harus milik company user
        // =================================================

        if (
            String(batch.company || "")
                .trim()
                .toUpperCase() !== company
        ) {

            return res.status(403).send(`
                <h2>Akses Batch ditolak.</h2>

                <p>
                    Batch ini bukan milik company
                    <strong>${company}</strong>.
                </p>

                <br>

                <a href="/batch">
                    Kembali ke Batch
                </a>
            `);

        }


        // =================================================
        // Filter
        // =================================================

        const keyword =
            req.query.keyword || "";

        const status =
            req.query.status || "";

        const jenis =
            req.query.jenis || "";


        // =================================================
        // Ambil Inventaris
        // =================================================

        const items =
            inventoryService.searchInventaris(

                batch.id,

                keyword,

                status,

                jenis

            );


        // =================================================
        // Render
        // =================================================

        return res.render("inventaris", {

            batch,

            items,

            keyword,

            status,

            jenis,

            isHistory: true,

            currentPage:
                "batch-history",

            handoverLocked:
                false

        });


    } catch (error) {

        console.error(
            "BATCH DETAIL ERROR:",
            error
        );


        return res.status(500).send(
            "Terjadi kesalahan saat membuka Batch."
        );

    }

};


// =====================================================
// RIWAYAT BATCH
// =====================================================

exports.history = (req, res) => {

    try {

        const company =
            getCompany(req);


        if (!isValidCompany(company)) {

            return res.status(400).send(
                "Company tidak valid."
            );

        }


        const activeBatch =
            batchService.getActiveBatch(
                company
            );


        let history =
            batchService.getHistory(
                company
            );


        // =================================================
        // IT → GA STATUS
        // =================================================

        history =
            history.map((batch) => {

                const handovers =
                    handoverService.getByBatch(
                        batch.id
                    );


                const itToGa =
                    handovers.find(
                        (item) =>
                            item.direction ===
                            "IT_TO_GA"
                    ) || null;


                let itToGaState =
                    "NOT_CREATED";


                if (itToGa) {

                    if (
                        itToGa.status ===
                        "APPROVED"
                    ) {

                        itToGaState =
                            "APPROVED";

                    } else {

                        itToGaState =
                            "PENDING";

                    }

                }


                return {

                    ...batch,

                    it_to_ga:
                        itToGa,

                    it_to_ga_state:
                        itToGaState

                };

            });


        return res.render(
            "history",
            {

                activeBatch,

                history,

                company,

                currentPage:
                    "history"

            }
        );


    } catch (error) {

        console.error(
            "BATCH HISTORY ERROR:",
            error
        );


        return res.status(500).send(
            "Terjadi kesalahan saat membuka Riwayat Batch."
        );

    }

};


// =====================================================
// HAPUS BATCH ACTIVE
// =====================================================

exports.deleteBatch = (req, res) => {

    try {

        const company =
            getCompany(req);


        const batchId =
            Number(
                req.body.batch_id ||
                req.query.batch_id
            );


        if (!isValidCompany(company)) {

            return res.status(400).json({

                success: false,

                message:
                    "Company tidak valid."

            });

        }


        if (!batchId) {

            return res.status(400).json({

                success: false,

                message:
                    "Batch ID tidak valid."

            });

        }


        // =================================================
        // Ambil Batch
        // =================================================

        const batch =
            batchService.getBatchById(
                batchId
            );


        if (!batch) {

            return res.status(404).json({

                success: false,

                message:
                    "Batch tidak ditemukan."

            });

        }


        // =================================================
        // SECURITY:
        // Batch harus milik company user
        // =================================================

        if (
            String(batch.company || "")
                .trim()
                .toUpperCase() !== company
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Batch bukan milik company aktif."

            });

        }


        // =================================================
        // Hanya ACTIVE
        // =================================================

        if (
            batch.status !== "ACTIVE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Batch yang dapat dihapus hanya Batch ACTIVE."

            });

        }


        // =================================================
        // Ambil Booking + lokasi Excel
        // =================================================

        const db =
            require("../config/database");


        const booking =
            batch.booking_id

                ? db.prepare(`
                    SELECT
                        id,
                        excel_path,
                        excel_original_name
                    FROM calendar_booking
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    batch.booking_id
                )

                : null;


        // =================================================
        // Hapus Batch
        // =================================================

        const result =
            batchService.deleteBatch(
                batchId,
                company
            );


        if (!result.success) {

            return res.status(400).json(
                result
            );

        }


        // =================================================
        // Hapus file Excel fisik
        // =================================================

        if (
            booking &&
            booking.excel_path
        ) {

            try {

                const fs =
                    require("fs");


                if (
                    fs.existsSync(
                        booking.excel_path
                    )
                ) {

                    fs.unlinkSync(
                        booking.excel_path
                    );

                }

            } catch (fileError) {

                console.warn(
                    "Gagal menghapus file Excel:",
                    fileError.message
                );

            }

        }


        // =================================================
        // Response
        // =================================================

        return res.json({

            success: true,

            message:
                "Batch berhasil dihapus. Booking tetap dipertahankan dan dapat diproses kembali."

        });


    } catch (error) {

        console.error(
            "DELETE BATCH ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Terjadi kesalahan saat menghapus Batch."

        });

    }

};