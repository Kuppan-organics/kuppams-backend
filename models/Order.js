const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  status: {
    type: String,
    enum: ["placed", "accepted", "packing", "sent_to_delivery", "delivered", "cancelled"],
    default: "placed",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  expectedDeliveryDate: {
    type: Date,
    default: null,
  },
  statusTimeline: [
    {
      status: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: {
        type: String,
        default: "",
      },
    },
  ],
}, {
  timestamps: true,
});

// Generate order number before saving
orderSchema.pre("save", async function(next) {
  if (!this.orderNumber) {
    // Generate order number: timestamp + random 3 digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    this.orderNumber = `#${timestamp}${random}`;
  }
  next();
});

// Initialize timeline on first save
orderSchema.pre("save", function(next) {
  // Initialize timeline on first save only
  if (this.isNew && (!this.statusTimeline || this.statusTimeline.length === 0)) {
    this.statusTimeline = [{
      status: this.status || "placed",
      timestamp: new Date(),
      note: "Order placed successfully",
    }];
  }
  next();
});

// Virtual for item total price
orderItemSchema.virtual("itemTotal").get(function() {
  const discountedPrice = this.price * (1 - (this.discount || 0) / 100);
  return discountedPrice * this.quantity;
});

orderSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
