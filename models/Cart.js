const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Calculate total price
cartSchema.methods.calculateTotal = async function() {
  await this.populate('items.product');
  let total = 0;
  this.items.forEach(item => {
    if (item.product) {
      const price = item.product.discountedPrice || item.product.price;
      total += price * item.quantity;
    }
  });
  return total;
};

module.exports = mongoose.model('Cart', cartSchema);
