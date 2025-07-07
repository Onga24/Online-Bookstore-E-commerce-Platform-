 const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
// this file is used to set up the server, connect to the database, and define routes
// It imports necessary modules, sets up middleware, and starts the server on a specified port.
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", require("./routes/user.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); 

app.use("/api/books", require("./routes/book.routes"));
