const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book.controller");
// This file defines the routes for book-related operations, such as adding a new book and retrieving all books.
router.post("/add", bookController.addBook);
router.get("/", bookController.getAllBooks);

module.exports = router;
