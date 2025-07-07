const mongoose = require("mongoose");
// This module exports a function to connect to MongoDB using Mongoose.
// It uses the connection string from the environment variable MONGO_URI.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
