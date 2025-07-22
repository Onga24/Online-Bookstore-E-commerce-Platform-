const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  books: [{
    title: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  totalAmount: Number,
  isPaid: { type: Boolean, default: false },
  status: { type: String, default: "pending" },
  paymentMethod: { type: String, default: " paypal" },
  orderNumber: String,
  paypalOrderId: String,
  transactionRef: String
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);