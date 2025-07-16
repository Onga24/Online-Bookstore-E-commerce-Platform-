const express = require("express");
const router = express.Router();
const {
  createOrder,
  checkoutOrder,
  capturePayment,
} = require("../controllers/orderController");

router.post("/", createOrder);
router.post("/checkout/:orderId", checkoutOrder);
router.post("/capture", capturePayment);

module.exports = router;
