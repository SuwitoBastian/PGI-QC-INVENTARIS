const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts } = require("pdf-lib");


// ==========================================
// TEMPLATE DIRECTORY
// ==========================================

const TEMPLATE_DIR = path.join(
    process.cwd(),
    "templates"
);


// ==========================================
// OUTPUT DIRECTORY
// ==========================================

const OUTPUT_DIR = path.join(
    process.cwd(),
    "uploads",
    "handover"
);


// ==========================================
// TEMPLATE FILES
// ==========================================

// PGI - GA → IT
const TEMPLATE_GA_TO_IT_PGI = path.join(
    TEMPLATE_DIR,
    "tanda terima ga ke its.pdf"
);

// PEI - GA → IT
const TEMPLATE_GA_TO_IT_PEI = path.join(
    TEMPLATE_DIR,
    "tanda terima ga ke its pei.pdf"
);

// IT → GA
// PGI dan PEI tetap menggunakan template yang sama
const TEMPLATE_IT_TO_GA = path.join(
    TEMPLATE_DIR,
    "tanda terima its ke ga.pdf"
);


// ==========================================
// ENSURE OUTPUT DIRECTORY
// ==========================================

function ensureOutputDirectory() {

    if (!fs.existsSync(OUTPUT_DIR)) {

        fs.mkdirSync(
            OUTPUT_DIR,
            {
                recursive: true
            }
        );

    }

}


// ==========================================
// GET TEMPLATE PATH
// ==========================================

exports.getTemplatePath = (
    direction,
    company = "PGI"
) => {

    const normalizedCompany =
        String(company || "PGI")
            .trim()
            .toUpperCase();


    // ==========================================
    // GA → IT
    // ==========================================

    if (direction === "GA_TO_IT") {

        if (normalizedCompany === "PEI") {

            return TEMPLATE_GA_TO_IT_PEI;

        }

        return TEMPLATE_GA_TO_IT_PGI;

    }


    // ==========================================
    // IT → GA
    // ==========================================

    if (direction === "IT_TO_GA") {

        return TEMPLATE_IT_TO_GA;

    }


    throw new Error(
        `Direction handover tidak valid: ${direction}`
    );

};


// ==========================================
// CHECK TEMPLATE
// ==========================================

exports.checkTemplate = (
    direction,
    company = "PGI"
) => {

    const templatePath =
        exports.getTemplatePath(
            direction,
            company
        );

    return {
        exists:
            fs.existsSync(templatePath),

        path:
            templatePath
    };

};


// ==========================================
// LOAD TEMPLATE PDF
// ==========================================

exports.loadTemplate = async (
    direction,
    company = "PGI"
) => {

    const templatePath =
        exports.getTemplatePath(
            direction,
            company
        );

    if (!fs.existsSync(templatePath)) {

        throw new Error(
            `Template PDF tidak ditemukan: ${templatePath}`
        );

    }

    const pdfBytes =
        fs.readFileSync(templatePath);

    return PDFDocument.load(
        pdfBytes
    );

};


// ==========================================
// GENERATE OUTPUT PATH
// ==========================================

exports.generateOutputPath = (
    direction,
    batchId
) => {

    ensureOutputDirectory();

    const timestamp =
        Date.now();

    const filename =
        `handover_${direction}_batch_${batchId}_${timestamp}.pdf`;

    return path.join(
        OUTPUT_DIR,
        filename
    );

};


// ==========================================
// SAVE PDF
// ==========================================

exports.savePdf = async (
    pdfDoc,
    outputPath
) => {

    ensureOutputDirectory();

    const pdfBytes =
        await pdfDoc.save();

    fs.writeFileSync(
        outputPath,
        pdfBytes
    );

    return outputPath;

};


// ==========================================
// EXPORT CONFIG
// ==========================================

exports.TEMPLATE_DIR =
    TEMPLATE_DIR;

exports.OUTPUT_DIR =
    OUTPUT_DIR;

exports.TEMPLATE_GA_TO_IT =
    TEMPLATE_GA_TO_IT_PGI;

