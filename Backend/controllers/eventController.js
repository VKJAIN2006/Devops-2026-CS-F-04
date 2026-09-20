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


// Get all events with search, filtering and pagination
const getEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Search by event title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate("organizer", "name email role")
        .populate("department", "name code")
        .populate("venue", "name building capacity")
        .skip(skip)
        .limit(limitNumber),

      Event.countDocuments(query)
    ]);

    res.status(200).json({
      count: events.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
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

// Get event statistics
const getEventStatistics = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const Registration = require("../models/Registration");
    const Attendance = require("../models/Attendance");
    const Certificate = require("../models/Certificate");
    const Feedback = require("../models/Feedback");

    const [
      totalRegistrations,
      presentCount,
      absentCount,
      certificatesIssued,
      totalFeedback,
      feedbackStats
    ] = await Promise.all([
      Registration.countDocuments({
        event: eventId,
        status: "REGISTERED"
      }),

      Attendance.countDocuments({
        event: eventId,
        status: "PRESENT"
      }),

      Attendance.countDocuments({
        event: eventId,
        status: "ABSENT"
      }),

      Certificate.countDocuments({
        event: eventId,
        status: "ISSUED"
      }),

      Feedback.countDocuments({
        event: eventId
      }),

      Feedback.aggregate([
        {
          $match: {
            event: event._id
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" }
          }
        }
      ])
    ]);

    const totalAttendance = presentCount + absentCount;

    const attendancePercentage =
      totalAttendance > 0
        ? Number(((presentCount / totalAttendance) * 100).toFixed(2))
        : 0;

    const averageRating =
      feedbackStats.length > 0
        ? Number(feedbackStats[0].averageRating.toFixed(2))
        : 0;

    res.status(200).json({
      event: {
        id: event._id,
        title: event.title,
        category: event.category,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate
      },

      registrations: {
        total: totalRegistrations
      },

      attendance: {
        present: presentCount,
        absent: absentCount,
        percentage: attendancePercentage
      },

      certificates: {
        issued: certificatesIssued
      },

      feedback: {
        total: totalFeedback,
        averageRating
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching event statistics",
      error: error.message
    });
  }
};


module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventStatistics
};