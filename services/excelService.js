const XLSX = require("xlsx");

// Header wajib
const REQUIRED_HEADERS = [
    "No",
    "Tanggal Masuk",
    "Jenis",
    "Merk",
    "NF"
];

// ===========================
// Membaca Excel
// ===========================
exports.readExcel = (filePath) => {

    const workbook = XLSX.readFile(filePath);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet);

    return data;

};

// ===========================
// Validasi Header
// ===========================
exports.validateHeader = (data) => {

    if (data.length === 0) {
        return {
            valid: false,
            message: "Excel kosong."
        };
    }

    const headers = Object.keys(data[0]);

    for (const header of REQUIRED_HEADERS) {

        if (!headers.includes(header)) {

            return {

                valid: false,

                message: `Kolom "${header}" tidak ditemukan.`

            };

        }

    }

    return {

        valid: true

    };

};
// ===========================
// Mapping Data
// ===========================
exports.mapData = (data) => {

    return data.map((row) => ({

        no: row["No"] || null,

        tanggal_masuk: row["Tanggal Masuk"] || null,

        tanggal_selesai: row["Tanggal Selesai"] || null,

        jenis: normalizeJenis(row["Jenis"]),

        merk: String(row["Merk"] || "").trim(),

        type: String(row["Merk & Type"] || "").trim(),

        nf: String(row["NF"] || "").trim(),

        gen: String(row["Gen"] || "").trim(),

        ram: String(row["RAM"] || "").trim(),

        imei: String(row["IMEI"] || "").trim(),

        status: normalizeStatus(row["Sudah Install"]),

        reject_reason: String(row["Alasan Reject"] || "").trim()

    }));

};


// ===========================
// Normalisasi Status
// ===========================
function normalizeStatus(status){

    if(!status) return "PENDING";

    status = status.toString().trim().toUpperCase();

    if(status==="DONE") return "DONE";

    if(status==="REJECT") return "REJECT";

    return "PENDING";

}
function normalizeJenis(jenis){

    if(!jenis) return "";

    jenis = jenis.toString().trim().toLowerCase();

    if(jenis === "laptop") return "Laptop";

    if(jenis === "handphone") return "Handphone";

    return jenis;

}
// ===========================
// Validasi Isi Data
// ===========================
exports.validateData = (data) => {

    const errors = [];

    data.forEach((item, index) => {

        if (item.jenis === "Laptop" && !item.nf) {
        errors.push(`Baris ${index + 2}: Laptop tidak memiliki NF`);
        }

        if (item.jenis === "Handphone" && !item.imei) {
        errors.push(`Baris ${index + 2}: Handphone tidak memiliki IMEI`);
        }

        if (!item.merk) {
            errors.push(`Baris ${index + 2}: Merk kosong`);
        }

    });

    return errors;

};