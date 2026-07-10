const Tesseract = require("tesseract.js");

exports.scan = async (imagePath) => {

    try {

        const result = await Tesseract.recognize(
            imagePath,
            "eng"
        );

        const text = result.data.text;

        // Bersihkan hasil OCR
        const textClean = text
            .replace(/\r?\n/g, " ")
            .replace(/\s+/g, " ")
            .toUpperCase();

        console.log("================================");
        console.log("OCR TEXT");
        console.log(textClean);
        console.log("================================");

        // Cari NFxxxxx atau IMEI 15 digit
        const match = textClean.match(/NF\s*[0-9A-Z]+|\d[\d\s]{13,16}/);

        if (!match) {

            return {
                success: false,
                nf: null,
                confidence: result.data.confidence,
                text: textClean
            };

        }

        return {

            success: true,

            // Tetap pakai nama "nf"
            // supaya file lain tidak perlu diubah
            nf: match[0].trim(),

            confidence: result.data.confidence,

            text: textClean

        };

    } catch (err) {

        return {

            success: false,

            nf: null,

            confidence: 0,

            text: "",

            error: err.message

        };

    }

};