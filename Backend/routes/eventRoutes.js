const express = require("express");

const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventStatistics
} = require("../controllers/eventController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// =========================
// Public routes
// =========================

// Get all events
router.get("/", getEvents);

// Get event statistics
router.get(
  "/:id/statistics",
  protect,
  authorize("ADMIN", "ORGANIZER", "FACULTY"),
  getEventStatistics
);

// Get single event
router.get("/:id", getEventById);


// =========================
// Protected routes
// =========================

// Create event
// Only ORGANIZER and ADMIN
router.post(
  "/",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  createEvent
);


// Update event
// Only ORGANIZER and ADMIN
router.put(
  "/:id",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  updateEvent
);


// Delete event
// Only ADMIN
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteEvent
);


module.exports = router;