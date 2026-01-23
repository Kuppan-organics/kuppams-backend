const app = require("./app");
const { connectDB } = require("./config/db");
const { initializeSocket } = require("./utils/socketService");

const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
  let server;
  
  try {
    // Wait for database connection
    await connectDB();

    // Start server only after database is connected
    server = app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`,
      );
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Initialize Socket.IO
    initializeSocket(server);
    console.log("Socket.IO initialized");

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
    server = app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT} (without DB connection)`,
      );
    });

    // Initialize Socket.IO even if DB connection fails
    initializeSocket(server);
    console.log("Socket.IO initialized");
  }
};

startServer();
