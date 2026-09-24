const express = require("express");

const {
  markAttendance,
  getMyAttendance,
  getAttendance,
  getAttendanceById,
  getQRTicket,
  verifyQRAttendance,
  updateAttendance
} = require("../controllers/attendanceController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// Attendance Routes
//
// Authorization matrix:
//   POST  /             FACULTY / ORGANIZER / ADMIN  (mark attendance)
//   GET   /my           any authenticated user (own records only)
//   GET   /             ADMIN (all) / ORGANIZER (own events only)
//   GET   /qr/:eventId  any authenticated user (own QR ticket)
//   POST  /verify       FACULTY / ORGANIZER / ADMIN (scan QR, staff only)
//   GET   /:id          record owner / ADMIN / authorized event staff
//   PUT   /:id          FACULTY / ORGANIZER / ADMIN (authorized staff)
//
// Staff scope is enforced in the controller:
//   ADMIN     -> all events
//   ORGANIZER -> events they organize
//   FACULTY   -> events of their own department
// Attendance can only be marked while the event is in progress
// (within a 1 hour grace period after it ends).
// ============================================================


// Mark attendance (staff / admin)
router.post(
  "/",
  protect,
  authorize("FACULTY", "ORGANIZER", "ADMIN"),
  markAttendance
);


// Get logged-in user's own attendance
// IMPORTANT: This must come before "/:id"
router.get(
  "/my",
  protect,
  getMyAttendance
);


// Get all attendance - Admin (all) / Organizer (own events)
router.get(
  "/",
  protect,
  authorize("ADMIN", "ORGANIZER"),
  getAttendance
);


// Generate a QR ticket for the logged-in user + event
router.get(
  "/qr/:eventId",
  protect,
  getQRTicket
);


// Verify a QR ticket and mark attendance (staff scan)
router.post(
  "/verify",
  protect,
  authorize("FACULTY", "ORGANIZER", "ADMIN"),
  verifyQRAttendance
);


// Get attendance by ID - owner / authorized staff / admin
router.get(
  "/:id",
  protect,
  getAttendanceById
);


// Update attendance - authorized staff / admin (audited)
router.put(
  "/:id",
  protect,
  authorize("FACULTY", "ORGANIZER", "ADMIN"),
  updateAttendance
);


module.exports = router;