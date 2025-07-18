// const express = require("express");
// const router = express.Router();
// const {
//   createOrder,
//   checkoutOrder,
//   capturePayment,
//   captureOrder,
// } = require("../controllers/orderController");

// router.post("/", createOrder);
// router.post("/checkout/:orderId", checkoutOrder);
// router.post("/capture", captureOrder);

// module.exports = router;
const express = require("express");
const router = express.Router();
const {
  createOrder,
  captureOrder,
  getOrderItems
} = require("../controllers/orderController");

// Create new order
router.post("/create", createOrder);

// Capture payment for order
router.post("/capture", captureOrder);

// Get order items
router.get("/items/:orderId", getOrderItems);

module.exports = router;