exports.TEMPLATE_GA_TO_IT_PGI =
    TEMPLATE_GA_TO_IT_PGI;

exports.TEMPLATE_GA_TO_IT_PEI =
    TEMPLATE_GA_TO_IT_PEI;

exports.TEMPLATE_IT_TO_GA =
    TEMPLATE_IT_TO_GA;


// ==========================================
// GENERATE PDF GA → IT
// SUPPORT PGI + PEI
// ==========================================

exports.generateGaToIt = ({
    batch,
    handoverId,
    bookingDate,
    senderName,
    senderSignaturePath,
    receiverName,
    receiverSignaturePath,
    summary,
    location
}) => {

    const company =
        String(batch?.company || "PGI")
            .trim()
            .toUpperCase();

    // ==========================================
    // TEMPLATE
    // ==========================================

    let templatePath;

    if (company === "PEI") {
        templatePath = path.join(
            TEMPLATE_DIR,
            "tanda terima ga ke its pei.pdf"
        );
    } else {
        templatePath = path.join(
            TEMPLATE_DIR,
            "tanda terima ga ke its.pdf"
        );
    }

    if (!fs.existsSync(templatePath)) {
        throw new Error(
            `Template Tanda Terima GA → IT untuk ${company} tidak ditemukan: ${templatePath}`
        );
    }

    const templateBytes =
        fs.readFileSync(templatePath);

    return (async () => {

        const pdfDoc =
            await PDFDocument.load(
                templateBytes
            );

        const page =
            pdfDoc.getPages()[0];

        const font =
            await pdfDoc.embedFont(
                StandardFonts.Helvetica
            );

        // =====================================================
        // =====================================================
        // PEI
        // =====================================================
        // =====================================================

        if (company === "PEI") {

            // =================================================
            // TANGGAL
            // =================================================

            if (bookingDate) {

                const dateOnly =
                    String(bookingDate)
                        .substring(0, 10);

                const [
                    year,
                    month,
                    day
                ] =
                    dateOnly.split("-");

                const monthNames = [
                    "Januari",
                    "Februari",
                    "Maret",
                    "April",
                    "Mei",
                    "Juni",
                    "Juli",
                    "Agustus",
                    "September",
                    "Oktober",
                    "November",
                    "Desember"
                ];

                const formattedDate =
                    `${day} ${monthNames[Number(month) - 1]} ${year}`;

                page.drawText(
                    formattedDate,
                    {
                        // Setelah "Tanggal :"
                        x: 68,
                        y: 539,
                        size: 10,
                        font
                    }
                );
            }

            // =================================================
            // DARI
            // =================================================

            if (senderName) {

                page.drawText(
                    String(senderName),
                    {
                        x: 82,
                        y: 512,
                        size: 10,
                        font
                    }
                );
            }

            // =================================================
            // DIVISI DARI
            // =================================================

            page.drawText(
                "General Affairs",
                {
                    x: 82,
                    y: 499,
                    size: 10,
                    font
                }
            );

            // =================================================
            // UNTUK
            // =================================================

            if (receiverName) {

                page.drawText(
                    String(receiverName),
                    {
                        x: 355,
                        y: 512,
                        size: 10,
                        font
                    }
                );
            }

            // =================================================
            // DIVISI UNTUK
            // =================================================

            // =================================================
            // ALAMAT DARI / UNTUK
            // KHUSUS PEI
            // =================================================

            if (location) {

                // Alamat pihak GA
                page.drawText(
                    String(location),
                    {
                        x: 82,
                        y: 486,
                        size: 10,
                        font
                    }
                );

                // Alamat pihak IT
                page.drawText(
                    String(location),
                    {
                        x: 355,
                        y: 486,
                        size: 10,
                        font
                    }
                );
            }

            // =================================================
            // TABEL
            // =================================================

            const startY = 403;
            const rowGap = 13.56;

            const items =
                Array.isArray(summary)
                    ? summary.slice(0, 6)
                    : [];

           items.forEach(
                (item, index) => {

                    const y =
                        startY -
                        index * rowGap;

                    // -----------------------------------------
                    // KETERANGAN
                    // -----------------------------------------

                    const jenis =
                        String(
                            item.jenis || "-"
                        ).trim();

                    const keterangan =
                        `Install & QC ${jenis} PEI`;

                    page.drawText(
                        keterangan,
                        {
                            x: 55,
                            y,
                            size: 10,
                            font
                        }
                    );

                    // -----------------------------------------
                    // QTY
                    // -----------------------------------------

                    const qtyText =
                        String(
                            item.qty || 0
                        );

                    const qtyWidth =
                        font.widthOfTextAtSize(
                            qtyText,
                            10
                        );

                    page.drawText(
                        qtyText,
                        {
                            x:
                                493 -
                                qtyWidth / 2,
                            y,
                            size: 10,
                            font
                        }
                    );
                }
            );

            // =================================================
            // HAPUS SIGNATURE BAWAAN TEMPLATE PEI
            // =================================================
            //
            // Template PEI sudah mempunyai signature
            // bawaan di bagian "Menyerahkan".
            //
            // Kita tutup hanya area signature tersebut,
            // bukan seluruh area tanda tangan.
            //
            // =================================================

            page.drawRectangle({
                x: 48,
                y: 238,
                width: 75,
                height: 70,
                color: require("pdf-lib").rgb(
                    1,
                    1,
                    1
                )
            });

            // =================================================
            // SIGNATURE SENDER - GA
            // =================================================

            if (
                senderSignaturePath &&
                fs.existsSync(
                    senderSignaturePath
                )
            ) {

                const signatureBytes =
                    fs.readFileSync(
                        senderSignaturePath
                    );

                const ext =
                    path.extname(
                        senderSignaturePath
                    ).toLowerCase();

                let signatureImage;

                if (
                    ext === ".jpg" ||
                    ext === ".jpeg"
                ) {

                    signatureImage =
                        await pdfDoc.embedJpg(
                            signatureBytes
                        );

                } else {

                    signatureImage =
                        await pdfDoc.embedPng(
                            signatureBytes
                        );
                }

                page.drawImage(
                    signatureImage,
                    {
                        x: 55,
                        y: 245,
                        width: 60,
                        height: 55
                    }
                );
            }

            // =================================================
            // NAMA SENDER
            // =================================================

            const senderText =
                String(
                    senderName || ""
                ).trim();

            if (senderText) {

                const senderWidth =
                    font.widthOfTextAtSize(
                        senderText,
                        9
                    );

                page.drawText(
                    senderText,
                    {
                        x:
                            85 -
                            senderWidth / 2,
                        y: 238,
                        size: 9,
                        font
                    }
                );
            }

            // =================================================
            // SIGNATURE RECEIVER - IT
            // =================================================

            if (
                receiverSignaturePath &&
                fs.existsSync(
                    receiverSignaturePath
                )
            ) {

                const signatureBytes =
                    fs.readFileSync(
                        receiverSignaturePath
                    );

                const ext =
                    path.extname(
                        receiverSignaturePath
                    ).toLowerCase();

                let signatureImage;

                if (
                    ext === ".jpg" ||
                    ext === ".jpeg"
                ) {

                    signatureImage =
                        await pdfDoc.embedJpg(
                            signatureBytes
                        );

                } else {

                    signatureImage =
                        await pdfDoc.embedPng(
                            signatureBytes
                        );
                }

                page.drawImage(
                    signatureImage,
                    {
                        x: 430,
                        y: 245,
                        width: 80,
                        height: 70
                    }
                );
            }

            // =================================================
            // NAMA RECEIVER
            // =================================================

            const receiverText =
                String(
                    receiverName || ""
                ).trim();

            if (receiverText) {

                const receiverWidth =
                    font.widthOfTextAtSize(
                        receiverText,
                        9
                    );

                page.drawText(
                    receiverText,
                    {
                        x:
                            470 -
                            receiverWidth / 2,
                        y: 242,
                        size: 9,
                        font
                    }
                );
            }

            // =================================================
            // OUTPUT PEI
            // =================================================

            const outputPath =
                exports.generateOutputPath(
                    "GA_TO_IT",
                    batch.id
                );

            await exports.savePdf(
                pdfDoc,
                outputPath
            );

            return outputPath;
        }

        // =====================================================
        // =====================================================
        // PGI
        // =====================================================
        // =====================================================
        //
        // BAGIAN PGI DIPERTAHANKAN SEPERTI SEBELUMNYA
        // =====================================================

        // ==========================================
        // TANGGAL
        // ==========================================

        if (bookingDate) {

            const [
                year,
                month,
                day
            ] =
                bookingDate.split("-");

            const monthNames = [
                "Januari",
                "Februari",
                "Maret",
                "April",
                "Mei",
                "Juni",
                "Juli",
                "Agustus",
                "September",
                "Oktober",
                "November",
                "Desember"
            ];

            const formattedDate =
                `${day} ${monthNames[Number(month) - 1]} ${year}`;

            page.drawText(
                formattedDate,
                {
                    x: 106,
                    y: 497,
                    size: 9,
                    font
                }
            );
        }

        // ==========================================
        // TABEL PGI
        // ==========================================

        const startY = 379;
        const rowGap = 14;

        summary.forEach(
            (item, index) => {

                const y =
                    startY -
                    index * rowGap;

                const keterangan =
                    `Install & QC ${item.jenis} ${batch.company}`;

                page.drawText(
                    keterangan,
                    {
                        x: 90,
                        y,
                        size: 7.5,
                        font
                    }
                );

                const qtyText =
                    String(item.qty);

                const qtyWidth =
                    font.widthOfTextAtSize(
                        qtyText,
                        7.5
                    );

                page.drawText(
                    qtyText,
                    {
                        x:
                            520 -
                            qtyWidth / 2,
                        y,
                        size: 7.5,
                        font
                    }
                );
            }
        );

        // ==========================================
        // TTD MENYERAHKAN - STAFF GA
        // ==========================================

        if (
            senderSignaturePath &&
            fs.existsSync(
                senderSignaturePath
            )
        ) {

            const signatureBytes =
                fs.readFileSync(
                    senderSignaturePath
                );

            let signatureImage;

            const ext =
                path.extname(
                    senderSignaturePath
                ).toLowerCase();

            if (
                ext === ".jpg" ||
                ext === ".jpeg"
            ) {

                signatureImage =
                    await pdfDoc.embedJpg(
                        signatureBytes
                    );

            } else {

                signatureImage =
                    await pdfDoc.embedPng(
                        signatureBytes
                    );
            }

            page.drawImage(
                signatureImage,
                {
                    x: 85,
                    y: 235,
                    width: 90,
                    height: 45
                }
            );
        }

        // ==========================================
        // NAMA MENYERAHKAN
        // ==========================================

        const senderText =
            senderName || "-";

        const senderWidth =
            font.widthOfTextAtSize(
                senderText,
                9
            );

        page.drawText(
            senderText,
            {
                x:
                    130 -
                    senderWidth / 2,
                y: 235,
                size: 9,
                font
            }
        );

        // ==========================================
        // TTD PENERIMA - IT SUPPORT
        // ==========================================

        if (
            receiverSignaturePath &&
            fs.existsSync(
                receiverSignaturePath
            )
        ) {

            const signatureBytes =
                fs.readFileSync(
                    receiverSignaturePath
                );

            let signatureImage;

            const ext =
                path.extname(
                    receiverSignaturePath
                ).toLowerCase();

            if (
                ext === ".jpg" ||
                ext === ".jpeg"
            ) {

                signatureImage =
                    await pdfDoc.embedJpg(
                        signatureBytes
                    );

            } else {

                signatureImage =
                    await pdfDoc.embedPng(
                        signatureBytes
                    );
            }

            page.drawImage(
                signatureImage,
                {
                    x: 440,
                    y: 235,
                    width: 90,
                    height: 45
                }
            );
        }

        // ==========================================
        // NAMA PENERIMA
        // ==========================================

        const nameWidth =
            font.widthOfTextAtSize(
                receiverName || "",
                9
            );

        if (receiverName) {

            page.drawText(
                receiverName,
                {
                    x:
                        485 -
                        nameWidth / 2,
                    y: 235,
                    size: 9,
                    font
                }
            );
        }

        // ==========================================
        // OUTPUT PGI
        // ==========================================

        const outputPath =
            exports.generateOutputPath(
                "GA_TO_IT",
                batch.id
            );

        await exports.savePdf(
            pdfDoc,
            outputPath
        );

        return outputPath;
    })();
};

