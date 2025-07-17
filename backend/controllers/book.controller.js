// const Book = require("../models/book.model");
// // this file is used to handle book-related operations, such as adding a new book and retrieving all books.
// exports.addBook = async (req, res) => {
//   try {
//     const { title, author, description, category, price, pdfUrl, coverImage } = req.body;
//     const newBook = new Book({
//       title,
//       author,
//       description,
//       category,
//       price,
//       pdfUrl,
//       coverImage
//     });

//     await newBook.save();
//     res.status(201).json({ message: "Book added successfully", book: newBook });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.getAllBooks = async (req, res) => {
//   try {
//     const books = await Book.find();
//     res.status(200).json(books);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
const Book = require("../models/book.model");
// this file is used to handle book-related operations, such as adding a new book and retrieving all books.
exports.addBook = async (req, res) => {
  try {
    const { title, author, description, category, price, pdfUrl, coverImage } = req.body;
    const newBook = new Book({
      title,
      author,
      description,
      category,
      price,
      pdfUrl,
      coverImage
    });

    await newBook.save();
    res.status(201).json({ message: "Book added successfully", book: newBook });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};