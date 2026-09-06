const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = generateToken;
