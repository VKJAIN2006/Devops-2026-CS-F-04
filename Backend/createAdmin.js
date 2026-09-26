require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./database/User");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const email = "phase4admin@test.com";
        const password = "Phase4@123";

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Admin already exists.");
            console.log("Email:", email);
            console.log("Password:", password);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name: "Phase 4 Admin",
            email: email,
            password: hashedPassword,
            role: "ADMIN"
        });

        console.log("\nAdmin created successfully!");
        console.log("--------------------------------");
        console.log("Email:    ", email);
        console.log("Password: ", password);
        console.log("Role:     ", admin.role);
        console.log("--------------------------------");

        process.exit(0);

    } catch (error) {
        console.error("Error creating admin:");
        console.error(error);
        process.exit(1);
    }
}

createAdmin();