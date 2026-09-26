const express = require("express");

const {
  createEvent,
  getEvents,
  getManageEvents,
  getEventById,
  updateEvent,
  submitEvent,
  approveEvent,
  rejectEvent,
  publishEvent,
  deleteEvent
} = require("../controllers/eventController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// Role / permission matrix
// ============================================================
// ------------------------------------------------------------
// Endpoint                    | Access                        | Notes
// ------------------------------------------------------------
// GET /                       | PUBLIC                        | No auth required
// GET /:id                    | PUBLIC                        | No auth required
// POST /                      | ORGANIZER, ADMIN              | Creator = JWT user; event starts as DRAFT
// PUT /:id                    | ORGANIZER (owner) or ADMIN    | organizer/status/approval are protected fields
// PUT /:id/submit             | ORGANIZER (owner) or ADMIN    | DRAFT/REJECTED -> PENDING_APPROVAL
// PUT /:id/approve            | ADMIN only                    | PENDING_APPROVAL -> APPROVED
// PUT /:id/reject             | ADMIN only                    | PENDING_APPROVAL -> REJECTED (+ comment)
// PUT /:id/publish            | ORGANIZER (owner) or ADMIN    | APPROVED -> PUBLISHED (never w/o approval)
// DELETE /:id                 | ADMIN only                    |
// ------------------------------------------------------------
//
// Approval workflow:
//      DRAFT  --submit-->  PENDING_APPROVAL  --approve-->  APPROVED  --publish-->  PUBLISHED
//                              |  \--reject-->  REJECTED  --resubmit (submit)--> PENDING_APPROVAL
//                              |
//                  (status cannot be changed to PUBLISHED without approval)
// ============================================================


// ============================================================
// 1. GET /api/events - PUBLIC
// Get all events (no authentication required)
// ============================================================
// Success response (200 OK):
// {
//   "count": 1,
//   "events": [
//     {
//       "_id": "66f1a2b3c4d5e6f7a8b9c0e1",
//       "title": "Tech Fest 2026",
//       "description": "Annual technical festival",
//       "category": "TECHNICAL",
//       "organizer": { "_id": "...", "name": "Anil Kumar", "email": "anil@example.com", "role": "ORGANIZER" },
//       "department": { "_id": "...", "name": "Computer Science", "code": "CSE" },
//       "venue": { "_id": "...", "name": "Main Auditorium", "building": "Main Block", "capacity": 200 },
//       "startDate": "2026-10-05T09:00:00.000Z",
//       "endDate": "2026-10-07T17:00:00.000Z",
//       "registrationStart": "2026-09-01T00:00:00.000Z",
//       "registrationEnd": "2026-09-30T23:59:59.000Z",
//       "maxParticipants": 150,
//       "registrationRequired": true,
//       "eligibility": "All Students",
//       "status": "PUBLISHED",
//       "approval": {
//         "status": "APPROVED",
//         "reviewedBy": "...",
//         "reviewedAt": "2026-09-15T10:00:00.000Z",
//         "comment": null
//       },
//       "image": null,
//       "createdAt": "2026-09-10T10:00:00.000Z",
//       "updatedAt": "2026-09-15T10:00:00.000Z"
//     }
//   ]
// }
router.get("/", getEvents);

// Management listing: ORGANIZER sees their own events; ADMIN sees all.
router.get("/manage", protect, authorize("ORGANIZER", "ADMIN"), getManageEvents);


// ============================================================
// 2. GET /api/events/:id - PUBLIC
// Get a single event (no authentication required)
// ============================================================
// Success response (200 OK):
// { "event": { ... same shape as above ... } }
//
// Error responses:
//   400 - { "message": "Invalid event ID format" }
//   404 - { "message": "Event not found" }
router.get("/:id", getEventById);


// ============================================================
// 3. POST /api/events
// Create event (ORGANIZER / ADMIN only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body:
// {
//   "title": "Hackathon 2026",
//   "description": "48 hour coding challenge",
//   "category": "HACKATHON",
//   "department": "65f1a2b3c4d5e6f7a8b9c0d1",
//   "venue": "65f1a2b3c4d5e6f7a8b9c0d2",
//   "startDate": "2026-11-10T09:00:00.000Z",
//   "endDate": "2026-11-12T18:00:00.000Z",
//   "registrationStart": "2026-10-01T00:00:00.000Z",
//   "registrationEnd": "2026-11-05T23:59:59.000Z",
//   "maxParticipants": 100,
//   "registrationRequired": true,
//   "eligibility": "All Students",
//   "image": null
// }
//
// Note: organizer is always the authenticated user; status defaults to DRAFT.
//
// Success response (201 Created):
// {
//   "message": "Event created successfully (status: DRAFT, submit for approval to publish)",
//   "event": { "_id": "...", "title": "Hackathon 2026", "...": "...", "status": "DRAFT" }
// }
//
// Error responses:
//   400 - { "message": "Title is required" }
//   400 - { "message": "startDate must be before endDate" }
//   400 - { "message": "registrationStart must be before registrationEnd" }
//   400 - { "message": "maxParticipants (100) cannot exceed venue capacity (50)" }
//   404 - { "message": "Venue not found" }
//   403 - { "message": "Access denied. You do not have permission" }
router.post(
  "/",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  createEvent
);


// ============================================================
// 4. PUT /api/events/:id
// Update event (OWNER ORGANIZER or ADMIN only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body (example):
// {
//   "title": "Hackathon 2026 - Final Round",
//   "maxParticipants": 80
// }
//
// Field-level access control:
//   - organizer, status, approval CANNOT be changed here.
//   - To move through the workflow use: /submit, /approve, /reject, /publish
//
// Success response (200 OK):
// {
//   "message": "Event updated successfully",
//   "event": { ... updated event ... }
// }
//
// Error responses:
//   403 - { "message": "Access denied. Only the event organizer or an ADMIN can update this event" }
//   400 - { "message": "Field 'status' cannot be changed directly. Use the approval workflow endpoints." }
//   400 - { "message": "startDate must be before endDate" }
//   400 - { "message": "maxParticipants (80) cannot exceed venue capacity (50)" }
//   404 - { "message": "Event not found" }
router.put(
  "/:id",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  updateEvent
);


// ============================================================
// 5. PUT /api/events/:id/submit
// Submit event for approval (OWNER ORGANIZER or ADMIN)
// DRAFT or REJECTED -> PENDING_APPROVAL
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "message": "Event submitted for approval",
//   "event": { "...": "...", "status": "PENDING_APPROVAL", "approval": { "status": "PENDING", "reviewedBy": null, "reviewedAt": null, "comment": null } }
// }
//
// Error responses:
//   403 - { "message": "Access denied. Only the event organizer or an ADMIN can submit this event" }
//   400 - { "message": "Only DRAFT or REJECTED events can be submitted for approval (current status: PUBLISHED)" }
router.put(
  "/:id/submit",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  submitEvent
);


// ============================================================
// 6. PUT /api/events/:id/approve
// Approve event (ADMIN only)
// PENDING_APPROVAL -> APPROVED
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "message": "Event approved successfully",
//   "event": { "...": "...", "status": "APPROVED", "approval": { "status": "APPROVED", "reviewedBy": "...", "reviewedAt": "...", "comment": null } }
// }
//
// Error responses:
//   403 - { "message": "Access denied. You do not have permission" }
//   400 - { "message": "Only events pending approval can be approved (current status: DRAFT)" }
router.put(
  "/:id/approve",
  protect,
  authorize("ADMIN"),
  approveEvent
);


// ============================================================
// 7. PUT /api/events/:id/reject
// Reject event (ADMIN only)
// PENDING_APPROVAL -> REJECTED (with optional comment)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//   Content-Type: application/json
//
// Request body (example):
// {
//   "comment": "Venue booking is already taken for those dates."
// }
//
// Success response (200 OK):
// {
//   "message": "Event rejected",
//   "event": { "...": "...", "status": "REJECTED", "approval": { "status": "REJECTED", "reviewedBy": "...", "reviewedAt": "...", "comment": "Venue booking is already taken for those dates." } }
// }
router.put(
  "/:id/reject",
  protect,
  authorize("ADMIN"),
  rejectEvent
);


// ============================================================
// 8. PUT /api/events/:id/publish
// Publish event (OWNER ORGANIZER or ADMIN)
// APPROVED -> PUBLISHED
// Publishing is only possible AFTER admin approval
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "message": "Event published successfully",
//   "event": { "...": "...", "status": "PUBLISHED" }
// }
//
// Error responses:
//   403 - { "message": "Access denied. Only the event organizer or an ADMIN can publish this event" }
//   400 - { "message": "Only approved events can be published (current status: DRAFT). Events cannot be published without admin approval." }
router.put(
  "/:id/publish",
  protect,
  authorize("ORGANIZER", "ADMIN"),
  publishEvent
);


// ============================================================
// 9. DELETE /api/events/:id
// Delete event (ADMIN only)
// ============================================================
// Headers:
//   Authorization: Bearer <token>
//
// Success response (200 OK):
// {
//   "message": "Event deleted successfully"
// }
//
// Error responses:
//   403 - { "message": "Access denied. You do not have permission" }
//   404 - { "message": "Event not found" }
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteEvent
);


