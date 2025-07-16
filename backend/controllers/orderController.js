const Order = require("../models/Order");
const paypal = require("@paypal/checkout-server-sdk"); // ✅ Correct SDK
require("dotenv").config();

// Setup PayPal Environment
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Create Order in DB
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = new Order({ items, totalAmount });

    await order.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Checkout with PayPal
exports.checkoutOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: order.totalAmount.toFixed(2),
          },
        },
      ],
    });

    const response = await client.execute(request);

    // Return the PayPal order ID to the client
    res.status(200).json({
      paypalOrderId: response.result.id,
      links: response.result.links, // Optional: approval URL for frontend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Capture PayPal Payment
exports.capturePayment = async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await client.execute(request);

    // Update order in DB
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.isPaid = true;
    order.paymentId = paypalOrderId;
    await order.save();

    res.status(200).json({ success: true, capture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
