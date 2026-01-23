const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  } catch (error) {
    next(new Error("Authentication error: " + error.message));
  }
};

// Check if user is admin
const isAdmin = (socket) => {
  return socket.user && socket.user.role === "admin";
};

module.exports = {
  authenticateSocket,
  isAdmin,
};
