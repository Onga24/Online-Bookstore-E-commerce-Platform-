const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    max: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;