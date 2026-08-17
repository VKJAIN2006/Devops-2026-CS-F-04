const Event = require("../models/Event");


// Create a new event
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      organizer,
      department,
      venue,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      maxParticipants,
      registrationRequired,
      eligibility,
      image
    } = req.body;

    const event = await Event.create({
      title,
      description,
      category,
      organizer,
      department,
      venue,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      maxParticipants,
      registrationRequired,
      eligibility,
      image
    });

    res.status(201).json({
      message: "Event created successfully",
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating event",
      error: error.message
    });
  }
};


// Get all events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer", "name email role")
      .populate("department", "name code")
      .populate("venue", "name building capacity");

    res.status(200).json({
      count: events.length,
      events
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching events",
      error: error.message
    });
  }
};


// Get a single event
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email role")
      .populate("department", "name code")
      .populate("venue", "name building capacity");

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.status(200).json({
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching event",
      error: error.message
    });
  }
};


// Update an event
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate("organizer", "name email role")
      .populate("department", "name code")
      .populate("venue", "name building capacity");

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.status(200).json({
      message: "Event updated successfully",
      event
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating event",
      error: error.message
    });
  }
};


// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.status(200).json({
      message: "Event deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting event",
      error: error.message
    });
  }
};


module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};