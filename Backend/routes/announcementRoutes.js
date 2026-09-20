const express = require("express");

const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcementController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// 1. POST /api/announcements
// Create announcement (ADMIN / ORGANIZER only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body:
// {
//   "title": "Exam Schedule Released",
//   "message": "Mid-semester exams start from October 5.",
//   "event": null,                                  // optional event ObjectId
//   "targetAudience": "STUDENTS",                   // ALL | STUDENTS | FACULTY | ORGANIZERS
//   "priority": "URGENT",                           // LOW | NORMAL | HIGH | URGENT
//   "isPublished": true,                            // optional, defaults to false
//   "publishAt": "2026-09-25T09:00:00.000Z",        // optional ISO date
//   "expiresAt": "2026-10-15T23:59:59.000Z"         // optional ISO date
// }
//
// Success response (201 Created):
// {
//   "message": "Announcement created successfully",
//   "announcement": {
//     "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//     "title": "Exam Schedule Released",
//     "message": "Mid-semester exams start from October 5.",
//     "createdBy": {
//       "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
//       "name": "Dr. Anil Kumar",
//       "email": "anil@example.com",
//       "role": "ORGANIZER"
//     },
//     "event": null,
//     "targetAudience": "STUDENTS",
//     "priority": "URGENT",
//     "isPublished": true,
//     "publishAt": "2026-09-25T09:00:00.000Z",
//     "expiresAt": "2026-10-15T23:59:59.000Z",
//     "createdAt": "2026-09-20T10:00:00.000Z",
//     "updatedAt": "2026-09-20T10:00:00.000Z"
//   }
// }
//
// Error responses:
//   400 - { "message": "Title is required" }
//   400 - { "message": "targetAudience must be one of: ALL, STUDENTS, FACULTY, ORGANIZERS" }
//   400 - { "message": "priority must be one of: LOW, NORMAL, HIGH, URGENT" }
//   403 - { "message": "Access denied. You do not have permission" }
//   401 - { "message": "Not authorized. Token not provided" }
router.post("/", protect, authorize("ADMIN", "ORGANIZER"), createAnnouncement);


// ============================================================
// 2. GET /api/announcements
// Get all announcements for the logged-in user.
// - Expired announcements are filtered out (expiresAt)
// - Filtered by targetAudience based on the user's role
//   (STUDENT -> ALL + STUDENTS, FACULTY -> ALL + FACULTY,
//    ADMIN / ORGANIZER -> everything)
// - Regular users only see published, live announcements
// - Sorted by priority (URGENT -> HIGH -> NORMAL -> LOW)
//   then by creation date (newest first)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "count": 2,
//   "announcements": [
//     {
//       "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//       "title": "Exam Schedule Released",
//       "message": "Mid-semester exams start from October 5.",
//       "createdBy": { "_id": "...", "name": "Dr. Anil Kumar", "email": "anil@example.com", "role": "ORGANIZER" },
//       "event": null,
//       "targetAudience": "STUDENTS",
//       "priority": "URGENT",
//       "isPublished": true,
//       "publishAt": "2026-09-25T09:00:00.000Z",
//       "expiresAt": "2026-10-15T23:59:59.000Z",
//       "createdAt": "2026-09-20T10:00:00.000Z",
//       "updatedAt": "2026-09-20T10:00:00.000Z"
//     },
//     {
//       "_id": "66f1a2b3c4d5e6f7a8b9c0e2",
//       "title": "Library Timings",
//       "message": "Library is open till 10 PM this week.",
//       "createdBy": { "_id": "...", "name": "Admin", "email": "admin@example.com", "role": "ADMIN" },
//       "event": null,
//       "targetAudience": "ALL",
//       "priority": "NORMAL",
//       "isPublished": true,
//       "publishAt": null,
//       "expiresAt": null,
//       "createdAt": "2026-09-19T14:30:00.000Z",
//       "updatedAt": "2026-09-19T14:30:00.000Z"
//     }
//   ]
// }
//
// Error response:
//   401 - { "message": "Not authorized. Token not provided" }
router.get("/", protect, getAnnouncements);


