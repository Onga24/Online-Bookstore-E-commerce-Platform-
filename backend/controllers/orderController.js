// const Order = require("../models/Order");
// const paypal = require("@paypal/checkout-server-sdk"); // ✅ Correct SDK
// require("dotenv").config();

// // Setup PayPal Environment
// const environment = new paypal.core.SandboxEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_CLIENT_SECRET
// );
// const client = new paypal.core.PayPalHttpClient(environment);

// // Create Order in DB
// exports.createOrder = async (req, res) => {
//   try {
//     const { items } = req.body;

//     const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//     const order = new Order({ items, totalAmount });

//     await order.save();

//     res.status(201).json(order);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Checkout with PayPal
const checkoutOrder = async (req, res) => {
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

// // Checkout with PayPal
// exports.checkoutOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer("return=representation");
//     request.requestBody({
//       intent: "CAPTURE",
//       purchase_units: [
//         {
//           amount: {
//             currency_code: "USD",
//             value: order.totalAmount.toFixed(2),
//           },
//         },
//       ],
//     });

//     const response = await client.execute(request);

//     // Extract approval URL
//     const approvalLink = response.result.links.find(link => link.rel === "approve");

//     res.status(200).json({
//       paypalOrderId: response.result.id,
//       approvalUrl: approvalLink.href,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// // Capture PayPal Payment
// exports.capturePayment = async (req, res) => {
//   try {
//     const { paypalOrderId, orderId } = req.body;

//     const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
//     request.requestBody({});

//     const capture = await client.execute(request);

//     // Update order in DB
//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     order.isPaid = true;
//     order.paymentId = paypalOrderId;
//     await order.save();

//     res.status(200).json({ success: true, capture });
//   } catch (err) {
//     res.status(500).json({ error: err.stack});
//   }
// };

// require('dotenv').config();
// const paypal = require('@paypal/checkout-server-sdk');
// const { v4: uuidv4 } = require('uuid');
// const { client } = require('../services/paypalService');
// const Order = require('../models/Order.js');


// const createOrder = async (req, res) => {
//     const { books, totalAmount } = req.body;
//     if (!books || !books.length ) {
//         return res.status(400).json({ success: false, message: 'Missing required order data: books and totalPrice are required.' });
//     }

//     // const userId = res.locals.userid;
//     const transactionRef = uuidv4();

//     try {
      
//         const request = new paypal.orders.OrdersCreateRequest();
//         request.prefer('return=representation');

        
//         const paypalItems = books.map(book => ({
//             name: book.title, // SR DEV: Use a descriptive name, not just an ID.
//             unit_amount: {
//                 currency_code: 'USD',
//                 value: book.price.toFixed(2),
//             },
//             quantity: book.quantity.toString(),
//         }));

//         const itemTotal = books.reduce((sum, item) => sum + (item.price * item.quantity), 0);


      

//         request.requestBody({
//             intent: 'CAPTURE',
//             purchase_units: [{
//                 reference_id: transactionRef,
//                 description: `Your order from BookStore (Ref: ${transactionRef})`,
//                 amount: {
//                     currency_code: 'USD',
//                     value: itemTotal.toFixed(2),
//                     breakdown: {
//                         item_total: {
//                             currency_code: 'USD',
//                             value: itemTotal.toFixed(2),
//                         },
                        
//                     },
//                 },
//                 items: paypalItems,
//                 // SR DEV: Conditionally add shipping only if the address exists.
//                 // ...(shippingAddress && {
//                 //     shipping: {
//                 //         name: {
//                 //             full_name: shippingAddress.fullName || 'Guest User'
//                 //         },
//                 //         address: {
//                 //             address_line_1: shippingAddress.street,
//                 //             admin_area_2: shippingAddress.city,
//                 //             admin_area_1: shippingAddress.state,
//                 //             postal_code: shippingAddress.zipCode,
//                 //             country_code: 'US', // SR DEV: Standardize country codes.
//                 //         },
//                 //     },
//                 // }),
//             }],
//             application_context: {
//                 // SR DEV: These URLs are critical. They tell PayPal where to send the user
//                 // after they approve or cancel the payment on the PayPal site.
//                 return_url: `${process.env.FRONTEND_URL}/payment-success`,
//                 cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
//                 brand_name: 'My Awesome BookStore',
//                 shipping_preference: 'SET_PROVIDED_ADDRESS', // SR DEV: Use the address you provide.
//             },
//         });

//         const paypalOrder = await client().execute(request);

//         // SR DEV: Now that the PayPal order is successfully created, save our internal order.
//         // This links our system's order with PayPal's.
//         const newOrder = new Order({
//             // userId,
//             books,
//             totalAmount: itemTotal, // SR DEV: Save the server-calculated total.
//             status: 'pending', // The order is pending until payment is captured.
//             paymentMethod:  'paypal',
//             orderNumber: `ORD-${Date.now()}`,
//             paypalOrderId: paypalOrder.result.id, // This is the crucial link.
//             transactionRef,
//         });

//         const savedOrder = await newOrder.save();

//         // SR DEV: Send a clean, predictable response to the client. The only thing
//         // the client needs now is the URL to redirect the user to.
//         res.status(201).json({
//             success: true,
//             message: 'Order initiated. Please approve payment.',
//             approvalUrl: paypalOrder.result.links.find(link => link.rel === 'approve').href,
//         });

//     } catch (error) {
//         console.error('Failed to create order:', error);
//         // SR DEV: Provide a generic but helpful error message. Avoid leaking
//         // implementation details like `error.message` in production.
//         res.status(500).json({
//             success: false,
//             message: 'Could not initiate PayPal payment. Please try again later.',
//             // SR DEV: Optionally provide a reference ID for support tickets.
//             errorId: uuidv4(),
//         });
//     }
// };

// const captureOrder = async (req, res) => {
//    const { books, totalAmount: clientTotal, paymentMethod = 'paypal' } = req.body;

//   if (!books || !books.length) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing required order data: books and totalAmount are required.'
//     });
//   }

//   const transactionRef = uuidv4();

//   try {
//     const paypalItems = books.map(book => ({
//       name: book.title,
//       unit_amount: {
//         currency_code: 'USD',
//         value: book.price.toFixed(2),
//       },
//       quantity: book.quantity.toString(),
//     }));

//     const itemTotal = books.reduce((sum, item) => sum + (item.price * item.quantity), 0);

//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer('return=representation');
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [{
//         reference_id: transactionRef,
//         description: `Your order from BookStore (Ref: ${transactionRef})`,
//         amount: {
//           currency_code: 'USD',
//           value: itemTotal.toFixed(2),
//           breakdown: {
//             item_total: {
//               currency_code: 'USD',
//               value: itemTotal.toFixed(2),
//             },
//           },
//         },
//         items: paypalItems,
//       }],
//       application_context: {
//         return_url: `${process.env.FRONTEND_URL}/payment-success`,
//         cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
//         brand_name: 'My Awesome BookStore',
//         shipping_preference: 'NO_SHIPPING',
//       },
//     });

//     const paypalOrder = await client().execute(request);

//     const newOrder = new Order({
//       books,
//       totalAmount: itemTotal, // ✅ renamed to match schema
//       status: 'pending',
//       paymentMethod,
//       orderNumber: `ORD-${Date.now()}`,
//       paypalOrderId: paypalOrder.result.id,
//       transactionRef,
//     });

//     await newOrder.save();

//     const approvalUrl = paypalOrder.result.links.find(link => link.rel === 'approve')?.href;

//     res.status(201).json({
//       success: true,
//       message: 'Order initiated. Please approve payment.',
//       approvalUrl,
//     });

//   } catch (error) {
//     console.error('Failed to create PayPal order:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Could not initiate PayPal payment. Please try again later.',
//       errorId: uuidv4(),
//     });
//   }
// };

// module.exports = {
//     createOrder,
//     captureOrder,
//     checkoutOrder
// };
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
require('dotenv').config();

// Set up PayPal environment
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal Order and Save to DB
const createOrder = async (req, res) => {
  const { books } = req.body;

  if (!books || !Array.isArray(books) || books.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid order data: books are required.'
    });
  }

  const transactionRef = uuidv4();
  const totalAmount = books.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
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

    // Save order to DB
    const newOrder = new Order({
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

// Capture PayPal Payment
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

    res.status(200).json({
      success: true,
      message: 'Payment captured successfully',
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

// Get Items from Order
const getOrderItems = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      items: order.books
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
