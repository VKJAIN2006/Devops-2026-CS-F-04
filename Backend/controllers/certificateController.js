const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Event = require("../models/Event");
const Attendance = require("../models/Attendance");


// Generate certificate
const createCertificate = async (req, res) => {
  try {
    const {
      user,
      event,
      certificateType,
      certificateUrl
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

    // Check attendance
    const attendance = await Attendance.findOne({
      user,
      event,
      status: "PRESENT"
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Certificate cannot be generated because attendance was not found"
      });
    }

    // Check duplicate certificate
    const existingCertificate = await Certificate.findOne({
      user,
      event
    });

    if (existingCertificate) {
      return res.status(400).json({
        message: "Certificate already exists for this user and event"
      });
    }

    // Generate certificate number
    const certificateNumber =
      "CERT-" +
      Date.now() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    // Create certificate
    const certificate = await Certificate.create({
      user,
      event,
      certificateNumber,
      certificateType,
      certificateUrl
    });

    // Populate response
    const populatedCertificate = await Certificate.findById(
      certificate._id
    )
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate");

    res.status(201).json({
      message: "Certificate generated successfully",
      certificate: populatedCertificate
    });

  } catch (error) {
    res.status(500).json({
      message: "Error generating certificate",
      error: error.message
    });
  }
};


// Get all certificates
const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate");

    res.status(200).json({
      count: certificates.length,
      certificates
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching certificates",
      error: error.message
    });
  }
};


// Get certificate by ID
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate("user", "name email role")
      .populate("event", "title category startDate endDate");

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found"
      });
    }

    res.status(200).json({
      certificate
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching certificate",
      error: error.message
    });
  }
};


// Verify certificate
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateNumber: req.params.certificateNumber
    })
      .populate("user", "name email")
      .populate("event", "title category startDate endDate");

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found"
      });
    }

    res.status(200).json({
      valid: true,
      message: "Certificate is valid",
      certificate
    });

  } catch (error) {
    res.status(500).json({
      message: "Error verifying certificate",
      error: error.message
    });
  }
};


module.exports = {
  createCertificate,
  getCertificates,
  getCertificateById,
  verifyCertificate
};