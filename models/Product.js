const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price must be positive"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    quantity: {
      type: String,
      default: "",
      trim: true,
    },
    variants: [
      {
        quantity: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Variant price must be positive"],
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Variant discount cannot be negative"],
          max: [100, "Variant discount cannot exceed 100%"],
        },
        stock: {
          type: Number,
          default: 0,
          min: [0, "Variant stock cannot be negative"],
        },
      },
    ],
    framingMethods: [
      {
        type: String,
        trim: true,
      },
    ],
    nutritionalBenefits: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate at least 3 nutritional benefits when provided
productSchema.path("nutritionalBenefits").validate(function (value) {
  if (!value || value.length === 0) return true; // optional field
  return value.length >= 3;
}, "Nutritional benefits must contain at least 3 values");

// Virtual for discounted price
productSchema.virtual("discountedPrice").get(function () {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Ensure virtuals are included in JSON
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
