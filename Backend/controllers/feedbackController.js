const mongoose = require("mongoose");
const Feedback = require("../database/Feedback");
const Event = require("../database/Event");
const Attendance = require("../database/Attendance");


// ==========================================
// Helpers
// ==========================================

// Check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// Validate rating must be an integer between 1 and 5
const isValidRating = (value) => {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Normalize rating to a number before saving
const normalizeRating = (value) => Number(value);

// Hide user identity when feedback is anonymous.
// Also works on populated documents (user becomes null instead of an object).
const formatFeedback = (feedback) => {
  if (feedback.isAnonymous) {
    const sanitized = feedback.toObject();
    sanitized.user = null;
    return sanitized;
  }
  return feedback;
};


// ==========================================
// Create feedback
// Only users with PRESENT attendance can submit.
// One feedback per user per event.
// ==========================================
const createFeedback = async (req, res) => {
  try {
    const {
      event,
      rating,
      comment,
      isAnonymous
    } = req.body;

    // Get the logged-in user from the JWT (protect middleware)
    const user = req.user._id;

    // 1. Required fields
    if (!event) {
      return res.status(400).json({
        message: "Event ID is required"
      });
    }

    if (
      rating === undefined ||
      rating === null ||
      rating === ""
    ) {
      return res.status(400).json({
        message: "Rating is required"
      });
    }

    // 2. Validate ObjectId formats
    if (!isValidObjectId(event)) {
      return res.status(400).json({
        message: "Invalid event ID format"
      });
    }

    // 3. Validate rating range (1-5)
    if (!isValidRating(rating)) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5"
      });
    }

    // 4. Check event exists
    const existingEvent = await Event.findById(event);

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // 5. Only users who attended (status: PRESENT) can submit feedback
    const attendance = await Attendance.findOne({
      user,
      event,
      status: "PRESENT"
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Only participants who attended the event can submit feedback"
      });
    }

    // 6. Prevent duplicate feedback (one per user per event)
    const existingFeedback = await Feedback.findOne({
      user,
      event
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: "Feedback has already been submitted for this event"
      });
    }

    // 7. Create feedback
    const feedback = await Feedback.create({
      user,
      event,
      rating: normalizeRating(rating),
      comment: comment || "",
      isAnonymous: isAnonymous === true
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate("user", "name email role")
      .populate("event", "title category");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: formatFeedback(populatedFeedback)
    });

  } catch (error) {
    // DB level duplicate key protection (race condition)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Feedback has already been submitted for this event"
      });
    }

    res.status(500).json({
      message: "Error submitting feedback",
      error: error.message
    });
  }
};


// ==========================================
// Get all feedback
// ADMIN / ORGANIZER only - protected in routes
// ==========================================
const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email role")
      .populate("event", "title category")
      .sort({ createdAt: -1 });

    // Mask user identity for anonymous feedback
    const sanitizedFeedback = feedback.map(formatFeedback);

    res.status(200).json({
      count: sanitizedFeedback.length,
      feedback: sanitizedFeedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message
    });
  }
};


// ==========================================
// Get feedback by ID
// Owner, ADMIN, or ORGANIZER only
// ==========================================
const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid feedback ID format"
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    // Owner, ADMIN, or ORGANIZER can view a single feedback.
    // NOTE: ownership check must use the raw ObjectId BEFORE populating,
    // otherwise feedback.user is an object and .toString() fails.
    if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "ORGANIZER" &&
      feedback.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only view your own feedback"
      });
    }

    const populatedFeedback = await Feedback.findById(id)
      .populate("user", "name email role")
      .populate("event", "title category");

    res.status(200).json({
      feedback: formatFeedback(populatedFeedback)
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message
    });
  }
};


// ==========================================
// Update feedback
// Owner or ADMIN only
// ==========================================
const updateFeedback = async (req, res) => {
  try {
    const {
      rating,
      comment,
      isAnonymous
    } = req.body;

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid feedback ID format"
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    // Owner or ADMIN can update feedback
    if (
      req.user.role !== "ADMIN" &&
      feedback.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only update your own feedback"
      });
    }

    // Apply updates with validation
    if (rating !== undefined && rating !== null && rating !== "") {
      if (!isValidRating(rating)) {
        return res.status(400).json({
          message: "Rating must be an integer between 1 and 5"
        });
      }

      feedback.rating = normalizeRating(rating);
    }

    if (comment !== undefined && comment !== null) {
      feedback.comment = comment;
    }

    if (isAnonymous !== undefined && isAnonymous !== null) {
      feedback.isAnonymous = isAnonymous === true;
    }

    await feedback.save();

    const updatedFeedback = await Feedback.findById(feedback._id)
      .populate("user", "name email role")
      .populate("event", "title category");

    res.status(200).json({
      message: "Feedback updated successfully",
      feedback: formatFeedback(updatedFeedback)
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating feedback",
      error: error.message
    });
  }
};


// ==========================================
// Delete feedback
// Owner or ADMIN only
// ==========================================
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid feedback ID format"
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    // Owner or ADMIN can delete feedback
    if (
      req.user.role !== "ADMIN" &&
      feedback.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own feedback"
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      message: "Feedback deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting feedback",
      error: error.message
    });
  }
};


// ==========================================
// Export all controller functions
// ==========================================
module.exports = {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback
};