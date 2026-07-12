const Tesseract = require("tesseract.js");

// =====================================
// NORMALIZE OCR
// =====================================

function normalizeOCR(text) {

    return text
        .toUpperCase()

        // Huruf -> Angka
        .replace(/O/g, "0")
        .replace(/Q/g, "0")

        .replace(/I/g, "1")
        .replace(/L/g, "1")
        .replace(/\|/g, "1")

        .replace(/S/g, "5")

        .replace(/B/g, "8")

        // Huruf yang sering muncul di tengah angka
        .replace(/(?<=\d)R(?=\d)/g, "8")
        .replace(/(?<=\d)G(?=\d)/g, "6")

        .replace(/Z/g, "2");

}

// =====================================
// AMBIL SEMUA ANGKA
// =====================================

function extractNumbers(text) {

    const compact = text.replace(/\s+/g, "");

    return compact.match(/\d+/g) || [];

}

// =====================================
// GENERATE KANDIDAT
// =====================================

function generateCandidates(numbers) {

    const candidates = [];

    for (const number of numbers) {

        //----------------------------------------
        // Laptop (NF 14 digit)
        //----------------------------------------

        if (number.length === 14) {

            candidates.push(number);

        }

        if (number.length > 14) {

            for (

                let i = 0;

                i <= number.length - 14;

                i++

            ) {

                candidates.push(

                    number.substring(i, i + 14)

                );

            }

        }

        //----------------------------------------
        // Handphone (IMEI 15 digit)
        //----------------------------------------

        if (number.length === 15) {

            candidates.push(number);

        }

        if (number.length > 15) {

            for (

                let i = 0;

                i <= number.length - 15;

                i++

            ) {

                candidates.push(

                    number.substring(i, i + 15)

                );

            }

        }

    }

    // Hilangkan duplikat
    return [...new Set(candidates)];

}

// =====================================
// OCR
// =====================================

exports.scan = async (imagePath) => {

    try {

        const result = await Tesseract.recognize(

            imagePath,

            "eng"

        );

        const text = result.data.text;

        const textClean = normalizeOCR(

            text
                .replace(/\r?\n/g, " ")
                .replace(/\s+/g, " ")

        );

        const numbers = extractNumbers(textClean);

        const candidates = generateCandidates(numbers);

        if (candidates.length === 0) {

            return {

                success: false,

                candidates: [],

                confidence: result.data.confidence,

                text: textClean

            };

        }

        return {

            success: true,

            candidates,

            confidence: result.data.confidence,

            text: textClean

        };

    }

    catch (err) {

        console.error(err);

        return {

            success: false,

            candidates: [],

            confidence: 0,

            text: "",

            error: err.message

        };

    }

};