const fs = require("fs");
const path = require("path");

const {
    PDFDocument,
    StandardFonts,
    rgb
} = require("pdf-lib");


// =====================================================
// UKURAN LABEL
// 60 × 40 MM
// =====================================================

const MM_TO_PT = 72 / 25.4;

const LABEL_WIDTH = 60 * MM_TO_PT;
const LABEL_HEIGHT = 40 * MM_TO_PT;


// =====================================================
// PATH
// =====================================================

const OUTPUT_DIR = path.join(
    process.cwd(),
    "uploads",
    "labels"
);

const LOGO_PATH = path.join(
    process.cwd(),
    "public",
    "images",
    "logobarcodee.png"
);


// =====================================================
// HELPER
// =====================================================

function ensureOutputDir() {

    if (!fs.existsSync(OUTPUT_DIR)) {

        fs.mkdirSync(
            OUTPUT_DIR,
            {
                recursive: true
            }
        );

    }

}


function safeText(value, fallback = "-") {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return fallback;

    }

    return String(value).trim();

}


function truncateText(
    value,
    font,
    size,
    maxWidth
) {

    value = safeText(value);

    if (
        font.widthOfTextAtSize(
            value,
            size
        ) <= maxWidth
    ) {

        return value;

    }

    let result = value;

    while (
        result.length > 0 &&
        font.widthOfTextAtSize(
            result + "...",
            size
        ) > maxWidth
    ) {

        result =
            result.substring(
                0,
                result.length - 1
            );

    }

    return result + "...";

}


