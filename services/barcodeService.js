const Jimp = require("jimp");
const {
    MultiFormatReader,
    RGBLuminanceSource,
    BinaryBitmap,
    HybridBinarizer
} = require("@zxing/library");

exports.decode = async (imagePath) => {

    console.log("");
    console.log("========================================");
    console.log("BARCODE SERVICE");
    console.log("========================================");
    console.log("Image :", imagePath);

    try {

        const image = await Jimp.read(imagePath);

        const { data, width, height } = image.bitmap;

        const luminance = new RGBLuminanceSource(
            data,
            width,
            height
        );

        const bitmap = new BinaryBitmap(
            new HybridBinarizer(luminance)
        );

        const reader = new MultiFormatReader();

        const result = reader.decode(bitmap);

        console.log("");
        console.log("✅ BARCODE BERHASIL");
        console.log(result.getText());

        return {

            success: true,

            barcode: result.getText(),

            message: "OK"

        };

    } catch (err) {

        console.log("");
        console.log("❌ BARCODE TIDAK TERBACA");

        return {

            success: false,

            barcode: null,

            message: err.message

        };

    }

};