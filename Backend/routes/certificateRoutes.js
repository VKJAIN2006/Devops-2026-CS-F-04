const express = require("express");

const {
  createCertificate,
  getMyCertificates,
  getCertificates,
  getCertificateById,
  verifyCertificate,
  revokeCertificate
} = require("../controllers/certificateController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// Certificate Routes
//
// Authorization matrix:
//   POST  /                         ADMIN / owning ORGANIZER (issue)
//   GET   /                         ADMIN (all) / ORGANIZER (own events)
//   GET   /my                       any authenticated user (own certificates)
//   GET   /verify/:certNumber       PUBLIC (intended verification)
//   GET   /:id                      certificate owner / ADMIN / owning ORGANIZER
//   PUT   /:id/revoke               ADMIN / owning ORGANIZER
//
// Issuance additionally requires: open event, confirmed registration,
// PRESENT attendance, one active cert per user+event, valid type/URL.
// ============================================================


// Generate a certificate - Admin / event organizer only
router.post(
  "/",
  protect,
  authorize("ADMIN", "ORGANIZER"),
  createCertificate
);


// Get all certificates - Admin / event organizer (scoped in controller)
router.get(
  "/",
  protect,
  authorize("ADMIN", "ORGANIZER"),
  getCertificates
);


// Get logged-in user's own certificates
// IMPORTANT: This must come before "/:id"
router.get(
  "/my",
  protect,
  getMyCertificates
);


// Verify a certificate - public (intended)
router.get(
  "/verify/:certificateNumber",
  verifyCertificate
);


// Get certificate by ID - owner / authorized staff / admin
router.get(
  "/:id",
  protect,
  getCertificateById
);


// Revoke a certificate - Admin / event organizer
router.put(
  "/:id/revoke",
  protect,
  authorize("ADMIN", "ORGANIZER"),
  revokeCertificate
);


module.exports = router;