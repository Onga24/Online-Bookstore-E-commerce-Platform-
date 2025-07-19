// book.controller.js

const Book = require("../models/book.model");
const fs = require("fs");
const pdfParse = require('pdf-parse');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// --- CORRECTED COHERE API INITIALIZATION ---
// This is the most common and current way to initialize for cohere-ai versions 5.x.x and newer.
// It uses a named import `CohereClient` from the package.
const { CohereClient } = require('cohere-ai');
const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY, // Ensure COHERE_API_KEY is in your .env file
});


// Helper function to save base64 encoded images to disk
function saveBase64Image(base64String, uploadDir) {
    // ... (rest of the saveBase64Image function remains the same) ...
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image string format.');
    }

    const imageType = matches[1];
    const imageData = matches[2];

    let fileExtension;
    if (imageType.includes('image/png')) {
        fileExtension = 'png';
    } else if (imageType.includes('image/jpeg')) {
        fileExtension = 'jpeg';
    } else if (imageType.includes('image/jpg')) {
        fileExtension = 'jpg';
    } else {
        throw new Error(`Unsupported image type: ${imageType}`);
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));

    return `/uploads/images/${filename}`;
}


async function extractBookInfoWithCohere(text) {
    try {
        const limitedText = text.substring(0, 8000);

        const allowedCategories = [
            "Fiction",
            "Non-fiction",
            "Science Fiction",
            "Fantasy",
            "Mystery",
            "Thriller",
            "Horror",
            "Romance",
            "Drama",
            "Comedy",
            "History",
            "Science",
            "Technology",
            "Education",
            "Self-help",
            "Business",
            "Art",
            "Cooking",
            "Travel",
            "Health"
           
        ];

        const prompt = `Given the following book content, extract the TITLE, AUTHOR, DESCRIPTION, CATEGORY, PUBLISHER and PUBLICATION_DATE.
    If a field is not explicitly found, state "Not Found".
    try to extract PUBLICATION_DATE in 'MM-DD-YYYY' format if possible, otherwise 'Not Found'.
    For PRICE, extract the numerical value only (e.g., "29.99" not "$29.99"). If not found, state "Not Found".
    For CATEGORY, choose only from the following list: ${allowedCategories.join(', ')}. If the content does not clearly fit any of these, state "Not Found".
    Be concise. Do not include any other text or explanation. Only provide the JSON object.

    Content:
    "${limitedText}"

    Output in JSON format:
    {
      "title": "...",
      "author": "...",
      "description": "...",
      "category": "...",
      "publisher": "...",
      "publicationDate": "...",
      "price": "..."
    }`;

        // Ensure 'cohere' object is correctly initialized before calling generate
        // The generate method is typically directly on the CohereClient instance
        const response = await cohere.generate({ // Use 'cohere' directly here
            prompt: prompt,
            max_tokens: 370,
            temperature: 0.3,
            stop_sequences: ["}"],
        });

        if (
            !response ||
            !response.generations ||
            response.generations.length === 0
        ) {
            console.error(
                "Cohere API did not return valid generations:",
                JSON.stringify(response, null, 2)
            );
            return {
                title: "Not Found",
                author: "Not Found",
                description: "Not Found",
                category: "Not Found",
                publisher: "Not Found",
                publicationDate: "Not Found",
                price: "Not Found",
            };
        }

        const generatedText = response.generations[0].text.trim();
        let parsedData = {};
        try {
            const jsonStartIndex = generatedText.indexOf("{");
            const jsonEndIndex = generatedText.lastIndexOf("}");
            if (
                jsonStartIndex !== -1 &&
                jsonEndIndex !== -1 &&
                jsonEndIndex > jsonStartIndex
            ) {
                const jsonString = generatedText.substring(
                    jsonStartIndex,
                    jsonEndIndex + 1
                );
                parsedData = JSON.parse(jsonString);
            } else {
                console.error(
                    "Cohere response did not contain a valid JSON object or was malformed:",
                    generatedText
                );
                return {
                    title: "Not Found",
                    author: "Not Found",
                    description: "Not Found",
                    category: "Not Found",
                    publisher: "Not Found",
                    publicationDate: "Not Found",
                    price: "Not Found",
                };
            }
        } catch (parseError) {
            console.error(
                "Error parsing Cohere JSON response:",
                parseError,
                "Raw response:",
                generatedText
            );
            return {
                title: "Not Found",
                author: "Not Found",
                description: "Not Found",
                category: "Not Found",
                publisher: "Not Found",
                publicationDate: "Not Found",
                price: "Not Found",
            };
        }
        let extractedPrice = parsedData.price;
        if (
            extractedPrice !== "Not Found" &&
            extractedPrice !== undefined &&
            extractedPrice !== null
        ) {
            extractedPrice = parseFloat(
                String(extractedPrice).replace(/[^0-9.]/g, "")
            );
            if (isNaN(extractedPrice)) {
                extractedPrice = "Not Found";
            }
        } else {
            extractedPrice = "Not Found";
        }

        let extractedPublicationDate = parsedData.publicationDate;
        if (
            extractedPublicationDate !== "Not Found" &&
            extractedPublicationDate !== undefined &&
            extractedPublicationDate !== null
        ) {
            // No specific formatting logic here, just pass it through
        } else {
            extractedPublicationDate = "Not Found";
        }

        return {
            title: parsedData.title || "Not Found",
            author: parsedData.author || "Not Found",
            description: parsedData.description || "Not Found",
            category: parsedData.category || "Not Found",
            publisher: parsedData.publisher || "Not Found",
            publicationDate: extractedPublicationDate,
            price: extractedPrice,
        };
    } catch (error) {
        if (error.response) {
            console.error(
                "Cohere API Error Response Data:",
                error.response.data
            );
        } else if (error.message) {
            console.error("Cohere API Error (message):", error.message);
        } else {
            console.error("Unknown Cohere API Error:", error);
        }
        return {
            title: "Not Found",
            author: "Not Found",
            description: "Not Found",
            category: "Not Found",
            publisher: "Not Found",
            publicationDate: "Not Found",
            price: "Not Found",
        };
    }
}

