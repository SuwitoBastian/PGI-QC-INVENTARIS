const path = require("path");
const barcodeService = require("../services/barcodeService");

exports.index = (req, res) => {

    res.render("developer");

};

exports.barcode = (req, res) => {

    res.render("barcodeTester", {

        result: null

    });

};

exports.upload = async (req, res) => {

    const imagePath = path.join(req.file.destination, req.file.filename);

    const result = await barcodeService.decode(imagePath);

    console.log(result);

    res.render("barcodeTester", {
        result
    });

};