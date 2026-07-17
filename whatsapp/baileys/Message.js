const { getSocket } = require("./socket");

class Message {

    constructor(raw) {

        this.raw = raw;
        this.sock = getSocket();

        this.id = raw.key.id;

        this.from =
            raw.key.remoteJid;

        this.to =
            raw.key.remoteJid;

        this.fromMe =
            raw.key.fromMe;

        this.timestamp =
            Number(raw.messageTimestamp);

        this.body =
            this.#extractBody(raw);

        this.pushName =
            raw.pushName || null;

        this.chatId =
            raw.key.remoteJid;

        this.participant =
            raw.key.participant ||
            raw.key.remoteJid;

        this.isGroup =
            this.from?.endsWith("@g.us") || false;

        // Digunakan oleh messageRouter QC
        this.hasMedia =
            this.#hasMedia(raw);

        // Compatibility layer
        // supaya kode lama yang memakai
        // msg.client.sendMessage() tetap berjalan
        this.client = this.sock;
    }


    #extractBody(raw) {

        const msg = raw.message;

        if (!msg)
            return "";

        return (
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            ""
        );

    }


    #hasMedia(raw) {

        const msg = raw.message;

        if (!msg)
            return false;

        return !!(
            msg.imageMessage ||
            msg.videoMessage ||
            msg.documentMessage
        );

    }

    async reply(text) {

        const targetJid =
            this.raw.key.remoteJidAlt ||
            this.from;

        return await this.sock.sendMessage(
            targetJid,
            {
                text
            }
        );

    }

}

module.exports = Message;