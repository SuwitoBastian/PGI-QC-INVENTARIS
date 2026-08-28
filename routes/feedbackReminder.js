const express = require("express");

const router = express.Router();

const {
    getSocket
} = require("../whatsapp/baileys/socket");


// ==========================================================
// TEST ROUTE
// ==========================================================

router.get("/", (req, res) => {

    return res.json({

        ok: true,

        message:
            "Feedback reminder route aktif"

    });

});


// ==========================================================
// SEND FEEDBACK REMINDER
// ==========================================================

router.post("/", async (req, res) => {

    try {

        /* ==================================================
           Authorization
        ================================================== */

        const auth =
            req.headers.authorization || "";

        const expected =
            `Bearer ${process.env.FEEDBACK_REMINDER_SECRET}`;


        if (auth !== expected) {

            return res.status(401).json({

                ok: false,

                message:
                    "Unauthorized"

            });

        }


        /* ==================================================
           Request Body
        ================================================== */

        const {
            chatId,
            message
        } = req.body;


        if (!chatId) {

            return res.status(400).json({

                ok: false,

                message:
                    "chatId wajib diisi"

            });

        }


        if (!message) {

            return res.status(400).json({

                ok: false,

                message:
                    "message wajib diisi"

            });

        }


        /* ==================================================
           Get Baileys Socket
        ================================================== */

        const sock =
            getSocket();


        if (!sock) {

            return res.status(503).json({

                ok: false,

                message:
                    "WhatsApp socket belum tersedia"

            });

        }


        /* ==================================================
           Send WhatsApp Message
        ================================================== */

        await sock.sendMessage(

            chatId,

            {
                text: message
            }

        );


        console.log(
            `🔔 Feedback reminder terkirim → ${chatId}`
        );


        return res.json({

            ok: true,

            message:
                "Feedback reminder berhasil dikirim"

        });


    } catch (err) {

        console.error(
            "❌ Feedback reminder gagal:"
        );

        console.error(
            err
        );


        return res.status(500).json({

            ok: false,

            message:
                "Gagal mengirim feedback reminder"

        });

    }

});


module.exports = router;