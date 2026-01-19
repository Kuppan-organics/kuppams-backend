const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Wait for database connection
    await connectDB();

    // Start server only after database is connected
    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`,
      );
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    console.error(
      "Server starting without DB connection. The middleware will attempt reconnection on first API call.",
    );
    // Don't exit - let server start and middleware handle DB reconnection
    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT} (without DB connection)`,
      );
    });
  }
};

startServer();
