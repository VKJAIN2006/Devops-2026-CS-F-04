const crypto = require("crypto");
const mongoose = require("mongoose");
const Certificate = require("../database/Certificate");
const User = require("../database/User");
const Event = require("../database/Event");
const Attendance = require("../database/Attendance");
const Registration = require("../database/Registration");


// ============================================================
// Constants & helpers
// ============================================================

const VALID_TYPES = [
  "PARTICIPATION",
  "WINNER",
  "RUNNER_UP",
  "VOLUNTEER",
  "ORGANIZER"
];

// Certificates may only be generated for events that actually ran
// or are running. DRAFT / PENDING_APPROVAL / APPROVED / CANCELLED /
// REJECTED events can never issue certificates.
const ISSUABLE_EVENT_STATUSES = ["PUBLISHED", "ONGOING", "COMPLETED"];

// Un-guessable certificate number: CURT- + 24 hex chars (96 bits)
const generateCertificateNumber = () =>
  "CERT-" + crypto.randomBytes(12).toString("hex").toUpperCase();

// HMAC over the number - lets verification detect corrupted/forged
// values stored in the database (defense in depth).
const computeCertificateHash = (certificateNumber) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(certificateNumber)
    .digest("hex");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanString = (value) =>
  typeof value === "string" ? value.trim() : value;

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

// Who may manage certificates for a given event (staff scope).
const canManageEvent = (user, event) => {
  if (user.role === "ADMIN") {
    return true;
  }
  if (user.role === "ORGANIZER") {
    return (
      event.organizer &&
      event.organizer.toString() === user._id.toString()
    );
  }
  return false;
};


// ============================================================
// Generate a certificate
// Route: POST /api/certificates  (ADMIN / owning ORGANIZER)
// Requires: user, event, confirmed registration + PRESENT attendance,
// no existing active certificate, open event, valid type/URL.
// ============================================================
const createCertificate = async (req, res) => {
  try {
    const user = cleanString(req.body.user);
    const event = cleanString(req.body.event);
    const certificateType = cleanString(req.body.certificateType);
    const certificateUrl = cleanString(req.body.certificateUrl);

    // 1. Required fields + format
    if (!user || !event) {
      return res.status(400).json({
        message: "User and event are required"
      });
    }

    if (!isValidObjectId(user) || !isValidObjectId(event)) {
      return res.status(400).json({
        message: "Invalid user or event ID format"
      });
    }

    // 2. User / event must exist
    const [existingUser, existingEvent] = await Promise.all([
      User.findById(user),
      Event.findById(event)
    ]);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // 3. Event must be issuable (ran / running)
    if (!ISSUABLE_EVENT_STATUSES.includes(existingEvent.status)) {
      return res.status(400).json({
        message: `Certificates cannot be generated. Event is not open (status: ${existingEvent.status})`
      });
    }

    // 4. Only admin or the event's own organizer may issue
    if (!canManageEvent(req.user, existingEvent)) {
      return res.status(403).json({
        message: "Access denied. You can only issue certificates for events you organize"
      });
    }

    // 5. User must have a confirmed registration
    const registration = await Registration.findOne({
      user,
      event,
      status: "REGISTERED"
    });

    if (!registration) {
      return res.status(400).json({
        message: "User is not registered for this event"
      });
    }

    // 6. User must have PRESENT attendance
    const attendance = await Attendance.findOne({
      user,
      event,
      status: "PRESENT"
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Certificate cannot be generated because attendance was not found (must be PRESENT)"
      });
    }

    // 7. One active certificate per user + event (revoked may be re-issued)
    const existingCertificate = await Certificate.findOne({
      user,
      event,
      status: { $ne: "REVOKED" }
    });

    if (existingCertificate) {
      return res.status(400).json({
        message: "Certificate already exists for this user and event"
      });
    }

    // 8. Type must be a known certificate type
    const finalType = certificateType || "PARTICIPATION";

    if (!VALID_TYPES.includes(finalType)) {
      return res.status(400).json({
        message: `certificateType must be one of: ${VALID_TYPES.join(", ")}`
      });
    }

    // 9. certificateUrl must be a valid absolute http(s) URL
    if (certificateUrl && !isValidHttpUrl(certificateUrl)) {
      return res.status(400).json({
        message: "certificateUrl must be a valid absolute http(s) URL"
      });
    }

    // 10. Generate a strong, un-guessable certificate number
    const certificateNumber = generateCertificateNumber();

    // 11. Create certificate
    const certificate = await Certificate.create({
      user,
      event,
      registration: registration._id,
      certificateNumber,
      certificateHash: computeCertificateHash(certificateNumber),
      type: finalType,
      certificateUrl: certificateUrl || null,
      createdBy: req.user._id
    });

    // Populate response
    const populatedCertificate = await Certificate.findById(
      certificate._id
    )
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("createdBy", "name email role");

    res.status(201).json({
      message: "Certificate generated successfully",
      certificate: populatedCertificate
    });

  } catch (error) {
    // Race-condition guard: unique index violation = duplicate
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Certificate already exists for this user and event"
      });
    }

    res.status(500).json({
      message: "Error generating certificate",
      error: error.message
    });
  }
};


