const express = require("express");

const {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue
} = require("../controllers/venueController");

const router = express.Router();


// Create venue
router.post("/", createVenue);


// Get all venues
router.get("/", getVenues);


// Get single venue
router.get("/:id", getVenueById);


// Update venue
router.put("/:id", updateVenue);


// Delete venue
router.delete("/:id", deleteVenue);


module.exports = router;