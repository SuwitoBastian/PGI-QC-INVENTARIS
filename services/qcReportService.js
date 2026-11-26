const db = require("../config/database");
const inventoryService = require("./inventoryService");

const CATEGORY_ORDER = [
    "BODY",
    "LCD",
    "SPEAKER",
    "DRIVER",
    "HARDWARE",
    "HARGA",
    "LOCK / AKUN",
    "GRADE",
    "LN",
    "UNKNOWN"
];

function text(value) {
    return String(value ?? "").trim();
}

function normalize(value) {
    return text(value)
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\s+/g, " ");
}

function normalizeDeviceType(value) {
    const raw = normalize(value);
    const compact = raw.replace(/[^a-z0-9]+/g, " ").trim();

    if (/\blaptop\b/.test(compact)) return "LAPTOP";
    if (/\b(handphone|hand phone|smartphone|smart phone|hp)\b/.test(compact)) return "HANDPHONE";
    if (/\b(tablet|tab)\b/.test(compact)) return "TABLET";
    if (
        /\b(pc all in one|all in one|allinone|aio|pc aio)\b/.test(compact) ||
        /\bpc\s*all[- ]?in[- ]?one\b/.test(raw)
    ) return "PC ALL-IN-ONE";

    return text(value).toUpperCase() || "LAINNYA";
}

function metricBelow85(value) {
    const raw = text(value);
    if (!raw) return false;
    const match = raw.match(/-?\d+(?:[.,]\d+)?/);
    if (!match) return false;
    const number = Number(match[0].replace(",", "."));
    return Number.isFinite(number) && number < 85;
}

