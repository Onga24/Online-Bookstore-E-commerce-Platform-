// app.js
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const connectDB = require("./config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Required for fs.existsSync, fs.mkdirSync


const bookController = require("./controllers/book.controller");

// FIX for MongoDB Atlas URI: Use the provided URI
const ATLAS_URI =
    process.env["MONGO_URI"] ||
    "mongodb+srv://ongamohamed89:Bondok23@cluster0.mzgdznh.mongodb.net/EBooks.Books";
connectDB(ATLAS_URI); // Pass the URI to connectDB

const app = express();

app.use(cors());
app.use(express.json());

// --- Multer Configuration for PDF Processing Upload ---
const tempPdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public/temp_pdfs"); // Temporary storage
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const uploadTempPdf = multer({
    storage: tempPdfStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed for processing!"), false);
        }
    },
    limits: { fileSize: 1024 * 1024 * 20 }, // 20MB limit for processing PDF
});

// --- Multer Configuration for Final PDF Storage (used by addBook) ---
const finalPdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public/uploads/pdfs");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const uploadFinalPdf = multer({
    storage: finalPdfStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(
                new Error("Only PDF files are allowed for final storage!"),
                false
            );
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 10, // 10MB file size limit for PDF
        // --- ADD THIS LINE for imageBase64 field ---
        fieldSize: 1024 * 1024 * 20, // 20MB limit for general fields, including base64 image string
    },
});

// --- Serve Static Files ---
// This is good for both PDFs and Images.
// Make sure you also serve images from public/uploads/images if needed
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// --- Define Routes ---
// This line is PERFECTly matched with exports.processPdfForAutofill
app.post(
    "/api/books/process-pdf",
    uploadTempPdf.single("pdf"),
    bookController.processPdfForAutofill
);

// This line is PERFECTly matched with exports.addBook
app.post(
    "/api/books/add",
    uploadFinalPdf.single("pdf"),
    bookController.addBook
);

// This line is PERFECTly matched with exports.getAllBooks
app.get("/api/books", bookController.getAllBooks);

app.get("/api/books/:id", bookController.getBookById);

// Route to update a book by ID
// We use 'uploadFinalPdf.single('pdf')' here as well, because a book update
// might include uploading a new PDF or cover image.
// If no new file is uploaded, the existing file path will likely be retained
// in the book data sent from the client.
app.put(
    "/api/books/:id",
    uploadFinalPdf.single("pdf"),
    bookController.updateBook
);

// Route to delete a book by ID
app.delete("/api/books/:id", bookController.deleteBook);

app.get("/", (req, res) => {
    res.send("Welcome to the Book API!");
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error("*** MULTER ERROR CAUGHT ***");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Field:", err.field); // The name of the form field where the error occurred
        return res.status(400).json({
            message: `File upload error: ${err.message}`,
            code: err.code,
            field: err.field,
        });
    }
    // Pass other errors to the default error handler
    next(err);
});
const PORT = process.env["PORT"] || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
