const Department = require("../models/Department");

const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const department = await Department.create({
      name,
      code,
      description
    });

    res.status(201).json({
      message: "Department created successfully",
      department
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating department",
      error: error.message
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();

    res.status(200).json({
      count: departments.length,
      departments
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching departments",
      error: error.message
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments
};