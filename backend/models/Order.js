const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  items: [{ name: String, price: Number, quantity: Number }],
  totalAmount: Number,
  isPaid: { type: Boolean, default: false },
  paymentId: String,
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
