const Feedback = require("../models/Feedback");
const User = require("../models/User");
const Event = require("../models/Event");
const Attendance = require("../models/Attendance");


// Create feedback
const createFeedback = async (req, res) => {
  try {
    const {
      user,
      event,
      rating,
      comment
    } = req.body;

    // Check user
    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Check event
    const existingEvent = await Event.findById(event);

    if (!existingEvent) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    // Only attendees can submit feedback
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

    // Prevent duplicate feedback
    const existingFeedback = await Feedback.findOne({
      user,
      event
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: "Feedback has already been submitted for this event"
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      user,
      event,
      rating,
      comment
    });

    const populatedFeedback = await Feedback.findById(
      feedback._id
    )
      .populate("user", "name email role")
      .populate("event", "title category");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: populatedFeedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error submitting feedback",
      error: error.message
    });
  }
};


// Get all feedback
const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email role")
      .populate("event", "title category");

    res.status(200).json({
      count: feedback.length,
      feedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message
    });
  }
};


// Get feedback by ID
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("user", "name email role")
      .populate("event", "title category");

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    res.status(200).json({
      feedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message
    });
  }
};


// Update feedback
const updateFeedback = async (req, res) => {
  try {
    const {
      rating,
      comment
    } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        rating,
        comment
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("user", "name email role")
      .populate("event", "title category");

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    res.status(200).json({
      message: "Feedback updated successfully",
      feedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating feedback",
      error: error.message
    });
  }
};


// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(
      req.params.id
    );

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

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


module.exports = {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback
};