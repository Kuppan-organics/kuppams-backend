const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
    select: false,
  },
  passwordResetOtpHash: {
    type: String,
    select: false,
  },
  passwordResetOtpExpires: {
    type: Date,
    select: false,
  },
  passwordResetVerifiedUntil: {
    type: Date,
    select: false,
  },
  passwordResetLastRequestedAt: {
    type: Date,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "franchise"],
    default: "user",
  },
  phone: {
    type: String,
    trim: true,
  },
  profilePhoto: {
    type: String,
    trim: true,
    default: null,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  savedAddresses: [
    {
      label: {
        type: String,
        enum: ["home", "work", "other"],
        required: true,
      },
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
      phone: { type: String, trim: true },
      isDefault: { type: Boolean, default: false },
    },
  ],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
