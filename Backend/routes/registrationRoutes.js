const express = require("express");

const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  getEventRegistrations,
  cancelRegistration,
  getMyRegistrations
} = require("../controllers/registrationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// Registration Routes
//
// Authorization matrix:
//   POST  /                     any authenticated user
//                                (role eligibility enforced in controller via Event.allowedRoles; ADMIN bypass)
//   GET   /my                   any authenticated user (own registrations only)
//   GET   /                     ADMIN only
//   GET   /event/:eventId       ADMIN or owning ORGANIZER
//   GET   /:id                  owner or ADMIN
//   PUT   /:id/cancel           owner or ADMIN (ownership + date rules enforced in controller)
// ============================================================


// Register for an event
router.post(
  "/",
  protect,
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


// Get registrations for a specific event - Admin or event's organizer
router.get(
  "/event/:eventId",
  protect,
  authorize("ADMIN", "ORGANIZER"),
  getEventRegistrations
);


// Get registration by ID - owner or admin (ownership checked in controller)
router.get(
  "/:id",
  protect,
  getRegistrationById
);


// Cancel registration - owner or admin (ownership checked in controller)
router.put(
  "/:id/cancel",
  protect,
  cancelRegistration
);


module.exports = router;