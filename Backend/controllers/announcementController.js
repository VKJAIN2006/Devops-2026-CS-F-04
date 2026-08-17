const Announcement = require("../models/Announcement");
const User = require("../models/User");
const Event = require("../models/Event");


// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      event,
      createdBy,
      priority,
      publishDate,
      expiryDate
    } = req.body;

    // Check creator
    const existingUser = await User.findById(createdBy);

    if (!existingUser) {
      return res.status(404).json({
        message: "Creator user not found"
      });
    }

    // Check event if provided
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
      title,
      message,
      event: event || null,
      createdBy,
      priority,
      publishDate,
      expiryDate
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


// Get all announcements
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: announcements.length,
      announcements
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching announcements",
      error: error.message
    });
  }
};


// Get announcement by ID
const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate");

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
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


// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      priority,
      publishDate,
      expiryDate
    } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        title,
        message,
        priority,
        publishDate,
        expiryDate
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("createdBy", "name email role")
      .populate("event", "title category startDate endDate");

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    res.status(200).json({
      message: "Announcement updated successfully",
      announcement
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating announcement",
      error: error.message
    });
  }
};


// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(
      req.params.id
    );

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

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


module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};