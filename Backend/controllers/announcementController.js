const mongoose = require("mongoose");
const Announcement = require("../database/Announcement");
const Event = require("../database/Event");


// ==========================================
// Constants
// ==========================================

// Priority weight used for sorting (higher = more important)
const PRIORITY_ORDER = {
  URGENT: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
};

const TARGET_AUDIENCES = ["ALL", "STUDENTS", "FACULTY", "ORGANIZERS"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];


// ==========================================
// Helpers
// ==========================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// ADMIN and ORGANIZER manage announcements -> they see everything.
// Regular users only see their own audience plus ALL.
const audiencesForRole = (role) => {
  switch (role) {
    case "STUDENT":
      return ["ALL", "STUDENTS"];
    case "FACULTY":
      return ["ALL", "FACULTY"];
    default:
      return null; // ADMIN / ORGANIZER -> no audience filter
  }
};

const isManager = (role) =>
  role === "ADMIN" || role === "ORGANIZER";

// Parse a date value into a Date, or null when empty/invalid
const parseDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

// Sort by priority (URGENT first) then created date (newest first)
const sortByPriorityAndDate = (announcements) =>
  [...announcements].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] || 0;
    const pb = PRIORITY_ORDER[b.priority] || 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });


// ==========================================
// Create announcement
// ADMIN / ORGANIZER only - protected in routes
// ==========================================
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      event,
      targetAudience,
      priority,
      isPublished,
      publishAt,
      expiresAt
    } = req.body;

    // createdBy always comes from the authenticated user (JWT)
    const createdBy = req.user._id;

    // Validate required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Title is required"
      });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required"
      });
    }

    // Validate enums
    if (targetAudience && !TARGET_AUDIENCES.includes(targetAudience)) {
      return res.status(400).json({
        message: "targetAudience must be one of: ALL, STUDENTS, FACULTY, ORGANIZERS"
      });
    }

    if (priority && !PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: "priority must be one of: LOW, NORMAL, HIGH, URGENT"
      });
    }

    // Validate optional event
    if (event && !isValidObjectId(event)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    // Validate dates
    const publishAtDate = parseDate(publishAt);

    if (publishAt && !publishAtDate) {
      return res.status(400).json({
        message: "Invalid publishAt date"
      });
    }

    const expiresAtDate = parseDate(expiresAt);

    if (expiresAt && !expiresAtDate) {
      return res.status(400).json({
        message: "Invalid expiresAt date"
      });
    }

    if (publishAtDate && expiresAtDate && expiresAtDate <= publishAtDate) {
      return res.status(400).json({
        message: "expiresAt must be after publishAt"
      });
    }

    // Verify event exists if provided
    if (event) {
      const existingEvent = await Event.findById(event);

      if (!existingEvent) {
        return res.status(404).json({
          message: "Event not found"
        });
      }
    }

    // Create announcement
    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      createdBy,
      event: event || null,
      targetAudience: targetAudience || "ALL",
      priority: priority || "NORMAL",
      isPublished: isPublished === true,
      publishAt: publishAtDate,
      expiresAt: expiresAtDate
    });

    const populatedAnnouncement = await Announcement.findById(
      announcement._id
    )
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate");

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: populatedAnnouncement
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating announcement",
      error: error.message
    });
  }
};


// ==========================================
// Get all announcements
// - Filters expired announcements (expiresAt)
// - Filters by targetAudience based on the user's role
// - Regular users only see published, live announcements
// - Sorted by priority (URGENT first) then creation date
// ==========================================
const getAnnouncements = async (req, res) => {
  try {
    const now = new Date();

    const conditions = [
      // Exclude expired announcements
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }
    ];

    // Regular users only see published announcements that are already live
    if (!isManager(req.user.role)) {
      conditions.push({ isPublished: true });
      conditions.push({
        $or: [
          { publishAt: null },
          { publishAt: { $lte: now } }
        ]
      });
    }

    // Filter by targetAudience based on the requester's role
    const audiences = audiencesForRole(req.user.role);

    if (audiences) {
      conditions.push({
        targetAudience: { $in: audiences }
      });
    }

    const announcements = await Announcement.find({ $and: conditions })
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate");

    // Sort by priority (URGENT first) then creation date (newest first)
    const sortedAnnouncements = sortByPriorityAndDate(announcements);

    res.status(200).json({
      count: sortedAnnouncements.length,
      announcements: sortedAnnouncements
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching announcements",
      error: error.message
    });
  }
};