// ============================================================
// Sample test flows (curl)
// ============================================================
// Roles/emails: student@test.com, organizer@test.com, admin@test.com
//
// 1. Login:
//    curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
//      -d '{ "email": "organizer@test.com", "password": "password" }'     -> returns <TOKEN>
//
// 2. Create event (organizer):
//    curl -X POST http://localhost:5000/api/events -H "Authorization: Bearer <TOKEN>" \
//      -H "Content-Type: application/json" \
//      -d '{ "title": "Hackathon", "description": "Code for 48h", "category": "HACKATHON", "department": "<DEPT_ID>", "venue": "<VENUE_ID>", "startDate": "2026-11-10T09:00:00Z", "endDate": "2026-11-12T18:00:00Z", "maxParticipants": 80 }'
//
// 3. Submit for approval (organizer):
//    curl -X PUT http://localhost:5000/api/events/<EVENT_ID>/submit -H "Authorization: Bearer <TOKEN>"
//
// 4. Approve (admin):
//    curl -X PUT http://localhost:5000/api/events/<EVENT_ID>/approve -H "Authorization: Bearer <ADMIN_TOKEN>"
//
// 5. Publish (organizer):
//    curl -X PUT http://localhost:5000/api/events/<EVENT_ID>/publish -H "Authorization: Bearer <TOKEN>"
//
// 6. Public listing (no token needed):
//    curl http://localhost:5000/api/events
//
// Security examples:
//   - Student tries to create -> 403
//   - Organizer tries to update another organizer's event -> 403
//   - Organizer tries to approve -> 403 (approve/reject are ADMIN only)
//   - Admin tries to publish a DRAFT event (no approval) -> 400
//   - Anyone tries PUT { "status": "PUBLISHED" } -> 400 (protected field, use workflow)


module.exports = router;