const express = require("express");

const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require("../controllers/eventController");

const router = express.Router();


// Create event
router.post("/", createEvent);


// Get all events
router.get("/", getEvents);


// Get single event
router.get("/:id", getEventById);


// Update event
router.put("/:id", updateEvent);


// Delete event
router.delete("/:id", deleteEvent);


module.exports = router;