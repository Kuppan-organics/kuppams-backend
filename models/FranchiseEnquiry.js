const mongoose = require("mongoose");

const franchiseEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "read", "archived"],
      default: "new",
    },
  },
  {
    timestamps: true,
  },
);

franchiseEnquirySchema.index({ status: 1, createdAt: -1 });
franchiseEnquirySchema.index({ phone: 1 });

module.exports = mongoose.model("FranchiseEnquiry", franchiseEnquirySchema);