// Controller Method: Process PDF and Get Data
exports.processPdfForAutofill = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded." });
    }

    const pdfPath = req.file.path;

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);

        if (!pdfData || !pdfData.text) {
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
            return res
                .status(400)
                .json({ message: "Could not extract text from PDF." });
        }

        const extractedText = pdfData.text;
        const bookInfo = await extractBookInfoWithCohere(extractedText);

        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }

        res.status(200).json(bookInfo);
    } catch (error) {
        console.error("Error in processPdfForAutofill:", error);
        if (req.file && fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
            console.log(`Cleaned up temp PDF file on error: ${pdfPath}`);
        }
        res.status(500).json({
            message: "Failed to process PDF for autofill.",
            error: error.message,
        });
    }
};

// Add Book Controller
exports.addBook = async (req, res) => {
    try {
        console.log("Backend: Attempting to add a new book.");
        console.log("Received req.body:", req.body);
        console.log("Received req.file:", req.file);

        const {
            title,
            author,
            description,
            category,
            price,
            publisher,
            publicationDate,
        } = req.body;
        const imageBase64 = req.body.imageBase64;

        const bookData = {
            title,
            author,
            description,
            price,
            category,
            publisher,
            publicationDate,
        };

        let savedImagePath = null;

        // Handle PDF File Logic
        if (req.file) {
            console.log("Backend: New PDF file detected.");
            bookData.pdfUrl = `/uploads/pdfs/${req.file.filename}`;
        } else {
            console.log("Backend: No PDF file found in req.file for this request, setting pdfUrl to null.");
            bookData.pdfUrl = null;
        }

        // Handle Cover Image Logic (Base64)
        if (imageBase64) {
            console.log("Backend: New Base64 cover image detected.");
            const imageUploadDir = path.join(
                __dirname,
                "../public/uploads/images"
            );
            savedImagePath = saveBase64Image(imageBase64, imageUploadDir);
            bookData.coverImage = savedImagePath;
        } else {
            console.log("Backend: No Base64 cover image found, setting coverImage to null.");
            bookData.coverImage = null;
        }

        const newBook = new Book(bookData);
        const savedBook = await newBook.save();

        console.log("Backend: Successfully added new book:", savedBook.title);
        res.status(201).json(savedBook);
    } catch (error) {
        console.error("Backend: Error adding book:", error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(`Backend: Cleaned up uploaded PDF file on add error: ${req.file.path}`);
        }

        if (savedImagePath && fs.existsSync(path.join(__dirname, '../public', savedImagePath))) {
            fs.unlinkSync(path.join(__dirname, '../public', savedImagePath));
            console.log(`Backend: Cleaned up uploaded image file on add error: ${savedImagePath}`);
        }

        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: "Multer Error: " + error.message });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({
            message: "Failed to add book",
            error: error.message,
        });
    }
};

