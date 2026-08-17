const express = require("express");

const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  cancelRegistration
} = require("../controllers/registrationController");

const router = express.Router();


// Register for an event
router.post("/", createRegistration);


// Get all registrations
router.get("/", getRegistrations);


// Get registration by ID
router.get("/:id", getRegistrationById);


// Cancel registration
router.put("/:id/cancel", cancelRegistration);


module.exports = router;