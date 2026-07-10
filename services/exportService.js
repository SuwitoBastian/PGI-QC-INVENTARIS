const ExcelJS = require("exceljs");
const db = require("../config/database");

// ======================================================
// HEADER LAPORAN
// ======================================================

function createReportHeader(
    sheet,
    batch,
    company,
    jenis,
    items
){

    const done = items.filter(x => x.status === "DONE").length;
    const pending = items.filter(x => x.status === "PENDING").length;
    const reject = items.filter(x => x.status === "REJECT").length;

    // Judul
    sheet.mergeCells("A1:L1");
    sheet.getCell("A1").value =
        "LAPORAN HASIL QC INVENTARIS IT SUPPORT";

    sheet.mergeCells("A2:L2");
    sheet.getCell("A2").value =
    company === "PGI"
        ? "PUSAT GADAI INDONESIA"
        : "PUSAT EMAS INDONESIA";

    // Informasi
    sheet.getCell("A4").value = "Batch";
    sheet.getCell("B4").value = batch.batch_name;

    sheet.getCell("A5").value = "Tanggal Export";
    sheet.getCell("B5").value =
        new Date().toLocaleString("id-ID",{
            timeZone:"Asia/Jakarta"
        }) + " WIB";

    sheet.getCell("A6").value = "Jenis Inventaris";
    sheet.getCell("B6").value = jenis;

    sheet.getCell("A7").value = "Total Data";
    sheet.getCell("B7").value = items.length;

    sheet.getCell("D4").value = "Done";
    sheet.getCell("E4").value = done;

    sheet.getCell("D5").value = "Pending";
    sheet.getCell("E5").value = pending;

    sheet.getCell("D6").value = "Reject";
    sheet.getCell("E6").value = reject;

}
// ======================================================
// STYLE HEADER LAPORAN
// ======================================================

function styleReportHeader(sheet){

    sheet.getCell("A1").font = {

        bold:true,
        size:16

    };

    sheet.getCell("A2").font = {

        bold:true,
        size:13

    };

    sheet.getCell("A1").alignment = {

        horizontal:"center"

    };

    sheet.getCell("A2").alignment = {

        horizontal:"center"

    };

}
// ======================================================
// HEADER TABEL
// ======================================================

function createTableHeader(sheet){

    const row = sheet.getRow(9);

    row.values = [

        "No",

        "Tanggal Masuk",

        "Tanggal Selesai",

        "Jenis",

        "Merk",

        "Merk & Type",

        "Nomor Faktur",

        "Processor / Gen",

        "RAM",

        "IMEI",

        "Status QC",

        "Alasan Reject"

    ];

}
// ======================================================
// STYLE HEADER TABEL
// ======================================================

function styleTableHeader(sheet){

    const row = sheet.getRow(9);

    row.height = 22;

    row.eachCell(cell=>{

        cell.font={

            bold:true,

            color:{
                argb:"FF000000"
            }

        };

        cell.fill={

            type:"pattern",

            pattern:"solid",

            fgColor:{
                argb:"FF0D6EFD"
            }

        };

        cell.alignment={

            horizontal:"center",

            vertical:"middle"

        };

        cell.border={

            top:{style:"thin"},

            left:{style:"thin"},

            right:{style:"thin"},

            bottom:{style:"thin"}

        };

    });

}
// ======================================================
// ISI DATA
// ======================================================

function fillData(sheet, items){

    let rowNumber = 10;

    items.forEach(item => {

        const row = sheet.getRow(rowNumber);

        row.values = [

            item.no || "",

            item.tanggal_masuk || "-",

            item.last_qc || "-",

            item.jenis || "-",

            item.merk || "-",

            item.type || "-",

            item.nf || "-",

            item.gen || "-",

            item.ram || "-",

            item.imei || "-",

            item.status || "-",

            item.reject_reason || "-"

        ];

        row.eachCell(cell => {

            cell.border = {

                top:{style:"thin"},
                left:{style:"thin"},
                right:{style:"thin"},
                bottom:{style:"thin"}

            };

            cell.alignment = {

                vertical:"middle"

            };

        });

        // Kolom yang dirata tengah
        [1,2,3,4,8,9,10,11].forEach(col => {

            row.getCell(col).alignment = {

                horizontal:"center",
                vertical:"middle"

            };

        });

        // Highlight REJECT
        if(item.status === "REJECT"){

            row.eachCell(cell => {

                cell.fill = {

                    type:"pattern",
                    pattern:"solid",

                    fgColor:{
                        argb:"FFFF0000"
                    }

                };

                cell.font = {

                    color:{
                        argb:"FFFFFFFF"
                    }

                };

            });

        }

        rowNumber++;

    });

}
// ======================================================
// AUTO WIDTH
// ======================================================

