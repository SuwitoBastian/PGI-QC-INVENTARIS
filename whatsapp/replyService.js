exports.success = async (msg, item, status) => {

    const text =
`✅ *QC BERHASIL*

📦 *Barang*
${item.merk} ${item.type}

🔢 *NF*
${item.nf}

📋 *Status*
${status}

Data inventaris berhasil diperbarui.`;

    await msg.reply(text);

};


exports.reject = async (msg, item, reason) => {

    const text =
`⚠️ *QC REJECT BERHASIL*

📦 *Barang*
${item.merk} ${item.type}

🔢 *NF*
${item.nf}

📋 *Status*
REJECT

📝 *Alasan*
${reason}

Data inventaris berhasil diperbarui.`;

    await msg.reply(text);

};


exports.notFound = async (msg, nf) => {

    const text =
`⚠️ *QC GAGAL*

Nomor inventaris berhasil dibaca.

🔢 *NF*
${nf}

Namun nomor tersebut tidak ditemukan pada database.

Silakan hubungi Admin IT.`;

    await msg.reply(text);

};


exports.ocrFailed = async (msg) => {

    const text =
`❌ *QC GAGAL*

Nomor inventaris tidak dapat dibaca.

Silakan foto ulang dengan:

• Dekatkan kamera ke label
• Pastikan tidak blur
• Pastikan nomor NF terlihat jelas`;

    await msg.reply(text);

};