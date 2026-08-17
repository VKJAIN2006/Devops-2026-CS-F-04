const express = require("express");

const {
  markAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance
} = require("../controllers/attendanceController");

const router = express.Router();


// Mark attendance
router.post("/", markAttendance);


// Get all attendance
router.get("/", getAttendance);


// Get attendance by ID
router.get("/:id", getAttendanceById);


// Update attendance
router.put("/:id", updateAttendance);


module.exports = router;