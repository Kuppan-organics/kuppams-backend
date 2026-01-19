const mongoose = require("mongoose");

// Middleware to check if DB connection is active
const checkDBConnection = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // If connection is not active, try to reconnect
  if (
    mongoose.connection.readyState === 0 ||
    mongoose.connection.readyState === 2
  ) {
    console.warn(
      `Database connection state: ${mongoose.connection.readyState}. Attempting to reconnect...`,
    );

    try {
      await connectDB();
      console.log("Database reconnected successfully");
      next();
    } catch (err) {
      console.error("Failed to reconnect to database:", err.message);
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please try again later.",
        readyState: mongoose.connection.readyState,
      });
    }
  } else {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable. Please try again later.",
      readyState: mongoose.connection.readyState,
    });
  }
};

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      const errorMsg = "MONGODB_URI is not defined in environment variables";
      console.error("Error: " + errorMsg);
      throw new Error(errorMsg);
    }

    console.log("Attempting to connect to MongoDB...");
    console.log(
      `Connection string (masked): mongodb+srv://${process.env.MONGODB_URI.split("@")[1]}`,
    );

    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      family: 4, // Use IPv4 for Vercel compatibility
      connectTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events (attach only once)
    if (!mongoose.connection.listeners("error").length) {
      mongoose.connection.on("error", (err) => {
        console.error(`MongoDB connection error: ${err.message}`);
      });
    }

    if (!mongoose.connection.listeners("disconnected").length) {
      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
      });
    }

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Don't exit process - let the middleware handle reconnection attempts
    throw error;
  }
};

module.exports = { connectDB, checkDBConnection };
