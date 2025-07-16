 const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

// this file is used to set up the server, connect to the database, and define routes
// It imports necessary modules, sets up middleware, and starts the server on a specified port.
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); 

