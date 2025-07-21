<<<<<<< HEAD
// const express = require("express");
// const router = express.Router();
// const bookController = require("../controllers/book.controller");
// // This file defines the routes for book-related operations, such as adding a new book and retrieving all books.
// router.post("/add", bookController.addBook);
// router.get("/", bookController.getAllBooks);

// module.exports = router;
=======
>>>>>>> feature/my-aws-s3-integration
const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book.controller");
// This file defines the routes for book-related operations, such as adding a new book and retrieving all books.
router.post("/add", bookController.addBook);
router.get("/", bookController.getAllBooks);

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> feature/my-aws-s3-integration