function autoWidth(sheet){

    sheet.getColumn(1).width = 6;   // No

    sheet.getColumn(2).width = 18;  // Tanggal Masuk

    sheet.getColumn(3).width = 18;  // Tanggal Selesai

    sheet.getColumn(4).width = 15;  // Jenis

    sheet.getColumn(5).width = 18;  // Merk

    sheet.getColumn(6).width = 35;  // Merk & Type

    sheet.getColumn(7).width = 22;  // Nomor Faktur

    sheet.getColumn(8).width = 18;  // Processor / Gen

    sheet.getColumn(9).width = 12;  // RAM

    sheet.getColumn(10).width = 22; // IMEI

    sheet.getColumn(11).width = 14; // Status

    sheet.getColumn(12).width = 35; // Alasan Reject

}
// ======================================================
// AUTO FILTER
// ======================================================

function autoFilter(sheet){

    sheet.autoFilter = {

        from:"A9",

        to:"L9"

    };

}
// ======================================================
// EXPORT EXCEL
// ======================================================

exports.exportExcel = async (company, res) => {

    // ===============================
    // Ambil Batch Aktif
    // ===============================

    const batch = db.prepare(`
        SELECT *
        FROM batch
        WHERE company = ?
        AND status='ACTIVE'
        LIMIT 1
    `).get(company);

    if(!batch){

        throw new Error("Batch aktif tidak ditemukan.");

    }

    // ===============================
    // Ambil Data Inventaris
    // ===============================

    const items = db.prepare(`
        SELECT *
        FROM inventaris
        WHERE batch_id = ?
        ORDER BY no ASC
    `).all(batch.id);

    // ===============================
    // Pisahkan Laptop & Handphone
    // ===============================

    const laptops = items.filter(item =>
        (item.jenis || "").toLowerCase() === "laptop"
    );

    const handphones = items.filter(item =>
        (item.jenis || "").toLowerCase() === "handphone"
    );

    // ===============================
    // Workbook
    // ===============================

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Monitoring QC Inventaris";

    workbook.created = new Date();

    workbook.modified = new Date();

    workbook.company =
    company === "PGI"
        ? "Pusat Gadai Indonesia"
        : "Pusat Emas Indonesia";

    workbook.subject = "Laporan Hasil QC Inventaris";

    workbook.title = "QC Inventaris";

    workbook.category = "QC";
    // ===============================
    // SHEET LAPTOP
    // ===============================

    const sheetLaptop =
    workbook.addWorksheet("Laptop");

        createReportHeader(
            sheetLaptop,
            batch,
            company,
            "Laptop",
            laptops
        );

        styleReportHeader(sheetLaptop);

        createTableHeader(sheetLaptop);

        styleTableHeader(sheetLaptop);

        fillData(
            sheetLaptop,
            laptops
        );

        autoWidth(sheetLaptop);

        autoFilter(sheetLaptop);
    // ===============================
    // SHEET HANDPHONE
    // ===============================

    const sheetHandphone =
        workbook.addWorksheet("Handphone");

            createReportHeader(
            sheetHandphone,
            batch,
            company,
            "Handphone",
            handphones
        );

        styleReportHeader(sheetHandphone);

        createTableHeader(sheetHandphone);

        styleTableHeader(sheetHandphone);

        fillData(
            sheetHandphone,
            handphones
        );

        autoWidth(sheetHandphone);

        autoFilter(sheetHandphone);
        // ===============================
    // Nama File
    // ===============================

    const fileName =
    `QC_INV_${company}_${batch.batch_name.replace(/\s+/g,"_")}.xlsx`;

    // ===============================
    // Response Header
    // ===============================

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
    );

    // ===============================
    // Download
    // ===============================

    await workbook.xlsx.write(res);

    res.end();

};
exports.exportBatch = async (batchId, res) => {

    // ===============================
    // Ambil Batch
    // ===============================

    const batch = db.prepare(`
        SELECT *
        FROM batch
        WHERE id = ?
    `).get(batchId);

    if (!batch) {

        throw new Error("Batch tidak ditemukan.");

    }

    // ===============================
    // Ambil Inventaris
    // ===============================

    const items = db.prepare(`
        SELECT *
        FROM inventaris
        WHERE batch_id = ?
        ORDER BY no ASC
    `).all(batch.id);

    const laptops = items.filter(item =>
        (item.jenis || "").toLowerCase() === "laptop"
    );

    const handphones = items.filter(item =>
        (item.jenis || "").toLowerCase() === "handphone"
    );

    const workbook = new ExcelJS.Workbook();

    const sheetLaptop =
        workbook.addWorksheet("Laptop");

    createReportHeader(
        sheetLaptop,
        batch,
        batch.company,
        "Laptop",
        laptops
    );

    styleReportHeader(sheetLaptop);
    createTableHeader(sheetLaptop);
    styleTableHeader(sheetLaptop);
    fillData(sheetLaptop, laptops);
    autoWidth(sheetLaptop);
    autoFilter(sheetLaptop);

    const sheetHandphone =
        workbook.addWorksheet("Handphone");

    createReportHeader(
        sheetHandphone,
        batch,
        batch.company,
        "Handphone",
        handphones
    );

    styleReportHeader(sheetHandphone);
    createTableHeader(sheetHandphone);
    styleTableHeader(sheetHandphone);
    fillData(sheetHandphone, handphones);
    autoWidth(sheetHandphone);
    autoFilter(sheetHandphone);

    const fileName =
        `QC_INV_${batch.batch_code}.xlsx`;

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);

    res.end();

};