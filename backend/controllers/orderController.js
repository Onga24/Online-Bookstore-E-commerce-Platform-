// const paypal = require('@paypal/checkout-server-sdk');
// const { v4: uuidv4 } = require('uuid');
// const Order = require('../models/Order');
// require('dotenv').config();

// // Set up PayPal environment
// const environment = new paypal.core.SandboxEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_CLIENT_SECRET
// );
// const client = new paypal.core.PayPalHttpClient(environment);

// // Create PayPal Order and Save to DB
// const createOrder = async (req, res) => {
//   const { books } = req.body;

//   if (!books || !Array.isArray(books) || books.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing or invalid order data: books are required.'
//     });
//   }

//   const transactionRef = uuidv4();
//   const totalAmount = books.reduce((sum, item) => sum + item.price * item.quantity, 0);

//   try {
//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer('return=representation');
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [{
//         reference_id: transactionRef,
//         description: `BookStore Order (Ref: ${transactionRef})`,
//         amount: {
//           currency_code: 'USD',
//           value: totalAmount.toFixed(2)
//         }
//       }],
//       application_context: {
//         return_url: `${process.env.FRONTEND_URL}/payment-success`,
//         cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
//         brand_name: 'My BookStore',
//         shipping_preference: 'NO_SHIPPING'
//       }
//     });

//     const paypalOrder = await client.execute(request);
//     const approvalUrl = paypalOrder.result.links.find(link => link.rel === 'approve')?.href;

//     // Save order to DB
//     const newOrder = new Order({
//       books,
//       totalAmount,
//       status: 'pending',
//       paymentMethod: 'paypal',
//       orderNumber: `ORD-${Date.now()}`,
//       paypalOrderId: paypalOrder.result.id,
//       transactionRef
//     });

//     const savedOrder = await newOrder.save();

//     res.status(201).json({
//       success: true,
//       orderId: savedOrder._id,
//       paypalOrderId: paypalOrder.result.id,
//       approvalUrl
//     });
//   } catch (error) {
//     console.error('PayPal order creation error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create order',
//       error: error.message
//     });
//   }
// };

// // Capture PayPal Payment
// const captureOrder = async (req, res) => {
//   const { paypalOrderId, orderId } = req.body;

//   if (!paypalOrderId || !orderId) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing required parameters: paypalOrderId and orderId are required.'
//     });
//   }

//   try {
//     const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
//     request.requestBody({});

//     const capture = await client.execute(request);

//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     order.status = 'completed';
//     order.isPaid = true;
//     order.paymentDetails = capture.result;
//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: 'Payment captured successfully',
//       order
//     });
//   } catch (error) {
//     console.error('PayPal capture error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to capture payment',
//       error: error.message
//     });
//   }
// };

// // Get Items from Order
// const getOrderItems = async (req, res) => {
//   const { orderId } = req.params;

//   try {
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     res.status(200).json({
//       success: true,
//       items: order.books
//     });
//   } catch (error) {
//     console.error('Fetch order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch order items',
//       error: error.message
//     });
//   }
// };

// const getAllOrders = async (req, res) => {
//   const { orderId } = req.params;

//   try {
//     const order = await Order.find();
//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     res.status(200).json({
//       success: true,
//       items: order.books
//     });
//   } catch (error) {
//     console.error('Fetch order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch order items',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   createOrder,
//   captureOrder,
//   getOrderItems,
//   getAllOrders
// };


const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Cart = require('../models/cart');
const mongoose = require('mongoose');
require('dotenv').config();

// Setup PayPal environment
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Test user (replace with req.userId if using auth)
const testUserId = new mongoose.Types.ObjectId("686b694a0f3e82bea9025373");

// ========== CREATE ORDER FROM CART ==========
const createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: testUserId }).populate("items.book");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const books = cart.items.map(item => ({
      title: item.book.title,
      price: item.book.price,
      quantity: item.quantity
    }));

    const transactionRef = uuidv4();
    const totalAmount = books.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: transactionRef,
        description: `BookStore Order (Ref: ${transactionRef})`,
        amount: {
          currency_code: 'USD',
          value: totalAmount.toFixed(2)
        }
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
        brand_name: 'My BookStore',
        shipping_preference: 'NO_SHIPPING'
      }
    });

    const paypalOrder = await client.execute(request);
    const approvalUrl = paypalOrder.result.links.find(link => link.rel === 'approve')?.href;

    const newOrder = new Order({
      user: testUserId,
      books,
      totalAmount,
      status: 'pending',
      paymentMethod: 'paypal',
      orderNumber: `ORD-${Date.now()}`,
      paypalOrderId: paypalOrder.result.id,
      transactionRef
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      orderId: savedOrder._id,
      paypalOrderId: paypalOrder.result.id,
      approvalUrl
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// ========== CAPTURE PAYMENT ==========
const captureOrder = async (req, res) => {
  const { paypalOrderId, orderId } = req.body;

  if (!paypalOrderId || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: paypalOrderId and orderId are required.'
    });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await client.execute(request);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = 'completed';
    order.isPaid = true;
    order.paymentDetails = capture.result;
    await order.save();

    const cart = await Cart.findOne({ user: testUserId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment captured and cart cleared',
      order
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture payment',
      error: error.message
    });
  }
};

// ========== GET ORDER ITEMS ==========
const getOrderItems = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      items: order.books,
      user: order.user
    });
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order items',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  captureOrder,
  getOrderItems
};
