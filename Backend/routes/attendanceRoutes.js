const express = require("express");

const {
  markAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance
} = require("../controllers/attendanceController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// Mark attendance
// Organizer/Admin only
router.post(
  "/",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  markAttendance
);


// Get all attendance
// Organizer/Admin only
router.get(
  "/",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  getAttendance
);


// Get attendance by ID
// Organizer/Admin only
router.get(
  "/:id",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  getAttendanceById
);


// Update attendance
// Organizer/Admin only
router.put(
  "/:id",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  updateAttendance
);


module.exports = router;