require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./database/User");

async function createOrganizer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const email = "phase4organizer@test.com";
        const password = "Phase4@123";

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Organizer already exists.");
            console.log("Email:", email);
            console.log("Password:", password);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const organizer = await User.create({
            name: "Phase 4 Organizer",
            email: email,
            password: hashedPassword,
            role: "ORGANIZER"
        });

        console.log("\nOrganizer created successfully!");
        console.log("--------------------------------");
        console.log("Email:    ", email);
        console.log("Password: ", password);
        console.log("Role:     ", organizer.role);
        console.log("--------------------------------");

        process.exit(0);

    } catch (error) {
        console.error("Error creating organizer:");
        console.error(error);
        process.exit(1);
    }
}

createOrganizer();