function formatQcDate(value) {

    if (!value) {

        return "-";

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return (
        String(
            date.getDate()
        ).padStart(2, "0") +

        " " +

        months[
            date.getMonth()
        ] +

        " " +

        date.getFullYear()
    );

}


// =====================================================
// GENERATE LABEL
// =====================================================

exports.generateLabel = async (item) => {

    ensureOutputDir();


    // =================================================
    // PDF
    // =================================================

    const pdfDoc =
        await PDFDocument.create();

    const page =
        pdfDoc.addPage([
            LABEL_WIDTH,
            LABEL_HEIGHT
        ]);


    // =================================================
    // FONT
    // =================================================

    const fontRegular =
        await pdfDoc.embedFont(
            StandardFonts.Helvetica
        );

    const fontBold =
        await pdfDoc.embedFont(
            StandardFonts.HelveticaBold
        );

    const black =
        rgb(
            0,
            0,
            0
        );


    // =================================================
    // BORDER
    // =================================================

    page.drawRectangle({

        x: 4,

        y: 4,

        width:
            LABEL_WIDTH - 8,

        height:
            LABEL_HEIGHT - 8,

        borderColor:
            black,

        borderWidth:
            1.1

    });


    // =================================================
    // LOGO
    // =================================================

    if (
        fs.existsSync(
            LOGO_PATH
        )
    ) {

        try {

            const logoBytes =
                fs.readFileSync(
                    LOGO_PATH
                );

            const logoImage =
                await pdfDoc.embedPng(
                    logoBytes
                );

            const originalWidth =
                logoImage.width;

            const originalHeight =
                logoImage.height;


            // Area maksimum logo
            const maxWidth = 58;

            const maxHeight = 25;


            // Pertahankan aspect ratio
            const scale =
                Math.min(
                    maxWidth / originalWidth,
                    maxHeight / originalHeight
                );

            const logoWidth =
                originalWidth * scale;

            const logoHeight =
                originalHeight * scale;

            const logoX =
                7 +
                (
                    maxWidth -
                    logoWidth
                ) / 2;

            const logoY =
                LABEL_HEIGHT -
                28 +
                (
                    maxHeight -
                    logoHeight
                ) / 2;

            page.drawImage(
                logoImage,
                {
                    x: logoX,

                    y: logoY,

                    width: logoWidth,

                    height: logoHeight
                }
            );

        }

        catch (logoError) {

            console.error(
                "⚠️ Gagal embed logo:",
                logoError
            );

        }

    }

    else {

        console.warn(
            "⚠️ Logo tidak ditemukan:",
            LOGO_PATH
        );

    }


    // =================================================
    // HEADER TITLE
    // =================================================

    const jenis =
        String(
            item.jenis || "Laptop"
        )
        .trim()
        .toLowerCase();

    let title =
        "INVENTARIS LAPTOP";

    if (
        jenis === "handphone"
    ) {

        title =
            "INVENTARIS HP";

    }

    else if (
        jenis === "tablet"
    ) {

        title =
            "INVENTARIS TABLET";

    }

    else if (
        jenis === "pc all in one" ||
        jenis === "pc"
    ) {

        title =
            "INVENTARIS PC";

    }


    // =================================================
    // JUDUL
    // FONT DIBESARKAN
    // =================================================

    page.drawText(
        title,
        {
            x: 75,

            y:
                LABEL_HEIGHT - 15,

            size: 8.3,

            font:
                fontBold,

            color:
                black
        }
    );


    page.drawText(
        "IT SUPPORT",
        {
            x: 75,

            y:
                LABEL_HEIGHT - 22,

            size: 5.3,

            font:
                fontBold,

            color:
                black
        }
    );


    // =================================================
    // DATA DEVICE
    // =================================================

    const labelX = 10;

    const colonX = 58;

    const valueX = 64;

    const valueMaxWidth =
        LABEL_WIDTH -
        valueX -
        10;


    // Konten dinaikkan sedikit
    // setelah footer dihapus
    const startY =
        LABEL_HEIGHT - 32;

    const rowGap =
        8.2;


    // =================================================
    // FONT DATA BESAR
    // =================================================

    const valueSize =
        6.8;


    const rows = [

        [
            "SN",
            item.imei
        ],

        [
            "BRAND",
            item.merk
        ],

        [
            "MODEL",
            item.type
        ],

        [
            "RAM",
            item.ram
        ],

        [
            "SSD",
            item.ssd
        ],

        [
            "BH",
            item.bh
        ],

        [
            "SSD HEALTH",
            item.ssd_health
        ]

    ];


    rows.forEach(
        ([label, value], index) => {

            const y =
                startY -
                (
                    index *
                    rowGap
                );


            // =================================================
            // LABEL
            // =================================================

            page.drawText(
                label,
                {
                    x: labelX,

                    y,

                    size: 6.7,

                    font:
                        fontBold,

                    color:
                        black
                }
            );


            // =================================================
            // COLON
            // =================================================

            page.drawText(
                ":",
                {
                    x: colonX,

                    y,

                    size: 6.1,

                    font:
                        fontRegular,

                    color:
                        black
                }
            );


            // =================================================
            // VALUE
            // =================================================

            const displayValue =
                truncateText(
                    value,
                    fontRegular,
                    valueSize,
                    valueMaxWidth
                );

            page.drawText(
                displayValue,
                {
                    x: valueX,

                    y,

                    size:
                        valueSize,

                    font:
                        fontRegular,

                    color:
                        black
                }
            );

        }
    );


    // =================================================
    // QC INFORMATION
    // =================================================

    const qcY = 21;


    // =================================================
    // GARIS ATAS QC
    // =================================================

    page.drawLine({

        start: {
            x: 10,
            y: 29
        },

        end: {
            x: LABEL_WIDTH - 10,
            y: 29
        },

        thickness: 0.7,

        color:
            black

    });


    // =================================================
    // NAMA QC
    // =================================================

    page.drawText(
        "NAMA QC",
        {
            x: 10,

            y: qcY,

            size: 6.1,

            font:
                fontBold,

            color:
                black
        }
    );


    page.drawText(
        ":",
        {
            x: 48,

            y: qcY,

            size: 5.8,

            font:
                fontRegular,

            color:
                black
        }
    );


    page.drawText(
        truncateText(
            item.qc_name,
            fontRegular,
            5.9,
            48
        ),
        {
            x: 54,

            y: qcY,

            size: 5.9,

            font:
                fontRegular,

            color:
                black
        }
    );


    // =================================================
    // TANGGAL QC
    // =================================================

    page.drawText(
        "TGL QC",
        {
            // Digeser ke kiri
            // supaya tidak dempet border kanan
            x: 96,

            y: qcY,

            size: 5.9,

            font:
                fontBold,

            color:
                black
        }
    );


    page.drawText(
        ":",
        {
            x: 117,

            y: qcY,

            size: 5.8,

            font:
                fontRegular,

            color:
                black
        }
    );


    page.drawText(
        formatQcDate(
            item.last_qc
        ),
        {
            x: 123,

            y: qcY,

            size: 5.9,

            font:
                fontRegular,

            color:
                black
        }
    );


    // =================================================
    // FOOTER DIHAPUS
    // =================================================
    //
    // Tidak ada footer:
    //
    // "BARANG INI MILIK PUSAT GADAI INDONESIA"
    //
    // =================================================


    // =================================================
    // SAVE PDF
    // =================================================

    const fileName =
        `label_${item.id}_${Date.now()}.pdf`;

    const filePath =
        path.join(
            OUTPUT_DIR,
            fileName
        );

    const pdfBytes =
        await pdfDoc.save();

    fs.writeFileSync(
        filePath,
        pdfBytes
    );

    console.log(
        "✅ LABEL PDF BERHASIL:",
        filePath
    );

    return {

        filePath,

        relativePath:
            `/uploads/labels/${fileName}`

    };

};