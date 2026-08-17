const express = require("express");

const {
  createCertificate,
  getCertificates,
  getCertificateById,
  verifyCertificate
} = require("../controllers/certificateController");

const router = express.Router();


// Generate certificate
router.post("/", createCertificate);


// Get all certificates
router.get("/", getCertificates);


// Get certificate by ID
router.get("/:id", getCertificateById);


// Verify certificate
router.get(
  "/verify/:certificateNumber",
  verifyCertificate
);


module.exports = router;