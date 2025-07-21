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



// GET /api/books?page=1&limit=8
exports.getAllBooks = async (req, res) => {

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const books = await Book.find().skip(skip).limit(limit);
    const totalCount = await Book.countDocuments();

    res.status(200).json({ books, totalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};