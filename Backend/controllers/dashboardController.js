const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Attendance = require("../models/Attendance");
const Certificate = require("../models/Certificate");
const Feedback = require("../models/Feedback");


// ==========================================
// ADMIN DASHBOARD
// ==========================================
const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalOrganizers,
      totalEvents,
      upcomingEvents,
      completedEvents,
      cancelledEvents,
      totalRegistrations,
      totalAttendance,
      totalCertificates,
      totalFeedback
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "STUDENT"
      }),

      User.countDocuments({
        role: "FACULTY"
      }),

      User.countDocuments({
        role: "ORGANIZER"
      }),

      Event.countDocuments(),

      Event.countDocuments({
        startDate: { $gte: now },
        status: {
          $nin: ["CANCELLED", "REJECTED"]
        }
      }),

      Event.countDocuments({
        status: "COMPLETED"
      }),

      Event.countDocuments({
        status: "CANCELLED"
      }),

      Registration.countDocuments({
        status: "REGISTERED"
      }),

      Attendance.countDocuments({
        status: "PRESENT"
      }),

      Certificate.countDocuments({
        status: {
          $ne: "REVOKED"
        }
      }),

      Feedback.countDocuments()
    ]);

    res.status(200).json({
      role: "ADMIN",

      users: {
        total: totalUsers,
        students: totalStudents,
        faculty: totalFaculty,
        organizers: totalOrganizers
      },

      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        completed: completedEvents,
        cancelled: cancelledEvents
      },

      registrations: totalRegistrations,

      attendance: {
        present: totalAttendance
      },

      certificates: totalCertificates,

      feedback: totalFeedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching admin dashboard",
      error: error.message
    });
  }
};


// ==========================================
// STUDENT DASHBOARD
// ==========================================
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const registrations = await Registration.find({
      user: userId
    }).select("event status");

    const registeredEventIds = registrations
      .filter(
        registration => registration.status === "REGISTERED"
      )
      .map(registration => registration.event);

    const [
      registeredEvents,
      attendedEvents,
      certificates,
      feedbackCount,
      upcomingEvents
    ] = await Promise.all([
      Registration.countDocuments({
        user: userId,
        status: "REGISTERED"
      }),

      Attendance.countDocuments({
        user: userId,
        status: "PRESENT"
      }),

      Certificate.countDocuments({
        user: userId,
        status: {
          $ne: "REVOKED"
        }
      }),

      Feedback.countDocuments({
        user: userId
      }),

      Event.countDocuments({
        _id: {
          $in: registeredEventIds
        },
        startDate: {
          $gte: now
        },
        status: {
          $nin: ["CANCELLED", "REJECTED"]
        }
      })
    ]);

    const pendingFeedback = Math.max(
      attendedEvents - feedbackCount,
      0
    );

    res.status(200).json({
      role: "STUDENT",

      registrations: {
        total: registeredEvents,
        upcoming: upcomingEvents
      },

      attendance: {
        attended: attendedEvents
      },

      certificates: certificates,

      feedback: {
        submitted: feedbackCount,
        pending: pendingFeedback
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching student dashboard",
      error: error.message
    });
  }
};


// ==========================================
// ORGANIZER DASHBOARD
// ==========================================
const getOrganizerDashboard = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const now = new Date();

    const organizerEvents = await Event.find({
      organizer: organizerId
    }).select("_id");

    const eventIds = organizerEvents.map(
      event => event._id
    );

    const [
      totalEvents,
      upcomingEvents,
      completedEvents,
      cancelledEvents,
      totalRegistrations,
      totalAttendance,
      totalFeedback
    ] = await Promise.all([
      Event.countDocuments({
        organizer: organizerId
      }),

      Event.countDocuments({
        organizer: organizerId,
        startDate: {
          $gte: now
        },
        status: {
          $nin: ["CANCELLED", "REJECTED"]
        }
      }),

      Event.countDocuments({
        organizer: organizerId,
        status: "COMPLETED"
      }),

      Event.countDocuments({
        organizer: organizerId,
        status: "CANCELLED"
      }),

      Registration.countDocuments({
        event: {
          $in: eventIds
        },
        status: "REGISTERED"
      }),

      Attendance.countDocuments({
        event: {
          $in: eventIds
        },
        status: "PRESENT"
      }),

      Feedback.countDocuments({
        event: {
          $in: eventIds
        }
      })
    ]);

    const feedbackStats = await Feedback.aggregate([
      {
        $match: {
          event: {
            $in: eventIds
          }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: {
            $avg: "$rating"
          }
        }
      }
    ]);

    const averageRating =
      feedbackStats.length > 0
        ? Number(feedbackStats[0].averageRating.toFixed(2))
        : 0;

    res.status(200).json({
      role: "ORGANIZER",

      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        completed: completedEvents,
        cancelled: cancelledEvents
      },

      registrations: totalRegistrations,

      attendance: {
        present: totalAttendance
      },

      feedback: {
        total: totalFeedback,
        averageRating
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching organizer dashboard",
      error: error.message
    });
  }
};


// ==========================================
// FACULTY DASHBOARD
// ==========================================
const getFacultyDashboard = async (req, res) => {
  try {
    const facultyDepartment = req.user.department;

    if (!facultyDepartment) {
      return res.status(400).json({
        message: "Faculty user is not assigned to a department"
      });
    }

    const now = new Date();

    const departmentEvents = await Event.find({
      department: facultyDepartment
    }).select("_id");

    const eventIds = departmentEvents.map(
      event => event._id
    );

    const [
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalAttendance,
      totalFeedback
    ] = await Promise.all([
      Event.countDocuments({
        department: facultyDepartment
      }),

      Event.countDocuments({
        department: facultyDepartment,
        startDate: {
          $gte: now
        },
        status: {
          $nin: ["CANCELLED", "REJECTED"]
        }
      }),

      Event.countDocuments({
        department: facultyDepartment,
        status: "COMPLETED"
      }),

      Registration.countDocuments({
        event: {
          $in: eventIds
        },
        status: "REGISTERED"
      }),

      Attendance.countDocuments({
        event: {
          $in: eventIds
        },
        status: "PRESENT"
      }),

      Feedback.countDocuments({
        event: {
          $in: eventIds
        }
      })
    ]);

    res.status(200).json({
      role: "FACULTY",

      department: facultyDepartment,

      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        completed: completedEvents
      },

      registrations: totalRegistrations,

      attendance: {
        present: totalAttendance
      },

      feedback: totalFeedback
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching faculty dashboard",
      error: error.message
    });
  }
};


module.exports = {
  getAdminDashboard,
  getStudentDashboard,
  getOrganizerDashboard,
  getFacultyDashboard
};