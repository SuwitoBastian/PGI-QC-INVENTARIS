exports.parseQCMessage = (text) => {

    if (!text) {
        return {
            success: false,
            message: "Format pesan kosong."
        };
    }

    const lines = text
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return {
            success: false,
            message: "Format pesan kosong."
        };
    }

    const firstLine = lines[0].toLowerCase();

    let status = "";
    let rejectReason = "";

    // =========================================
    // DATA QC
    // =========================================

    const qc = {
        nama: null,
        ssd: null,
        sh: null,
        bh: null
    };

    // =========================================
    // FORMAT #DONE
    // =========================================

    if (firstLine === "#done" || firstLine.startsWith("#done ")) {

        status = "DONE";

        // Semua baris setelah #done dianggap
        // sebagai data QC jika menggunakan format:
        // nama: ...
        // ssd: ...
        // sh: ...
        // bh: ...

        for (const line of lines.slice(1)) {

            const separatorIndex = line.indexOf(":");

            // Tidak ada ":" → abaikan
            if (separatorIndex === -1) {
                continue;
            }

            const key = line
                .substring(0, separatorIndex)
                .trim()
                .toLowerCase();

            const value = line
                .substring(separatorIndex + 1)
                .trim();

            // Value kosong → abaikan
            if (!value) {
                continue;
            }

            switch (key) {

                case "nama":
                    qc.nama = value;
                    break;

                case "ssd":
                    qc.ssd = value;
                    break;

                case "sh":
                    qc.sh = value;
                    break;

                case "bh":
                    qc.bh = value;
                    break;

            }
        }
    }

    // =========================================
    // FORMAT #REJECT
    // =========================================

    else if (
        firstLine === "#reject" ||
        firstLine.startsWith("#reject ")
    ) {

        status = "REJECT";

        rejectReason = firstLine
            .replace(/^#reject/i, "")
            .trim();

        if (!rejectReason && lines.length > 1) {

            rejectReason = lines
                .slice(1)
                .join(" ")
                .trim();

        }
    }

    // =========================================
    // FORMAT LAMA #QC
    // TETAP DIPERTAHANKAN
    // =========================================

    else if (lines[0].toUpperCase() === "#QC") {

        for (const line of lines) {

            const upper = line.toUpperCase();

            if (upper.startsWith("STATUS:")) {

                status = line
                    .substring(7)
                    .trim()
                    .toUpperCase();

            }

            if (upper.startsWith("ALASAN:")) {

                rejectReason = line
                    .substring(8)
                    .trim();

            }
        }
    }

    // =========================================
    // FORMAT TIDAK DIKENALI
    // =========================================

    else {

        return null;

    }

    // =========================================
    // VALIDASI STATUS
    // =========================================

    if (!["DONE", "REJECT"].includes(status)) {

        return {
            success: false,
            message:
`❌ FORMAT TIDAK DIKENALI

Gunakan:

#done

atau

#reject
LCD Pecah`
        };

    }

    // =========================================
    // VALIDASI REJECT
    // =========================================

    if (status === "REJECT" && rejectReason === "") {

        return {
            success: false,
            message:
`⚠️ REJECT MEMBUTUHKAN ALASAN

Contoh:

#reject
LCD Pecah`
        };

    }

    // =========================================
    // RETURN
    // =========================================

    return {
        success: true,
        status,
        rejectReason,

        // Data QC
        qc
    };

};