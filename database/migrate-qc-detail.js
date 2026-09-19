const db = require("../config/database");

console.log("==================================");
console.log(" MIGRATION QC DETAIL");
console.log("==================================");

function addColumnIfNotExists(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();

    const exists = columns.some(
        col => col.name === column
    );

    if (exists) {
        console.log(`SKIP: ${table}.${column} sudah ada`);
        return;
    }

    db.prepare(`
        ALTER TABLE ${table}
        ADD COLUMN ${column} ${definition}
    `).run();

    console.log(`PASS: ${table}.${column} berhasil ditambahkan`);
}


// ==========================================
// QC DETAIL
// ==========================================

addColumnIfNotExists(
    "inventaris",
    "qc_name",
    "TEXT"
);

addColumnIfNotExists(
    "inventaris",
    "ssd",
    "TEXT"
);

addColumnIfNotExists(
    "inventaris",
    "ssd_health",
    "TEXT"
);

addColumnIfNotExists(
    "inventaris",
    "bh",
    "TEXT"
);


console.log("==================================");
console.log(" MIGRATION QC DETAIL SELESAI");
console.log("==================================");