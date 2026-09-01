require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const User = require("../models/User");

const ADMIN_EMAIL = "admin@kuppam.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_NAME = "Admin";

async function seedAdmin() {
  try {
    await connectDB();

    const existing = await User.findOne({ email: ADMIN_EMAIL }).select("+password");

    if (existing) {
      existing.name = ADMIN_NAME;
      existing.role = "admin";
      existing.password = ADMIN_PASSWORD;
      await existing.save();
      console.log("Admin user updated");
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin",
      });
      console.log("Admin user created");
    }

    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error("Failed to seed admin user:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode ?? 0);
  }
}

seedAdmin();
