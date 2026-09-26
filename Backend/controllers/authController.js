const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../database/User");


// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );
};


// Register user
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      employeeId,
      department,
      phone
    } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    // Public registration can create non-admin accounts only.
    const requestedRole = role || "STUDENT";
    if (!["STUDENT", "FACULTY", "ORGANIZER"].includes(requestedRole)) {
      return res.status(400).json({
        message: "Admin accounts cannot be created through public registration"
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: requestedRole,
      studentId,
      employeeId,
      department,
      phone
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message
    });
  }
};


// Login user
const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
      role
    } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // If a role was selected on the login screen, it must match the account.
    if (role && user.role !== role) {
      return res.status(403).json({
        message: `This account is registered as ${user.role}, not ${role}`
      });
    }

    // Check active status
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive"
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message
    });
  }
};


module.exports = {
  registerUser,
  loginUser
};