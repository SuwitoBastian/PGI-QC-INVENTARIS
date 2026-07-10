const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(
    path.join(__dirname, "inventaris.db")
);

function columnExists(table, column) {

    const columns = db.prepare(
        `PRAGMA table_info(${table})`
    ).all();

    return columns.some(col => col.name === column);

}

function addColumn(table, column, definition) {

    if (columnExists(table, column)) {

        console.log(`✔ ${table}.${column} sudah ada`);

        return;

    }

    db.prepare(
        `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    ).run();

    console.log(`➕ ${table}.${column} berhasil ditambahkan`);

}

const MIGRATION_VERSION = "1.0.0";

console.log("");
console.log("==================================");
console.log(" DATABASE MIGRATION");
console.log("==================================");
console.log(`Version : ${MIGRATION_VERSION}`);
console.log(`Date    : ${new Date().toLocaleString("id-ID")}`);
console.log("");

/*
|--------------------------------------------------------------------------
| Batch
|--------------------------------------------------------------------------
*/

addColumn(
    "batch",
    "company",
    "TEXT DEFAULT 'PGI'"
);

addColumn(
    "batch",
    "closed_at",
    "DATETIME"
);

/*
|--------------------------------------------------------------------------
| Inventaris
|--------------------------------------------------------------------------
*/

addColumn(
    "inventaris",
    "company",
    "TEXT DEFAULT 'PGI'"
);

/*
|--------------------------------------------------------------------------
| Update Data Lama
|--------------------------------------------------------------------------
*/

db.prepare(`
UPDATE batch
SET company='PGI'
WHERE company IS NULL
`).run();

db.prepare(`
UPDATE inventaris
SET company='PGI'
WHERE company IS NULL
`).run();

console.log("");
console.log("==================================");
console.log(" Migration Selesai");
console.log("==================================");
console.log("");

db.close();