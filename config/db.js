const mongoose = require("mongoose");

// Middleware to check if DB connection is active
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable. Please try again later.",
      readyState: mongoose.connection.readyState,
    });
  }
  next();
};

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    // if (!process.env.MONGODB_URI) {
    //   console.error(
    //     "Error: MONGODB_URI is not defined in environment variables",
    //   );
    //   console.error(
    //     "Please create a .env file with MONGODB_URI=your_connection_string",
    //   );
    //   process.exit(1);
    // }

    const conn = await mongoose.connect("mongodb+srv://pavanganesh:pavanganesh@cluster0.axrs7n2.mongodb.net/kuppams_organic?appName=Cluster0", {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      retryReads: true,
      family: 4, // Use IPv4 for Vercel compatibility
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error("Please check:");
    console.error("1. MongoDB server is running");
    console.error("2. MONGODB_URI is correct in your .env file");
    console.error("3. Network connectivity to MongoDB server");
    process.exit(1);
  }
};

module.exports = { connectDB, checkDBConnection };