function reasonMetricBelow85(reason, labels) {
    const raw = normalize(reason);
    return labels.some((label) => {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b\\s*(?::|=|-)?\\s*(\\d{1,3}(?:[.,]\\d+)?)\\s*%?`, "i");
        const match = raw.match(regex);
        if (!match) return false;
        const number = Number(match[1].replace(",", "."));
        return Number.isFinite(number) && number < 85;
    });
}

function hasAny(value, patterns) {
    return patterns.some((pattern) => pattern.test(value));
}

function classifyReject(row) {
    const jenis = normalizeDeviceType(row.jenis);
    const reason = normalize(row.reject_reason);
    const categories = new Set();

    if (!reason) {
        categories.add("UNKNOWN");
        return [...categories];
    }

    const addIf = (category, patterns) => {
        if (hasAny(reason, patterns)) categories.add(category);
    };

    // Kategori umum yang berlaku lintas jenis perangkat.
    addIf("HARGA", [
        /\bharga\b/, /\bover\s*price\b/, /\boverprice\b/, /\bmahal\b/, /melebihi\s*(batas|budget)/, /melewati\s*(batas|budget)/
    ]);
    addIf("GRADE", [/\bgrade\s*[de]\b/]);
    addIf("DRIVER", [/\bdriver\b/]);
    addIf("SPEAKER", [/\bspeaker\b/, /suara\s*pecah/, /audio\s*pecah/]);
    addIf("LOCK / AKUN", [
        /\bbios\s*lock\b/, /\bbitlocker\b/, /password\s*lock/, /\blocked\b/, /\block\b/, /terkunci/, /akun.*(lock|terkunci)/, /perlu\s*akun/
    ]);

    if (jenis === "LAPTOP") {
        addIf("BODY", [
            /\bbody\b.*(rusak|dent|penyok|retak|lecet)/, /\bdent\b/, /\bpenyok\b/, /\bretak\b/, /\bcasing\b/, /\bengsel\b/, /\bcover\b/, /\bpalm\s*rest\b/, /\bpalmrest\b/, /\bbezel\b/, /fisik\s*rusak/
        ]);
        addIf("LCD", [
            /\blcd\b/, /\bwhite\s*spot\b/, /layar.*(berg(a|e)ris|bergaris|flicker|shadow)/, /\bflicker\b/, /frame\s*lcd/
        ]);

        const laptopReasonForHardware = reason
            .replace(/\bssd\s*health\b/g, " ")
            .replace(/\bbattery\s*health\b/g, " ")
            .replace(/\bbaterai\s*health\b/g, " ")
            .replace(/\bbeterai\s*health\b/g, " ")
            .replace(/\bbh\b/g, " ");
        if (hasAny(laptopReasonForHardware, [
            /\bhdd\b/, /\bssd\s*(rusak|error|bad|failed)\b/, /\bkeyboard\b/, /\btouch\s*pad\b/, /\btouchpad\b/, /\btrackpad\b/, /\bfan\b/, /\bbaterai\b/, /\bbeterai\b/, /\bbattery\b/, /port\s*(usb|charger)/, /\bram\b/, /arus\s*pendek/, /kamera\s*rusak/, /camera\s*rusak/
        ])) categories.add("HARDWARE");

        if (metricBelow85(row.bh) || metricBelow85(row.ssd_health) || reasonMetricBelow85(reason, ["bh", "ssd health", "battery health", "baterai health"])) {
            categories.add("HARDWARE");
        }

        addIf("UNKNOWN", [/merek\s*tidak\s*sesuai/, /brand\s*(tidak\s*sesuai|mismatch)/]);
    } else if (jenis === "HANDPHONE") {
        addIf("BODY", [
            /body.*(dent|rusak|bengkok|penyok|jamur|lecet)/, /\bbengkok\b/, /\bdent\b/, /\bpenyok\b/, /body\s*jamur/, /body\s*lecet/, /backdoor.*(rusak|bongkaran|gantian)/, /bezel\s*rusak/, /tombol\s*power\s*mendem/
        ]);
        addIf("LCD", [
            /\blcd\b/, /layar.*(berg(a|e)ris|shadow|baret)/, /\bwhite\s*spot\b/
        ]);
addIf("HARDWARE", [
    /baterai.*(kembung|gendut|rusak|bermasalah)/,
    /beterai.*(kembung|gendut|rusak|bermasalah)/,
    /baterei.*(kembung|gendut|rusak|bermasalah)/,
    /batre.*(kembung|gendut|rusak|bermasalah)/,
    /battery.*(swollen|kembung|gendut|rusak|bermasalah|problem|issue)/,
    /port\s*(charger|usb)/,
    /camera.*(rusak|pecah)/,
    /kamera.*(rusak|pecah)/,
    /lensa\s*camera\s*pecah/,
    /\bmic\b/,
    /microphone/,
    /vibrator/,
    /getar.*(tidak|ga|gak|nggak)/,
    /sim\s*tray/,
    /mati\s*total/
]);
        addIf("LN", [/\bln\b/]);
        addIf("LOCK / AKUN", [/\bakun\b/]);
        addIf("UNKNOWN", [
            /gabisa\s*cek/, /tidak\s*bisa\s*cek/, /\*#0\*#/, /fisik\s*tidak\s*ada\s*di\s*it/, /merek\s*tidak\s*sesuai/, /brand\s*(tidak\s*sesuai|mismatch)/
        ]);
    } else if (jenis === "TABLET") {
        addIf("BODY", [
            /\bbengkok\b/, /\bdent\b/, /\bpenyok\b/, /body.*(dent|jamur|lecet)/, /\b(bazzel|bazel|bezel)\b.*(patah|retak)/
        ]);
        addIf("LCD", [
            /\blcd\b/, /\bwhite\s*spot\b/, /layar.*(berg(a|e)ris|baret)/
        ]);
        addIf("HARDWARE", [
            /\bbaterai\b/, /\bbattery\b/, /\bkamera\s*rusak\b/, /\bcamera\s*rusak\b/, /\bport\b/, /\bhardware\b/, /\bram\b/, /\bssd\b/, /\bhdd\b/, /\bfan\b/
        ]);
        addIf("UNKNOWN", [/merek\s*tidak\s*sesuai/, /brand\s*(tidak\s*sesuai|mismatch)/]);
    } else if (jenis === "PC ALL-IN-ONE") {
        addIf("BODY", [
            /\bbody\b.*(rusak|dent|penyok|retak|lecet)/, /\bcasing\b/, /fisik\s*rusak/
        ]);
        addIf("LCD", [
            /\blcd\b/, /\blayr\s*vignete\b/, /\blayar\s*vignete\b/, /\bwhite\s*spot\b/, /layar.*(berg(a|e)ris|baret|flicker)/
        ]);
        addIf("HARDWARE", [
            /\bssd\b/, /\bhdd\b/, /\bram\b/, /\bfan\b/, /\bport\b/, /\bhardware\b/
        ]);
        addIf("UNKNOWN", [/merek\s*tidak\s*sesuai/, /brand\s*(tidak\s*sesuai|mismatch)/]);
    } else {
        // Jenis yang belum memiliki kamus khusus tetap ditampung sebagai UNKNOWN.
        categories.add("UNKNOWN");
    }

    // Satu alasan boleh menghasilkan beberapa kategori; jika tidak cocok, jangan dibuang.
    if (categories.size === 0) categories.add("UNKNOWN");

    return [...categories];
}

function processorFamily(value) {
    const match = text(value).match(/\b(?:intel\s*)?(?:core\s*)?i([3579])\b/i);
    return match ? `Intel Core i${match[1]}` : null;
}

function countProcessors(items, status) {
    const counts = new Map();
    for (const item of items) {
        if (String(item.status || "").toUpperCase() !== status) continue;
        const family = processorFamily(item.type);
        if (family) counts.set(family, (counts.get(family) || 0) + 1);
    }
    return ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9"]
        .filter((family) => counts.has(family))
        .map((family) => ({ family, total: counts.get(family) }));
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return text(value);
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit", month: "long", year: "numeric"
    }).format(date);
}


function buildReport(batch, items) {
    const done = items.filter(
        item => String(item.status || "").toUpperCase() === "DONE"
    );

    const rejected = items.filter(
        item => String(item.status || "").toUpperCase() === "REJECT"
    );

    const lines = [
        "*📊 LAPORAN HASIL QC INVENTARIS*",
        "",
        `Company: ${text(batch.company).toUpperCase()}`,
        `Batch: ${text(batch.batch_code)}`,
        `Tanggal Closing: ${formatDate(batch.closed_at)}`,
        "",
        "*1. RINGKASAN HASIL QC*",
        "",
        `Total Inventaris: ${items.length} Unit`,
        ""
    ];

    // Kelompokkan seluruh inventaris berdasarkan jenis perangkat.
    const byDeviceType = new Map();

    for (const item of items) {
        const type = normalizeDeviceType(item.jenis);

        if (!byDeviceType.has(type)) {
            byDeviceType.set(type, []);
        }

        byDeviceType.get(type).push(item);
    }

    const typeOrder = [
        "LAPTOP",
        "HANDPHONE",
        "TABLET",
        "PC ALL-IN-ONE"
    ];

    const types = [...byDeviceType.keys()].sort((a, b) => {
        const ai = typeOrder.indexOf(a);
        const bi = typeOrder.indexOf(b);

        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;

        return ai - bi;
    });

    for (const type of types) {
        const typeItems = byDeviceType.get(type);

        const typeDone = typeItems.filter(
            item => String(item.status || "").toUpperCase() === "DONE"
        );

        const typeRejected = typeItems.filter(
            item => String(item.status || "").toUpperCase() === "REJECT"
        );

        lines.push(type);

        lines.push(`DONE: ${typeDone.length} Unit`);

        // Detail processor hanya ditampilkan untuk Laptop.
        if (type === "LAPTOP") {
            const doneProcessors = countProcessors(typeItems, "DONE");

            for (const processor of doneProcessors) {
                lines.push(`- ${processor.family}: ${processor.total} Unit`);
            }
        }

        lines.push(`REJECT: ${typeRejected.length} Unit`);

        // Detail processor REJECT hanya untuk Laptop.
        if (type === "LAPTOP") {
            const rejectProcessors = countProcessors(typeItems, "REJECT");

            for (const processor of rejectProcessors) {
                lines.push(`- ${processor.family}: ${processor.total} Unit`);
            }
        }

        lines.push("");
    }

    lines.push(
        "*2. RINGKASAN KATEGORI REJECT BERDASARKAN JENIS*",
        ""
    );

    const byType = new Map();

    for (const item of rejected) {
        const type = normalizeDeviceType(item.jenis);

        if (!byType.has(type)) {
            byType.set(type, new Map());
        }

        const categoryMap = byType.get(type);

        for (const category of classifyReject(item)) {
            if (!categoryMap.has(category)) {
                categoryMap.set(category, new Set());
            }

            categoryMap.get(category).add(item.id);
        }
    }

    if (byType.size === 0) {
        lines.push("Tidak ada inventaris REJECT.");
    } else {
        const rejectTypes = [...byType.keys()].sort((a, b) => {
            const ai = typeOrder.indexOf(a);
            const bi = typeOrder.indexOf(b);

            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;

            return ai - bi;
        });

        for (const type of rejectTypes) {
            lines.push(
                type,
                ...CATEGORY_ORDER
                    .filter(category => byType.get(type).has(category))
                    .map(category =>
                        `- ${category}: ${byType.get(type).get(category).size} Unit`
                    ),
                ""
            );
        }
    }

    lines.push(
        "",
        "_PESAN INI OTOMATIS DIKIRIM MELALUI qc.itshelpdesk.my.id_"
    );

    return lines.join("\n").trim();
}


/**
 * Menutup satu batch tertentu dan menyimpan snapshot teks laporan dalam
 * transaksi yang sama. WhatsApp dikirim setelah transaksi berhasil commit.
 */
exports.closeBatchAndCreateReport = (batchId, company) => {
    const transaction = db.transaction(() => {
        const batch = db.prepare(`
            SELECT * FROM batch
            WHERE id = ? AND UPPER(company) = UPPER(?)
            LIMIT 1
        `).get(batchId, company);

        if (!batch) throw new Error("Batch tidak ditemukan atau bukan milik company aktif.");
        if (batch.status !== "ACTIVE") throw new Error("Batch ini sudah tidak berstatus ACTIVE.");

        const pending = db.prepare(`
            SELECT COUNT(*) AS total
            FROM inventaris
            WHERE batch_id = ? AND UPPER(status) = 'PENDING'
        `).get(batchId).total;

        if (pending > 0) {
            const error = new Error(`Masih ada ${pending} inventaris yang berstatus PENDING.`);
            error.code = "BATCH_PENDING";
            error.pending = pending;
            throw error;
        }

        const items = inventoryService.getInventarisByBatch(batchId);
        const closedAt = db.prepare("SELECT datetime('now','localtime') AS value").get().value;
        const batchForReport = { ...batch, closed_at: closedAt };
        const reportText = buildReport(batchForReport, items);

        const update = db.prepare(`
            UPDATE batch
            SET status = 'FINISHED', closed_at = ?
            WHERE id = ? AND company = ? AND status = 'ACTIVE'
        `).run(closedAt, batchId, company);

        if (update.changes !== 1) throw new Error("Batch gagal ditutup karena statusnya sudah berubah.");

        db.prepare(`
            INSERT INTO qc_batch_report
                (batch_id, company, report_text, status, attempts, created_at, updated_at)
            VALUES (?, ?, ?, 'PENDING', 0, datetime('now','localtime'), datetime('now','localtime'))
            ON CONFLICT(batch_id) DO NOTHING
        `).run(batchId, company, reportText);

        const report = db.prepare(`
            SELECT * FROM qc_batch_report WHERE batch_id = ?
        `).get(batchId);

        return { batch: { ...batchForReport, status: "FINISHED" }, report };
    });

    return transaction();
};

exports.getReportByBatch = (batchId) => db.prepare(`
    SELECT * FROM qc_batch_report WHERE batch_id = ? LIMIT 1
`).get(batchId);

exports.getReportForCompany = (batchId, company) => db.prepare(`
    SELECT r.*
    FROM qc_batch_report r
    INNER JOIN batch b ON b.id = r.batch_id
    WHERE r.batch_id = ? AND UPPER(r.company) = UPPER(?) AND UPPER(b.company) = UPPER(?)
    LIMIT 1
`).get(batchId, company, company);

exports.claimReportForSending = (batchId) => db.prepare(`
    UPDATE qc_batch_report
    SET status = 'SENDING',
        attempts = attempts + 1,
        sending_at = datetime('now','localtime'),
        last_error = NULL,
        updated_at = datetime('now','localtime')
    WHERE batch_id = ?
      AND (
          status IN ('PENDING', 'FAILED')
          OR (status = 'SENDING' AND sending_at < datetime('now','localtime','-10 minutes'))
      )
`).run(batchId);

exports.markReportSent = (batchId, messageId) => db.prepare(`
    UPDATE qc_batch_report
    SET status = 'SENT',
        sent_at = datetime('now','localtime'),
        sending_at = NULL,
        wa_message_id = ?,
        last_error = NULL,
        updated_at = datetime('now','localtime')
    WHERE batch_id = ?
`).run(messageId || null, batchId);

exports.markReportFailed = (batchId, error) => db.prepare(`
    UPDATE qc_batch_report
    SET status = 'FAILED',
        sending_at = NULL,
        last_error = ?,
        updated_at = datetime('now','localtime')
    WHERE batch_id = ? AND status = 'SENDING'
`).run(String(error?.message || error || "Unknown error").slice(0, 2000), batchId);

exports.buildReport = buildReport;
exports.classifyReject = classifyReject;
