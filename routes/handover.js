const express = require("express");

const router = express.Router();

const handoverController =
    require("../controllers/handoverController");


// =====================================================
// CREATE GA → IT HANDOVER
// =====================================================

router.post(
    "/ga-to-it",
    handoverController.createGaToIt
);


// =====================================================
// CREATE IT → GA HANDOVER
// =====================================================

router.post(
    "/it-to-ga",
    handoverController.createItToGa
);


// =====================================================
// GET ACTIVE DIGITAL SIGNATURE
// Digunakan untuk form IT → GA
// =====================================================

router.get(
    "/signatures",
    handoverController.getActiveSignatures
);


// =====================================================
// GET HANDOVER BY BATCH
// =====================================================

router.get(
    "/batch/:batchId",
    handoverController.getByBatch
);


// =====================================================
// GET HANDOVER STATUS BY BATCH
// GA → IT
// =====================================================

router.get(
    "/batch/:batchId/status",
    handoverController.getStatusByBatch
);


// =====================================================
// GET IT → GA STATUS BY BATCH
// =====================================================

router.get(
    "/batch/:batchId/it-to-ga/status",
    handoverController.getItToGaStatusByBatch
);


// =====================================================
// VIEW HANDOVER PDF
// =====================================================

router.get(
    "/:handoverId/pdf",
    handoverController.getPdf
);


// =====================================================
// APPROVE GA → IT HANDOVER
// =====================================================

router.post(
    "/ga-to-it/:handoverId/approve",
    handoverController.approveGaToIt
);


// =====================================================
// APPROVE IT → GA HANDOVER
// =====================================================

router.post(
    "/it-to-ga/:handoverId/approve",
    handoverController.approveItToGa
);


module.exports = router;