// ============================================================
// Get the logged-in user's own certificates
// Route: GET /api/certificates/my
// ============================================================
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      user: req.user._id
    })
      .populate("event", "title category startDate endDate")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: certificates.length,
      certificates
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching your certificates",
      error: error.message
    });
  }
};


// ============================================================
// Get all certificates
// Route: GET /api/certificates  (ADMIN all / ORGANIZER own events)
// ============================================================
const getCertificates = async (req, res) => {
  try {
    let certificates;

    if (req.user.role === "ADMIN") {
      certificates = await Certificate.find();
    } else {
      // ORGANIZER: scope to events they organize
      const ownedEvents = await Event.find({
        organizer: req.user._id
      }).select("_id");

      certificates = await Certificate.find({
        event: { $in: ownedEvents.map((e) => e._id) }
      });
    }

    const populated = await Certificate.populate(certificates, [
      { path: "user", select: "name email role" },
      { path: "event", select: "title category startDate endDate" },
      { path: "createdBy", select: "name email role" }
    ]);

    res.status(200).json({
      count: populated.length,
      certificates: populated
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching certificates",
      error: error.message
    });
  }
};


// ============================================================
// Get certificate by ID
// Route: GET /api/certificates/:id
// Allowed: certificate owner, ADMIN, or the event's own organizer
// ============================================================
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found"
      });
    }

    // Ownership / scope check BEFORE populate
    const isOwner = certificate.user.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "ADMIN") {
      const event = await Event.findById(certificate.event);

      if (!canManageEvent(req.user, event)) {
        return res.status(403).json({
          message: "Access denied. You can only view your own certificates or ones you are authorized for"
        });
      }
    }

    const populatedCertificate = await Certificate.findById(
      certificate._id
    )
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("createdBy", "name email role");

    res.status(200).json({
      certificate: populatedCertificate
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching certificate",
      error: error.message
    });
  }
};


// ============================================================
// Verify a certificate - PUBLIC (intended for third parties)
// Route: GET /api/certificates/verify/:certificateNumber
// Re-checks the HMAC hash (tamper detection) and revoked status.
// ============================================================
const verifyCertificate = async (req, res) => {
  try {
    const certificateNumber = cleanString(req.params.certificateNumber);

    if (!certificateNumber) {
      return res.status(400).json({
        valid: false,
        message: "Certificate number is required"
      });
    }

    const certificate = await Certificate.findOne({
      certificateNumber
    });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found"
      });
    }

    // Tamper detection: recompute HMAC over the number on file
    if (
      !certificate.certificateHash ||
      certificate.certificateHash !== computeCertificateHash(certificateNumber)
    ) {
      return res.status(400).json({
        valid: false,
        message: "Certificate hash mismatch - record is corrupted or forged"
      });
    }

    // Revocation check
    if (certificate.status === "REVOKED") {
      return res.status(200).json({
        valid: false,
        message: "Certificate has been revoked",
        reason: certificate.revocationReason || null,
        revokedAt: certificate.revokedAt
      });
    }

    // Expiry check
    if (certificate.expiresAt && new Date(certificate.expiresAt) < new Date()) {
      return res.status(200).json({
        valid: false,
        message: "Certificate has expired",
        expiredAt: certificate.expiresAt
      });
    }

    const populated = await Certificate.populate(certificate, [
      { path: "user", select: "name email" },
      { path: "event", select: "title category startDate endDate" }
    ]);

    res.status(200).json({
      valid: true,
      message: "Certificate is valid",
      certificate: populated
    });

  } catch (error) {
    res.status(500).json({
      message: "Error verifying certificate",
      error: error.message
    });
  }
};


// ============================================================
// Revoke a certificate
// Route: PUT /api/certificates/:id/revoke  (ADMIN / owning ORGANIZER)
// Revoked certificates fail verification and free the slot so a
// corrected certificate can be re-issued.
// ============================================================
const revokeCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found"
      });
    }

    // Staff scope: admin any, organizer only for own events
    const event = await Event.findById(certificate.event);

    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Access denied. You can only revoke certificates for events you organize"
      });
    }

    if (certificate.status === "REVOKED") {
      return res.status(400).json({
        message: "Certificate is already revoked"
      });
    }

    const reason = cleanString(req.body.reason);

    certificate.status = "REVOKED";
    certificate.revokedAt = new Date();
    certificate.revokedBy = req.user._id;
    certificate.revocationReason = reason || null;

    await certificate.save();

    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate")
      .populate("createdBy", "name email role")
      .populate("revokedBy", "name email role");

    res.status(200).json({
      message: "Certificate revoked successfully",
      certificate: populatedCertificate
    });

  } catch (error) {
    res.status(500).json({
      message: "Error revoking certificate",
      error: error.message
    });
  }
};


module.exports = {
  createCertificate,
  getMyCertificates,
  getCertificates,
  getCertificateById,
  verifyCertificate,
  revokeCertificate
};