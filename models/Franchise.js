const mongoose = require("mongoose");

const franchiseSchema = new mongoose.Schema(
  {
    franchiseCode: {
      type: String,
      unique: true,
      index: true,
    },
    franchiseName: {
      type: String,
      required: [true, "Franchise name is required"],
      trim: true,
      maxlength: 200,
    },
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: 200,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      maxlength: 100,
    },
    ownerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    ownerPhone: {
      type: String,
      required: [true, "Owner phone is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 100,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      maxlength: 100,
    },
    physicalAddress: {
      type: String,
      required: [true, "Physical address is required"],
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    photo: {
      type: String,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

franchiseSchema.pre("save", async function (next) {
  if (this.franchiseCode) {
    return next();
  }

  try {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const prefix = `FR${yy}${mm}${dd}`;

    const count = await mongoose.model("Franchise").countDocuments({
      franchiseCode: new RegExp(`^${prefix}`),
    });

    this.franchiseCode = `${prefix}${String(count + 1).padStart(4, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});

franchiseSchema.index({ isActive: 1, createdAt: -1 });
franchiseSchema.index({ storeName: 1 });

module.exports = mongoose.model("Franchise", franchiseSchema);