// Get All Books Controller
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        const booksWithFullUrls = books.map((book) => {
            const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'http');
            const host = req.headers.host;

            return {
                ...book.toObject(),
                pdfUrl: book.pdfUrl
                    ? `${protocol}://${host}${book.pdfUrl}`
                    : null,
                coverImage: book.coverImage
                    ? `${protocol}://${host}${book.coverImage}`
                    : null,
            };
        });
        res.status(200).json(booksWithFullUrls);
    } catch (err) {
        console.error("Error fetching books:", err);
        res.status(500).json({ error: err.message || "Failed to fetch books" });
    }
};

// Get Book by ID Controller (For Edit Form)
exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Backend: Attempting to fetch book with ID: ${id}`);
        const book = await Book.findById(id);

        if (!book) {
            console.log(`Backend: Book with ID ${id} not found.`);
            return res.status(404).json({ message: "Book not found." });
        }

        const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'http');
        const host = req.headers.host;

        const bookWithFullUrls = {
            ...book.toObject(),
            pdfUrl: book.pdfUrl
                ? `${protocol}://${host}${book.pdfUrl}`
                : null,
            coverImage: book.coverImage
                ? `${protocol}://${host}${book.coverImage}`
                : null,
        };

        console.log(`Backend: Successfully fetched book: ${book.title}`);
        res.status(200).json(bookWithFullUrls);
    } catch (err) {
        console.error("Backend: Error fetching book by ID:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid book ID format." });
        }
        res.status(500).json({ error: err.message || "Failed to fetch book." });
    }
};

