const db = require("../config/database");

// ========================================
// CREATE ACTIVITY
// ========================================

function createActivity({
    company = null,
    type,
    title,
    message = null,
    reference_id = null
}) {
    if (!type) {
        throw new Error("Activity type wajib diisi");
    }

    if (!title) {
        throw new Error("Activity title wajib diisi");
    }

    const stmt = db.prepare(`
        INSERT INTO activity_log (
            company,
            type,
            title,
            message,
            reference_id
        )
        VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        company,
        type,
        title,
        message,
        reference_id
    );

    return {
        id: result.lastInsertRowid,
        company,
        type,
        title,
        message,
        reference_id
    };
}


// ========================================
// GET LATEST ACTIVITIES
// ========================================

function getLatestActivities(limit = 10) {
    return db.prepare(`
        SELECT
            id,
            company,
            type,
            title,
            message,
            reference_id,
            created_at
        FROM activity_log
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
    `).all(limit);
}


// ========================================
// GET ACTIVITIES BY COMPANY
// ========================================

function getActivitiesByCompany(company, limit = 10) {
    return db.prepare(`
        SELECT
            id,
            company,
            type,
            title,
            message,
            reference_id,
            created_at
        FROM activity_log
        WHERE company = ?
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
    `).all(company, limit);
}


// ========================================
// GET ACTIVITIES BY TYPE
// ========================================

function getActivitiesByType(type, limit = 10) {
    return db.prepare(`
        SELECT
            id,
            company,
            type,
            title,
            message,
            reference_id,
            created_at
        FROM activity_log
        WHERE type = ?
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
    `).all(type, limit);
}


// ========================================
// GET ACTIVITIES BY MONTH
// ========================================

function getActivitiesByMonth(month, limit = 100) {
    return db.prepare(`
        SELECT
            id,
            company,
            type,
            title,
            message,
            reference_id,
            created_at
        FROM activity_log
        WHERE strftime('%Y-%m', created_at) = ?
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
    `).all(month, limit);
}


// ========================================
// COUNT ACTIVITIES
// ========================================

function countActivities() {
    const result = db.prepare(`
        SELECT COUNT(*) AS total
        FROM activity_log
    `).get();

    return result.total;
}


// ========================================
// DELETE OLD ACTIVITIES
// ========================================
//
// Default: hapus aktivitas yang lebih lama
// dari 90 hari.
//
// Untuk sekarang fungsi ini BELUM dipanggil
// otomatis. Kita simpan dulu untuk kebutuhan
// maintenance ke depannya.
//

function deleteOldActivities(days = 90) {
    return db.prepare(`
        DELETE FROM activity_log
        WHERE datetime(created_at) < datetime('now', ?)
    `).run(`-${days} days`);
}


// ========================================
// EXPORT
// ========================================

module.exports = {
    createActivity,
    getLatestActivities,
    getActivitiesByCompany,
    getActivitiesByType,
    getActivitiesByMonth,
    countActivities,
    deleteOldActivities
};