const Venue = require("../models/Venue");


// Create a new venue
const createVenue = async (req, res) => {
  try {
    const {
      name,
      building,
      floor,
      roomNumber,
      capacity,
      facilities
    } = req.body;

    const venue = await Venue.create({
      name,
      building,
      floor,
      roomNumber,
      capacity,
      facilities
    });

    res.status(201).json({
      message: "Venue created successfully",
      venue
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating venue",
      error: error.message
    });
  }
};


// Get all venues
const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find();

    res.status(200).json({
      count: venues.length,
      venues
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching venues",
      error: error.message
    });
  }
};


// Get a single venue
const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        message: "Venue not found"
      });
    }

    res.status(200).json({
      venue
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching venue",
      error: error.message
    });
  }
};


// Update a venue
const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!venue) {
      return res.status(404).json({
        message: "Venue not found"
      });
    }

    res.status(200).json({
      message: "Venue updated successfully",
      venue
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating venue",
      error: error.message
    });
  }
};


// Delete a venue
const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);

    if (!venue) {
      return res.status(404).json({
        message: "Venue not found"
      });
    }

    res.status(200).json({
      message: "Venue deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting venue",
      error: error.message
    });
  }
};


module.exports = {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue
};