// ==========================================
// Get announcement by ID
// Visibility rules match the list endpoint.
// ==========================================
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid announcement ID format"
      });
    }

    const announcement = await Announcement.findById(id)
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate");

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    // Non-managers can only access published announcements for their audience
    if (!isManager(req.user.role)) {
      const now = new Date();
      const audiences = audiencesForRole(req.user.role) || [];
      const isVisible =
        announcement.isPublished &&
        (announcement.expiresAt === null || announcement.expiresAt > now) &&
        (announcement.publishAt === null || announcement.publishAt <= now) &&
        audiences.includes(announcement.targetAudience);

      if (!isVisible) {
        // 404 (not 403) so restricted announcements are not discoverable
        return res.status(404).json({
          message: "Announcement not found"
        });
      }
    }

    res.status(200).json({
      announcement
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching announcement",
      error: error.message
    });
  }
};


// ==========================================
// Update announcement
// ADMIN / ORGANIZER only - protected in routes
// ==========================================
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      message,
      event,
      targetAudience,
      priority,
      isPublished,
      publishAt,
      expiresAt
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid announcement ID format"
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    // Validate fields before applying
    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({
        message: "Title cannot be empty"
      });
    }

    if (message !== undefined && (typeof message !== "string" || !message.trim())) {
      return res.status(400).json({
        message: "Message cannot be empty"
      });
    }

    if (targetAudience !== undefined && !TARGET_AUDIENCES.includes(targetAudience)) {
      return res.status(400).json({
        message: "targetAudience must be one of: ALL, STUDENTS, FACULTY, ORGANIZERS"
      });
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: "priority must be one of: LOW, NORMAL, HIGH, URGENT"
      });
    }

    // Validate optional event field
    if (event !== undefined && event !== null && event !== "") {
      if (!isValidObjectId(event)) {
        return res.status(400).json({
          message: "Invalid event ID format"
        });
      }

      const existingEvent = await Event.findById(event);

      if (!existingEvent) {
        return res.status(404).json({
          message: "Event not found"
        });
      }
    }

    // Validate dates
    if (
      publishAt !== undefined &&
      publishAt !== null &&
      publishAt !== "" &&
      !parseDate(publishAt)
    ) {
      return res.status(400).json({
        message: "Invalid publishAt date"
      });
    }

    if (
      expiresAt !== undefined &&
      expiresAt !== null &&
      expiresAt !== "" &&
      !parseDate(expiresAt)
    ) {
      return res.status(400).json({
        message: "Invalid expiresAt date"
      });
    }

    const newPublishAt = publishAt !== undefined
      ? (publishAt ? parseDate(publishAt) : null)
      : announcement.publishAt;

    const newExpiresAt = expiresAt !== undefined
      ? (expiresAt ? parseDate(expiresAt) : null)
      : announcement.expiresAt;

    if (newPublishAt && newExpiresAt && newExpiresAt <= newPublishAt) {
      return res.status(400).json({
        message: "expiresAt must be after publishAt"
      });
    }

    // Apply updates
    if (title !== undefined) announcement.title = title.trim();
    if (message !== undefined) announcement.message = message.trim();

    if (event !== undefined) {
      announcement.event = event === "" ? null : event;
    }

    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (priority !== undefined) announcement.priority = priority;
    if (isPublished !== undefined) announcement.isPublished = isPublished === true;

    announcement.publishAt = newPublishAt;
    announcement.expiresAt = newExpiresAt;

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate");

    res.status(200).json({
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating announcement",
      error: error.message
    });
  }
};


// ==========================================
// Delete announcement
// ADMIN / ORGANIZER only - protected in routes
// ==========================================
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid announcement ID format"
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      message: "Announcement deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting announcement",
      error: error.message
    });
  }
};


// ==========================================
// Export all controller functions
// ==========================================
module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};