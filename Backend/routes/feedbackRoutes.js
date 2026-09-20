const express = require("express");

const {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback
} = require("../controllers/feedbackController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// 1. POST /api/feedback
// Create feedback (only users with PRESENT attendance)
// One feedback per user per event
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body:
// {
//   "event": "65f1a2b3c4d5e6f7a8b9c0d1",
//   "rating": 5,
//   "comment": "Amazing event, well organized!",
//   "isAnonymous": false
// }
//
// Success response (201 Created):
// {
//   "message": "Feedback submitted successfully",
//   "feedback": {
//     "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//     "user": {
//       "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
//       "name": "John Doe",
//       "email": "john@example.com",
//       "role": "STUDENT"
//     },
//     "event": {
//       "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
//       "title": "Tech Fest 2026",
//       "category": "TECHNICAL"
//     },
//     "rating": 5,
//     "comment": "Amazing event, well organized!",
//     "isAnonymous": false,
//     "createdAt": "2026-09-20T10:00:00.000Z",
//     "updatedAt": "2026-09-20T10:00:00.000Z"
//   }
// }
//
// Error responses:
//   400 - { "message": "Only participants who attended the event can submit feedback" }
//   400 - { "message": "Feedback has already been submitted for this event" }
//   400 - { "message": "Rating must be an integer between 1 and 5" }
//   400 - { "message": "Invalid event ID format" }
//   404 - { "message": "Event not found" }
//   401 - { "message": "Not authorized. Token not provided" }
router.post("/", protect, createFeedback);


// ============================================================
// 2. GET /api/feedback
// Get all feedback (ADMIN / ORGANIZER only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "count": 2,
//   "feedback": [
//     {
//       "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//       "user": {
//         "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
//         "name": "John Doe",
//         "email": "john@example.com",
//         "role": "STUDENT"
//       },
//       "event": {
//         "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
//         "title": "Tech Fest 2026",
//         "category": "TECHNICAL"
//       },
//       "rating": 5,
//       "comment": "Amazing event, well organized!",
//       "isAnonymous": false,
//       "createdAt": "2026-09-20T10:00:00.000Z",
//       "updatedAt": "2026-09-20T10:00:00.000Z"
//     },
//     {
//       "_id": "66f1a2b3c4d5e6f7a8b9c0e2",
//       "user": null,                                    // masked - anonymous feedback
//       "event": {
//         "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
//         "title": "Hackathon 2026",
//         "category": "HACKATHON"
//       },
//       "rating": 4,
//       "comment": "Great experience!",
//       "isAnonymous": true,
//       "createdAt": "2026-09-21T11:30:00.000Z",
//       "updatedAt": "2026-09-21T11:30:00.000Z"
//     }
//   ]
// }
//
// Error response:
//   403 - { "message": "Access denied. You do not have permission" }
//   401 - { "message": "Not authorized. Token not provided" }
router.get("/", protect, authorize("ADMIN", "ORGANIZER"), getFeedback);


// ============================================================
// 3. GET /api/feedback/:id
// Get feedback by ID (owner, ADMIN, or ORGANIZER only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "feedback": {
//     "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//     "user": null,                    // masked when isAnonymous is true
//     "event": {
//       "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
//       "title": "Tech Fest 2026",
//       "category": "TECHNICAL"
//     },
//     "rating": 5,
//     "comment": "Amazing event, well organized!",
//     "isAnonymous": true,
//     "createdAt": "2026-09-20T10:00:00.000Z",
//     "updatedAt": "2026-09-20T10:00:00.000Z"
//   }
// }
//
// Error responses:
//   400 - { "message": "Invalid feedback ID format" }
//   404 - { "message": "Feedback not found" }
//   403 - { "message": "Access denied. You can only view your own feedback" }
router.get("/:id", protect, getFeedbackById);


// ============================================================
// 4. PUT /api/feedback/:id
// Update feedback (owner or ADMIN only)
// At least one of rating / comment / isAnonymous may be provided.
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body (example - update rating only):
// {
//   "rating": 4
// }
//
// Request body (example - make feedback anonymous):
// {
//   "isAnonymous": true
// }
//
// Success response (200 OK):
// {
//   "message": "Feedback updated successfully",
//   "feedback": {
//     "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//     "user": {
//       "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
//       "name": "John Doe",
//       "email": "john@example.com",
//       "role": "STUDENT"
//     },
//     "event": {
//       "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
//       "title": "Tech Fest 2026",
//       "category": "TECHNICAL"
//     },
//     "rating": 4,
//     "comment": "Amazing event, well organized!",
//     "isAnonymous": true,
//     "createdAt": "2026-09-20T10:00:00.000Z",
//     "updatedAt": "2026-09-20T11:00:00.000Z"
//   }
// }
//
// Error responses:
//   400 - { "message": "Rating must be an integer between 1 and 5" }
//   404 - { "message": "Feedback not found" }
//   403 - { "message": "Access denied. You can only update your own feedback" }
router.put("/:id", protect, updateFeedback);


// ============================================================
// 5. DELETE /api/feedback/:id
// Delete feedback (owner or ADMIN only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "message": "Feedback deleted successfully"
// }
//
// Error responses:
//   400 - { "message": "Invalid feedback ID format" }
//   404 - { "message": "Feedback not found" }
//   403 - { "message": "Access denied. You can only delete your own feedback" }
router.delete("/:id", protect, deleteFeedback);


// ============================================================
// Sample test flow (curl)
// ============================================================
// 1. Login to get a token:
//    curl -X POST http://localhost:5000/api/auth/login \
//      -H "Content-Type: application/json" \
//      -d '{ "email": "john@example.com", "password": "yourpassword" }'
//
// 2. Submit feedback:
//    curl -X POST http://localhost:5000/api/feedback \
//      -H "Authorization: Bearer <TOKEN>" \
//      -H "Content-Type: application/json" \
//      -d '{ "event": "65f1a2b3c4d5e6f7a8b9c0d1", "rating": 5, "comment": "Great event!", "isAnonymous": false }'
//
// 3. Get all feedback:
//    curl http://localhost:5000/api/feedback \
//      -H "Authorization: Bearer <ADMIN_OR_ORGANIZER_TOKEN>"
//
// 4. Get feedback by ID:
//    curl http://localhost:5000/api/feedback/66f1a2b3c4d5e6f7a8b9c0e1 \
//      -H "Authorization: Bearer <TOKEN>"
//
// 5. Update feedback:
//    curl -X PUT http://localhost:5000/api/feedback/66f1a2b3c4d5e6f7a8b9c0e1 \
//      -H "Authorization: Bearer <TOKEN>" \
//      -H "Content-Type: application/json" \
//      -d '{ "rating": 4, "isAnonymous": true }'
//
// 6. Delete feedback:
//    curl -X DELETE http://localhost:5000/api/feedback/66f1a2b3c4d5e6f7a8b9c0e1 \
//      -H "Authorization: Bearer <TOKEN>"


module.exports = router;