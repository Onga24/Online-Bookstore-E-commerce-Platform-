// const Cart = require("../models/cart");
// const Book = require("../models/book.model");
// const {
//   HTTP_BAD_REQUEST,
//   HTTP_OK
// } = require("../constant/http_status");

// const getCart = async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ user: req.userId }).populate("items.book");
//     if (!cart) {
//       return res.status(HTTP_OK).json({ success: true, items: [] });
//     }
//     res.status(HTTP_OK).json({ success: true, items: cart.items });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error fetching cart" });
//   }
// };

// const addToCart = async (req, res) => {
//   const { bookId, quantity } = req.body;

//   try {
//     const book = await Book.findById(bookId);
//     if (!book) return res.status(HTTP_BAD_REQUEST).send("Book not found");

//     let cart = await Cart.findOne({ user: req.userId });
//     if (!cart) {
//       cart = await Cart.create({
//         user: req.userId,
//         items: [{ book: bookId, quantity }],
//       });
//     } else {
//       const itemIndex = cart.items.findIndex((item) => item.book.toString() === bookId);
//       if (itemIndex > -1) {
//         cart.items[itemIndex].quantity += quantity;
//       } else {
//         cart.items.push({ book: bookId, quantity });
//       }
//       await cart.save();
//     }

//     const populatedCart = await Cart.findById(cart._id).populate("items.book");
//     res.status(HTTP_OK).json({ success: true, items: populatedCart.items });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error adding to cart" });
//   }
// };

// const updateCartItem = async (req, res) => {
//   const { bookId, quantity } = req.body;

//   try {
//     const cart = await Cart.findOne({ user: req.userId });
//     if (!cart) return res.status(HTTP_BAD_REQUEST).send("Cart not found");

//     const item = cart.items.find((item) => item.book.toString() === bookId);
//     if (!item) return res.status(HTTP_BAD_REQUEST).send("Book not in cart");

//     item.quantity = quantity;
//     await cart.save();

//     const updatedCart = await Cart.findById(cart._id).populate("items.book");
//     res.status(HTTP_OK).json({ success: true, items: updatedCart.items });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error updating item" });
//   }
// };

// const removeCartItem = async (req, res) => {
//   const { bookId } = req.params;

//   try {
//     const cart = await Cart.findOne({ user: req.userId });
//     if (!cart) return res.status(HTTP_BAD_REQUEST).send("Cart not found");

//     cart.items = cart.items.filter((item) => item.book.toString() !== bookId);
//     await cart.save();

//     const updatedCart = await Cart.findById(cart._id).populate("items.book");
//     res.status(HTTP_OK).json({ success: true, items: updatedCart.items });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error removing item" });
//   }
// };

// const clearCart = async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ user: req.userId });
//     if (!cart) return res.status(HTTP_BAD_REQUEST).send("Cart not found");

//     cart.items = [];
//     await cart.save();

//     res.status(HTTP_OK).json({ success: true, message: "Cart cleared" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error clearing cart" });
//   }
// };

// module.exports = {
//   getCart,
//   addToCart,
//   updateCartItem,
//   removeCartItem,
//   clearCart,
// };



const Cart = require("../models/cart");
const Book = require("../models/book.model");
const mongoose = require("mongoose"); // CHANGED: Added mongoose
const {
  HTTP_BAD_REQUEST,
  HTTP_OK
} = require("../constant/http_status");

// CHANGED: Hardcoded test user ID for development/testing
const testUserId = new mongoose.Types.ObjectId("686b694a0f3e82bea9025373"); // REPLACE with your real test user _id

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: testUserId }) // CHANGED: req.userId → testUserId
      .populate("items.book");
    if (!cart) {
      return res.status(HTTP_OK).json({ success: true, items: [] });
    }
    res.status(HTTP_OK).json({ success: true, items: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching cart" });
  }
};

const addToCart = async (req, res) => {
  const { bookId, quantity } = req.body;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(HTTP_BAD_REQUEST).send("Book not found");

    let cart = await Cart.findOne({ user: testUserId }); // CHANGED
    if (!cart) {
      cart = await Cart.create({
        user: testUserId, // CHANGED
        items: [{ book: bookId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex((item) => item.book.toString() === bookId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ book: bookId, quantity });
      }
      await cart.save();
    }

    const populatedCart = await Cart.findById(cart._id).populate("items.book");
    res.status(HTTP_OK).json({ success: true, items: populatedCart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding to cart" });
  }
};

const updateCartItem = async (req, res) => {
  const { bookId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: testUserId }); // CHANGED
    if (!cart) return res.status(HTTP_BAD_REQUEST).send("Cart not found");

    const item = cart.items.find((item) => item.book.toString() === bookId);
    if (!item) return res.status(HTTP_BAD_REQUEST).send("Book not in cart");

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate("items.book");
    res.status(HTTP_OK).json({ success: true, items: updatedCart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating item" });
  }
};

const removeCartItem = async (req, res) => {
  const { bookId } = req.params;

  try {
    const cart = await Cart.findOne({ user: testUserId }); // CHANGED
    if (!cart) return res.status(HTTP_BAD_REQUEST).send("Cart not found");

    cart.items = cart.items.filter((item) => item.book.toString() !== bookId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate("items.book");
    res.status(HTTP_OK).json({ success: true, items: updatedCart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error removing item" });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: testUserId }); // CHANGED
    if (!cart) return res.status(HTTP_BAD_REQUEST).send("Cart not found");

    cart.items = [];
    await cart.save();

    res.status(HTTP_OK).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error clearing cart" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
