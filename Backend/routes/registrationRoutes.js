const express = require("express");

const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  cancelRegistration,
  getMyRegistrations
} = require("../controllers/registrationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// Register for an event
router.post(
  "/",
  protect,
  authorize("STUDENT", "ADMIN"),
  createRegistration
);


// Get logged-in user's registrations
// IMPORTANT: This must come before "/:id"
router.get(
  "/my",
  protect,
  getMyRegistrations
);


// Get all registrations - Admin only
router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getRegistrations
);


// Get registration by ID - Admin only
router.get(
  "/:id",
  protect,
  authorize("ADMIN"),
  getRegistrationById
);


router.put(
  "/:id/cancel",
  protect,
  authorize("STUDENT", "ADMIN"),
  cancelRegistration
);


module.exports = router;