// ============================================================
// 3. GET /api/announcements/:id
// Get announcement by ID (same visibility rules as the list)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "announcement": {
//     "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//     "title": "Exam Schedule Released",
//     "message": "Mid-semester exams start from October 5.",
//     "createdBy": { "_id": "...", "name": "Dr. Anil Kumar", "email": "anil@example.com", "role": "ORGANIZER" },
//     "event": null,
//     "targetAudience": "STUDENTS",
//     "priority": "URGENT",
//     "isPublished": true,
//     "publishAt": "2026-09-25T09:00:00.000Z",
//     "expiresAt": "2026-10-15T23:59:59.000Z",
//     "createdAt": "2026-09-20T10:00:00.000Z",
//     "updatedAt": "2026-09-20T10:00:00.000Z"
//   }
// }
//
// Error responses:
//   400 - { "message": "Invalid announcement ID format" }
//   404 - { "message": "Announcement not found" }   // also returned when not visible to the user
router.get("/:id", protect, getAnnouncementById);


// ============================================================
// 4. PUT /api/announcements/:id
// Update announcement (ADMIN / ORGANIZER only)
// At least one field may be provided; unlisted fields stay unchanged.
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body (example):
// {
//   "priority": "HIGH",
//   "isPublished": false,
//   "targetAudience": "FACULTY"
// }
//
// Success response (200 OK):
// {
//   "message": "Announcement updated successfully",
//   "announcement": {
//     "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//     "title": "Exam Schedule Released",
//     "message": "Mid-semester exams start from October 5.",
//     "createdBy": { "_id": "...", "name": "Dr. Anil Kumar", "email": "anil@example.com", "role": "ORGANIZER" },
//     "event": null,
//     "targetAudience": "FACULTY",
//     "priority": "HIGH",
//     "isPublished": false,
//     "publishAt": "2026-09-25T09:00:00.000Z",
//     "expiresAt": "2026-10-15T23:59:59.000Z",
//     "createdAt": "2026-09-20T10:00:00.000Z",
//     "updatedAt": "2026-09-20T11:00:00.000Z"
//   }
// }
//
// Error responses:
//   400 - { "message": "priority must be one of: LOW, NORMAL, HIGH, URGENT" }
//   404 - { "message": "Announcement not found" }
//   403 - { "message": "Access denied. You do not have permission" }
router.put("/:id", protect, authorize("ADMIN", "ORGANIZER"), updateAnnouncement);


// ============================================================
// 5. DELETE /api/announcements/:id
// Delete announcement (ADMIN / ORGANIZER only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "message": "Announcement deleted successfully"
// }
//
// Error responses:
//   400 - { "message": "Invalid announcement ID format" }
//   404 - { "message": "Announcement not found" }
//   403 - { "message": "Access denied. You do not have permission" }
router.delete("/:id", protect, authorize("ADMIN", "ORGANIZER"), deleteAnnouncement);


// ============================================================
// Sample test flow (curl)
// ============================================================
// 1. Login to get a token:
//    curl -X POST http://localhost:5000/api/auth/login \
//      -H "Content-Type: application/json" \
//      -d '{ "email": "organizer@example.com", "password": "yourpassword" }'
//
// 2. Create an announcement (as organizer/admin):
//    curl -X POST http://localhost:5000/api/announcements \
//      -H "Authorization: Bearer <TOKEN>" \
//      -H "Content-Type: application/json" \
//      -d '{ "title": "Hackathon Registrations Live", "message": "Register before Sept 30!", "targetAudience": "ALL", "priority": "URGENT", "isPublished": true }'
//
// 3. Get all announcements visible to the logged-in user:
//    curl http://localhost:5000/api/announcements \
//      -H "Authorization: Bearer <TOKEN>"
//
// 4. Get announcement by ID:
//    curl http://localhost:5000/api/announcements/66f1a2b3c4d5e6f7a8b9c0e1 \
//      -H "Authorization: Bearer <TOKEN>"
//
// 5. Update an announcement:
//    curl -X PUT http://localhost:5000/api/announcements/66f1a2b3c4d5e6f7a8b9c0e1 \
//      -H "Authorization: Bearer <TOKEN>" \
//      -H "Content-Type: application/json" \
//      -d '{ "priority": "HIGH" }'
//
// 6. Delete an announcement:
//    curl -X DELETE http://localhost:5000/api/announcements/66f1a2b3c4d5e6f7a8b9c0e1 \
//      -H "Authorization: Bearer <TOKEN>"


module.exports = router;