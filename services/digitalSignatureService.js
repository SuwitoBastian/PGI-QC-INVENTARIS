const db = require("../config/database");

// ==========================================
// GET ALL ACTIVE SIGNATURES
// ==========================================

exports.getActiveSignatures = () => {
    return db.prepare(`
        SELECT
            id,
            nama,
            jabatan,
            signature_path,
            status,
            created_at,
            updated_at
        FROM digital_signature
        WHERE status = 'ACTIVE'
        ORDER BY nama ASC
    `).all();
};


// ==========================================
// GET SIGNATURE BY ID
// ==========================================

exports.getById = (id) => {
    return db.prepare(`
        SELECT
            id,
            nama,
            jabatan,
            signature_path,
            status,
            created_at,
            updated_at
        FROM digital_signature
        WHERE id = ?
        LIMIT 1
    `).get(id);
};


// ==========================================
// GET ACTIVE SIGNATURE BY NAME
// ==========================================

exports.getActiveByName = (nama) => {
    return db.prepare(`
        SELECT
            id,
            nama,
            jabatan,
            signature_path,
            status,
            created_at,
            updated_at
        FROM digital_signature
        WHERE nama = ?
        AND status = 'ACTIVE'
        LIMIT 1
    `).get(nama);
};


// ==========================================
// CREATE SIGNATURE
// ==========================================

exports.create = (data) => {
    const stmt = db.prepare(`
        INSERT INTO digital_signature
        (
            nama,
            jabatan,
            signature_path,
            status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
        data.nama,
        data.jabatan || null,
        data.signature_path
    );

    return result.lastInsertRowid;
};


// ==========================================
// UPDATE SIGNATURE
// ==========================================

exports.update = (id, data) => {
    const stmt = db.prepare(`
        UPDATE digital_signature
        SET
            nama = ?,
            jabatan = ?,
            signature_path = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    return stmt.run(
        data.nama,
        data.jabatan || null,
        data.signature_path,
        id
    );
};


// ==========================================
// DEACTIVATE SIGNATURE
// ==========================================

exports.deactivate = (id) => {
    return db.prepare(`
        UPDATE digital_signature
        SET
            status = 'INACTIVE',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(id);
};