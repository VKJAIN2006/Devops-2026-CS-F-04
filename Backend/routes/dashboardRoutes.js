const express = require("express");

const {
  getAdminDashboard,
  getStudentDashboard,
  getOrganizerDashboard,
  getFacultyDashboard
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// Admin Dashboard
// ==========================================
router.get(
  "/admin",
  protect,
  authorize("ADMIN"),
  getAdminDashboard
);


// ==========================================
// Student Dashboard
// ==========================================
router.get(
  "/student",
  protect,
  authorize("STUDENT"),
  getStudentDashboard
);


// ==========================================
// Organizer Dashboard
// ==========================================
router.get(
  "/organizer",
  protect,
  authorize("ORGANIZER"),
  getOrganizerDashboard
);


// ==========================================
// Faculty Dashboard
// ==========================================
router.get(
  "/faculty",
  protect,
  authorize("FACULTY"),
  getFacultyDashboard
);


module.exports = router;