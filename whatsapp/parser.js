exports.parseQCMessage = (text) => {

    if (!text) {

        return {
            success: false,
            message: "Format pesan kosong."
        };

    }

    const lines = text
        .split("\n")
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

    // ==========================
    // FORMAT BARU
    // ==========================

    if (firstLine.startsWith("#done")) {

        status = "DONE";

    }

    else if (firstLine.startsWith("#reject")) {

        status = "REJECT";

        rejectReason = firstLine
            .replace("#reject", "")
            .trim();

        if (!rejectReason && lines.length > 1) {

            rejectReason = lines
                .slice(1)
                .join(" ")
                .trim();

        }

    }

    // ==========================
    // FORMAT LAMA (KOMPATIBEL)
    // ==========================

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

    else {

        return null;

    }

    // ==========================
    // VALIDASI
    // ==========================

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

    return {

        success: true,

        status,

        rejectReason

    };

};