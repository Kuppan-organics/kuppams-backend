// Socket service to manage socket operations
let io = null;

// Initialize socket service
const initializeSocket = (server) => {
  const { Server } = require("socket.io");
  const { authenticateSocket, isAdmin } = require("../config/socket");

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(authenticateSocket);

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.role})`);

    // If user is admin, join admin room
    if (isAdmin(socket)) {
      socket.join("admin");
      console.log(`Admin ${socket.user.name} joined admin room`);
      
      // Send confirmation to admin
      socket.emit("admin:connected", {
        message: "Connected to admin notifications",
        userId: socket.user._id.toString(),
      });
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

// Emit new order to admin room
const emitNewOrder = (order) => {
  if (io) {
    io.to("admin").emit("order:new", {
      order,
      timestamp: new Date(),
      sound: true, // Flag to trigger ringtone on frontend
    });
    console.log(`New order notification sent to admin: ${order.orderNumber}`);
  }
};

// Emit order status update to admin room
const emitOrderStatusUpdate = (order) => {
  if (io) {
    io.to("admin").emit("order:status-updated", {
      order,
      timestamp: new Date(),
    });
    console.log(`Order status update sent to admin: ${order.orderNumber}`);
  }
};

// Get socket instance
const getIO = () => {
  return io;
};

module.exports = {
  initializeSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  getIO,
};