// Update Book Controller
exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Backend: Attempting to update book with ID: ${id}`);

        const {
            title,
            author,
            description,
            category,
            price,
            publisher,
            publicationDate,
        } = req.body;
        const imageBase64 = req.body.imageBase64;

        const existingBook = await Book.findById(id);
        if (!existingBook) {
            console.log(`Backend: Book with ID ${id} not found for update.`);
            return res.status(404).json({ message: "Book not found." });
        }

        const updateFields = {
            title,
            author,
            description,
            category,
            price,
            publisher,
            publicationDate,
        };

        let newSavedImagePath = null;

        // Handle PDF File Logic
        if (req.file) {
            console.log("Backend: New PDF file detected during update.");
            if (existingBook.pdfUrl) {
                const oldPdfPath = path.join(__dirname, "../public", existingBook.pdfUrl);
                if (fs.existsSync(oldPdfPath)) {
                    try {
                        fs.unlinkSync(oldPdfPath);
                        console.log(`Backend: Deleted old PDF: ${oldPdfPath}`);
                    } catch (unlinkErr) {
                        console.error(`Error deleting old PDF file ${oldPdfPath}:`, unlinkErr);
                    }
                }
            }
            updateFields.pdfUrl = `/uploads/pdfs/${req.file.filename}`;
        } else if (req.body.pdf === "") {
            console.log("Backend: PDF explicitly marked for removal during update.");
            if (existingBook.pdfUrl) {
                const oldPdfPath = path.join(__dirname, "../public", existingBook.pdfUrl);
                if (fs.existsSync(oldPdfPath)) {
                    try {
                        fs.unlinkSync(oldPdfPath);
                        console.log(`Backend: Deleted old PDF due to explicit client request: ${oldPdfPath}`);
                    } catch (unlinkErr) {
                        console.error(`Error deleting old PDF file ${oldPdfPath}:`, unlinkErr);
                    }
                }
            }
            updateFields.pdfUrl = null;
        }

        // Handle Cover Image Logic (Base64)
        if (imageBase64) {
            console.log("Backend: New Base64 cover image detected during update.");
            if (existingBook.coverImage) {
                const oldImagePath = path.join(__dirname, "../public", existingBook.coverImage);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                        console.log(`Backend: Deleted old cover image: ${oldImagePath}`);
                    } catch (unlinkErr) {
                        console.error(`Error deleting old cover image ${oldImagePath}:`, unlinkErr);
                    }
                }
            }
            const imageUploadDir = path.join(__dirname, "../public/uploads/images");
            newSavedImagePath = saveBase64Image(imageBase64, imageUploadDir);
            updateFields.coverImage = newSavedImagePath;
        } else if (req.body.imageBase64 === "") {
            console.log("Backend: Cover image explicitly marked for removal during update.");
            if (existingBook.coverImage) {
                const oldImagePath = path.join(__dirname, "../public", existingBook.coverImage);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                        console.log(`Backend: Deleted old cover image due to explicit client request: ${oldImagePath}`);
                    } catch (unlinkErr) {
                        console.error(`Error deleting old cover image ${oldImagePath}:`, unlinkErr);
                    }
                }
            }
            updateFields.coverImage = null;
        }

        const updatedBook = await Book.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            console.log(`Backend: Book with ID ${id} not found after update attempt.`);
            return res.status(404).json({ message: "Book not found after update attempt." });
        }

        console.log(`Backend: Successfully updated book: ${updatedBook.title}`);
        res.status(200).json({
            message: "Book updated successfully",
            book: updatedBook,
        });
    } catch (err) {
        console.error("Backend: Error updating book:", err);

        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`Backend: Cleaned up new PDF file on update error: ${req.file.path}`);
            } catch (unlinkErr) {
                console.error(`Error cleaning up new PDF file ${req.file.path}:`, unlinkErr);
            }
        }

        if (newSavedImagePath && fs.existsSync(path.join(__dirname, '../public', newSavedImagePath))) {
            try {
                fs.unlinkSync(path.join(__dirname, '../public', newSavedImagePath));
                console.log(`Backend: Cleaned up new image file on update error: ${newSavedImagePath}`);
            } catch (unlinkErr) {
                console.error(`Error cleaning up new image file ${newSavedImagePath}:`, unlinkErr);
            }
        }

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid book ID format." });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({
            error: err.message || "Failed to update book.",
        });
    }
};

// Delete Book Controller
exports.deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Backend: Attempting to delete book with ID: ${id}`);

        const bookToDelete = await Book.findById(id);

        if (!bookToDelete) {
            console.log(`Backend: Book with ID ${id} not found for deletion.`);
            return res.status(404).json({ message: "Book not found." });
        }

        // Delete associated PDF file from the server
        if (bookToDelete.pdfUrl) {
            const pdfFilePath = path.join(
                __dirname,
                "../public",
                bookToDelete.pdfUrl
            );
            if (fs.existsSync(pdfFilePath)) {
                try {
                    fs.unlinkSync(pdfFilePath);
                    console.log(`Backend: Deleted PDF file: ${pdfFilePath}`);
                } catch (err) {
                    console.error(`Error deleting PDF file ${pdfFilePath}:`, err);
                }
            } else {
                console.log(
                    `Backend: PDF file not found at path for deletion: ${pdfFilePath}`
                );
            }
        }

        // Delete associated cover image file from the server
        if (bookToDelete.coverImage) {
            const imageFilePath = path.join(
                __dirname,
                "../public",
                bookToDelete.coverImage
            );
            if (fs.existsSync(imageFilePath)) {
                try {
                    fs.unlinkSync(imageFilePath);
                    console.log(
                        `Backend: Deleted cover image file: ${imageFilePath}`
                    );
                } catch (err) {
                    console.error(`Error deleting cover image file ${imageFilePath}:`, err);
                }
            } else {
                console.log(
                    `Backend: Cover image file not found at path for deletion: ${imageFilePath}`
                );
            }
        }

        // Delete the book from the database
        await Book.findByIdAndDelete(id);
        console.log(`Backend: Successfully deleted book from DB: ${id}`);

        res.status(200).json({ message: "Book deleted successfully." });
    } catch (err) {
        console.error("Backend: Error deleting book:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid book ID format." });
        }
        res.status(500).json({
            error: err.message || "Failed to delete book.",
        });
    }
};