// =====================================================
// GENERATE PDF IT → GA
// =====================================================

exports.generateItToGa = ({
    batch,
    booking,
    summary,
    senderName,
    senderSignaturePath,
    receiverName,
    receiverSignaturePath
}) => {

    console.log(
        "========== IT_TO_GA VERSI BARU =========="
    );

    console.log(
        "generateItToGa AKTIF"
    );


    // ==========================================
    // TEMPLATE TETAP SAMA UNTUK PGI & PEI
    // ==========================================

    const templatePath =
        exports.getTemplatePath(
            "IT_TO_GA",
            batch?.company || "PGI"
        );


    if (!fs.existsSync(templatePath)) {

        throw new Error(
            "Template Tanda Terima IT → GA tidak ditemukan."
        );

    }


    const templateBytes =
        fs.readFileSync(
            templatePath
        );


    return (async () => {

        const pdfDoc =
            await PDFDocument.load(
                templateBytes
            );


        const page =
            pdfDoc.getPages()[0];


        const font =
            await pdfDoc.embedFont(
                StandardFonts.Helvetica
            );


        // =====================================================
        // FONT SIZE
        // =====================================================

        const infoFontSize = 11;
        const addressFontSize = 11;
        const tableFontSize = 11;
        const signatureFontSize = 11;


        // =====================================================
        // TANGGAL
        // =====================================================

        const rawDate =
            batch.closed_at ||
            booking?.booking_date;


        if (rawDate) {

            const dateOnly =
                String(rawDate).substring(
                    0,
                    10
                );


            const [
                year,
                month,
                day
            ] =
                dateOnly.split("-");


            const monthNames = [
                "Januari",
                "Februari",
                "Maret",
                "April",
                "Mei",
                "Juni",
                "Juli",
                "Agustus",
                "September",
                "Oktober",
                "November",
                "Desember"
            ];


            const formattedDate =
                `${day} ${monthNames[Number(month) - 1]} ${year}`;


            page.drawText(
                formattedDate,
                {
                    x: 180,
                    y: 449,
                    size: infoFontSize,
                    font
                }
            );

        }


        // =====================================================
        // INFORMASI KIRI
        // =====================================================

        page.drawText(
            senderName || "-",
            {
                x: 178,
                y: 416,
                size: infoFontSize,
                font
            }
        );


        page.drawText(
            "IT Support",
            {
                x: 178,
                y: 399,
                size: infoFontSize,
                font
            }
        );


        // =====================================================
        // INFORMASI KANAN
        // =====================================================

        const rightTextX = 556;


        page.drawText(
            receiverName || "-",
            {
                x: rightTextX,
                y: 416,
                size: infoFontSize,
                font
            }
        );


        page.drawText(
            "General Affairs",
            {
                x: rightTextX,
                y: 399,
                size: infoFontSize,
                font
            }
        );


        // =====================================================
        // ALAMAT
        // =====================================================

        const alamat =
            booking?.location ||
            "Pusat Gadai Indonesia";


        page.drawText(
            alamat,
            {
                x: 178,
                y: 382,
                size: addressFontSize,
                font
            }
        );


        page.drawText(
            alamat,
            {
                x: rightTextX,
                y: 382,
                size: addressFontSize,
                font
            }
        );


        // =====================================================
        // KETERANGAN INVENTARIS
        // =====================================================

        const items =
            Array.isArray(summary)
                ? summary
                : summary?.items || [];


        const pdfItems =
            items.slice(0, 5);


        const rowY = [
            314,
            297,
            280,
            263,
            246
        ];


        pdfItems.forEach(
            (item, index) => {

                const y =
                    rowY[index];


                const keterangan =
                    `Instalasi & QC ${item.jenis || "-"} ${batch.company}`;


                page.drawText(
                    keterangan,
                    {
                        x: 177,
                        y,
                        size: tableFontSize,
                        font
                    }
                );


                // Qty center

                const qtyText =
                    String(item.qty || 0);


                const qtyWidth =
                    font.widthOfTextAtSize(
                        qtyText,
                        tableFontSize
                    );


                page.drawText(
                    qtyText,
                    {
                        x:
                            662 -
                            (qtyWidth / 2),

                        y,

                        size: tableFontSize,

                        font
                    }
                );

            }
        );


        // =====================================================
        // SIGNATURE MENYERAHKAN
        // STAFF IT
        // =====================================================

        if (
            senderSignaturePath &&
            fs.existsSync(senderSignaturePath)
        ) {

            const signatureBytes =
                fs.readFileSync(
                    senderSignaturePath
                );


            let signatureImage;


            const ext =
                path.extname(
                    senderSignaturePath
                ).toLowerCase();


            if (
                ext === ".jpg" ||
                ext === ".jpeg"
            ) {

                signatureImage =
                    await pdfDoc.embedJpg(
                        signatureBytes
                    );

            } else {

                signatureImage =
                    await pdfDoc.embedPng(
                        signatureBytes
                    );

            }


            page.drawImage(
                signatureImage,
                {
                    x: 105,
                    y: 132,
                    width: 150,
                    height: 75
                }
            );

        }


        // =====================================================
        // NAMA MENYERAHKAN
        // =====================================================

        const senderText =
            senderName || "-";


        const senderWidth =
            font.widthOfTextAtSize(
                senderText,
                signatureFontSize
            );


        page.drawText(
            senderText,
            {
                x:
                    180 -
                    (senderWidth / 2),

                y: 132,

                size: signatureFontSize,

                font
            }
        );


        // =====================================================
        // SIGNATURE MENERIMA
        // STAFF GA
        // =====================================================

        if (
            receiverSignaturePath &&
            fs.existsSync(receiverSignaturePath)
        ) {

            const signatureBytes =
                fs.readFileSync(
                    receiverSignaturePath
                );


            let signatureImage;


            const ext =
                path.extname(
                    receiverSignaturePath
                ).toLowerCase();


            if (
                ext === ".jpg" ||
                ext === ".jpeg"
            ) {

                signatureImage =
                    await pdfDoc.embedJpg(
                        signatureBytes
                    );

            } else {

                signatureImage =
                    await pdfDoc.embedPng(
                        signatureBytes
                    );

            }


            page.drawImage(
                signatureImage,
                {
                    x: 549,
                    y: 132,
                    width: 150,
                    height: 75
                }
            );

        }


        // =====================================================
        // NAMA MENERIMA
        // =====================================================

        const receiverText =
            receiverName || "-";


        const receiverWidth =
            font.widthOfTextAtSize(
                receiverText,
                signatureFontSize
            );


        page.drawText(
            receiverText,
            {
                x:
                    624 -
                    (receiverWidth / 2),

                y: 132,

                size: signatureFontSize,

                font
            }
        );


        // =====================================================
        // SAVE PDF
        // =====================================================

        const outputPath =
            exports.generateOutputPath(
                "IT_TO_GA",
                batch.id
            );


        await exports.savePdf(
            pdfDoc,
            outputPath
        );


        console.log(
            "IT_TO_GA PDF BERHASIL DISIMPAN:",
            outputPath,
            fs.existsSync(outputPath)
        );


        return outputPath;

    })();

};