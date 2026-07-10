const Tesseract = require("tesseract.js");

(async () => {

    console.log("====================================");
    console.log("TEST OCR");
    console.log("====================================");

    const result = await Tesseract.recognize(
        "./uploads/barcode/QC_20260703_003303.jpeg",
        "eng",
        {
            logger: (m) => {

                if (m.status === "recognizing text") {

                    process.stdout.write(
                        `\rProgress : ${Math.round(m.progress * 100)}%`
                    );

                }

            }
        }
    );

    console.log("\n");
    console.log("====================================");
    console.log("HASIL OCR");
    console.log("====================================");

    console.log(result.data.text);

})();