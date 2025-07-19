const Book = require("../models/book.model");

async function extractBookInfoWithCohere(text) {
    try {
        // Limit text length to avoid hitting Cohere's token limits and for performance
        // Consider increasing if you find crucial info is often beyond 6000 chars,
        // but be mindful of costs and latency.
        const limitedText = text.substring(0, 8000); // Increased slightly for more potential info

        // --- MODIFIED PROMPT ---
        const prompt = `Given the following book content, extract the TITLE, AUTHOR, DESCRIPTION, CATEGORY, PUBLISHER and PUBLICATION_DATE.
    If a field is not explicitly found, state "Not Found".
    try to extract it in 'MM-DD-YYYY' format if possible, otherwise 'Not Found'.
    For PRICE, extract the numerical value only (e.g., "29.99" not "$29.99"). If not found, state "Not Found".
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

        const response = await cohere.generate({
            prompt: prompt,
            max_tokens: 370, // May need to increase max_tokens slightly if output gets longer
            temperature: 0.3, // Keep temperature low for more deterministic extraction
            stop_sequences: ["}"], // Stop when the closing JSON brace is found
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
                publisher: "Not Found", // Add new fields
                publicationDate: "Not Found", // Add new fields
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
            ); // Remove non-numeric chars except dot, then parse
            if (isNaN(extractedPrice)) {
                extractedPrice = "Not Found"; // If parsing failed, set to "Not Found"
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
        } else {
            extractedPublicationDate = "Not Found";
        }

        return {
            title: parsedData.title || "Not Found",
            author: parsedData.author || "Not Found",
            description: parsedData.description || "Not Found",
            category: parsedData.category || "Not Found",
            publisher: parsedData.publisher || "Not Found", // Add new fields
            publicationDate: extractedPublicationDate, // Will be MM-DD-YYYY string or "Not Found"
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

// --- Controller Method: Process PDF and Get Data ---
exports.processPdfForAutofill = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded." });
    }

    const pdfPath = req.file.path;

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);

        if (!pdfData || !pdfData.text) {
            fs.unlinkSync(pdfPath); // Clean up temp file
            return res
                .status(400)
                .json({ message: "Could not extract text from PDF." });
        }

        const extractedText = pdfData.text;
        const bookInfo = await extractBookInfoWithCohere(extractedText);

        fs.unlinkSync(pdfPath); // Clean up temp file

        res.status(200).json(bookInfo);
    } catch (error) {
        console.error("Error in processPdfForAutofill:", error);
        if (req.file && fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath); // Ensure temp file is cleaned on error
        }
        res.status(500).json({
            message: "Failed to process PDF for autofill.",
            error: error.message,
        });
    }
};

// --- Add Book Controller ---
// exports.addBook = async (req, res) => {
//     try {
//         console.log("Backend: Attempting to add a new book.");

//         // Destructure necessary fields from req.body
//         const {
//             title,
//             author,
//             description,
//             category,
//             price,
//             publisher,
//             publicationDate,
//             // imageBase64 comes from req.body for base64 image uploads
//             // pdf comes via req.file from Multer
//             imageBase64,
//         } = req.body;

//         let pdfUrl = null;
//         let coverImage = null;

//         // --- Handle PDF File Logic (from req.file, handled by Multer) ---
//         // If a PDF file was uploaded with the request, req.file will contain its details.

//         if (req.file) {
//             const pdfFileName = req.file.filename;
//             const publicPdfUrl = `/uploads/pdfs/${pdfFileName}`;
//             bookData.pdfUrl = publicPdfUrl;
//             console.log(
//                 `Backend: PDF file processed, public URL: ${publicPdfUrl}`
//             );
//         } else {
//             console.log(
//                 "Backend: No PDF file found in req.file for this request."
//             );
//         }

//         // --- Handle Cover Image Logic (Base64) ---
//         // If imageBase64 string is provided, save it as a file.
//         if (imageBase64) {
//             console.log("Backend: Base64 cover image detected for new book.");
//             const imageUploadDir = path.join(
//                 __dirname,
//                 "../public/uploads/images"
//             );
//             // Ensure the directory exists before saving
//             if (!fs.existsSync(imageUploadDir)) {
//                 fs.mkdirSync(imageUploadDir, { recursive: true });
//             }
//             coverImage = saveBase64Image(imageBase64, imageUploadDir); // This helper saves the image and returns its relative path
//             console.log(`Backend: New cover image path created: ${coverImage}`);
//         }

//         // Create a new Book instance with the received data and file URLs
//         const newBook = new Book({
//             title,
//             author,
//             description,
//             category,
//             price,
//             publisher,
//             publicationDate,
//             pdfUrl: pdfUrl, // Assign the constructed PDF URL
//             coverImage: coverImage, // Assign the constructed cover image URL
//         });

//         // Save the new book document to MongoDB
//         const savedBook = await newBook.save();
//         console.log(`Backend: Successfully added new book: ${savedBook.title}`);

//         // Send a success response with the newly created book data
//         res.status(201).json({
//             message: "Book added successfully",
//             book: savedBook,
//         });
//     } catch (err) {
//         console.error("Backend: Error adding book:", err);

//         // If a file was uploaded by Multer and an error occurred during saving the book to DB,
//         // delete the uploaded file to prevent orphaned files.
//         if (req.file && fs.existsSync(req.file.path)) {
//             fs.unlinkSync(req.file.path);
//             console.log(
//                 `Backend: Cleaned up uploaded PDF file on add error: ${req.file.path}`
//             );
//         }
//         // Also consider cleaning up the image file if it was saved by saveBase64Image
//         // and an error occurred AFTER that but BEFORE book.save()

//         // Handle Mongoose validation errors specifically
//         if (err.name === "ValidationError") {
//             return res.status(400).json({ message: err.message });
//         }
//         // Generic error response
//         res.status(500).json({ error: err.message || "Failed to add book." });
//     }
// };
exports.addBook = async (req, res) => {
    try {
        console.log("Backend: Attempting to add a new book.");
        console.log("Received req.body:", req.body); // Check all form text fields
        console.log("Received req.file:", req.file); // THIS IS CRUCIAL FOR PDF

        // Destructure necessary fields from req.body
        const {
            title,
            author,
            description,
            category,
            price,
            publisher,
            publicationDate,
        } = req.body;
        const imageBase64 = req.body.imageBase64; // Will be null, empty string, or base64 string

        // Initialize book data object
        const bookData = {
            title,
            author,
            description,
            price,
            category,
            publisher,
            publicationDate,
        };

        // --- Handle PDF File Logic ---
        // req.file exists if a new PDF was uploaded
        if (req.file) {
            console.log("Backend: New PDF file detected.");
            // For adding, we just set the new PDF URL, no old one to delete
            bookData.pdfUrl = `/uploads/pdfs/${req.file.filename}`; // Set new PDF URL
        }
        // IMPORTANT: For 'add', if req.file is null, and req.body.pdf is explicitly empty string,
        // it means no PDF was chosen or it was explicitly cleared. In this case, pdfUrl remains null (default).
        else {
            console.log(
                "Backend: No PDF file found in req.file for this request, setting pdfUrl to null."
            );
            bookData.pdfUrl = null; // Explicitly set to null if no file uploaded
        }

        // --- Handle Cover Image Logic (Base64) ---
        // imageBase64 exists if a new image was uploaded (base64 string)
        if (imageBase64) {
            console.log("Backend: New Base64 cover image detected.");
            const imageUploadDir = path.join(
                __dirname,
                "../public/uploads/images"
            );
            // saveBase64Image already handles directory creation
            bookData.coverImage = saveBase64Image(imageBase64, imageUploadDir); // Save new image
        }
        // IMPORTANT: For 'add', if imageBase64 is null, and req.body.imageBase64 is explicitly empty string,
        // it means no image was chosen or it was explicitly cleared. In this case, coverImage remains null (default).
        else {
            console.log(
                "Backend: No Base64 cover image found, setting coverImage to null."
            );
            bookData.coverImage = null; // Explicitly set to null if no image uploaded
        }

        // Create a new Book instance with the collected data
        const newBook = new Book(bookData);
        const savedBook = await newBook.save();

        console.log("Backend: Successfully added new book:", savedBook.title);
        res.status(201).json(savedBook);
    } catch (error) {
        console.error("Backend: Error adding book:", error);
        // If a new PDF file was uploaded by Multer before an error occurred, delete it.
        // This cleans up orphaned files if the DB save fails.
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(
                `Backend: Cleaned up temp PDF file on add error: ${req.file.path}`
            );
        }
        if (error instanceof multer.MulterError) {
            return res
                .status(400)
                .json({ message: "Multer Error: " + error.message });
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

// --- Get All Books Controller ---
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        // Prepend full host URL for accessibility
        const booksWithFullUrls = books.map((book) => {
            return {
                ...book.toObject(),
                // Ensure req.headers.host is used for constructing full URLs for the frontend
                pdfUrl: book.pdfUrl
                    ? `http://${req.headers.host}${book.pdfUrl}`
                    : null,
                coverImage: book.coverImage
                    ? `http://${req.headers.host}${book.coverImage}`
                    : null,
            };
        });
        res.status(200).json(booksWithFullUrls);
    } catch (err) {
        console.error("Error fetching books:", err);
        res.status(500).json({ error: err.message || "Failed to fetch books" });
    }
};

// --- NEW: Get Book by ID Controller (For Edit Form) ---
exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Backend: Attempting to fetch book with ID: ${id}`);
        const book = await Book.findById(id);

        if (!book) {
            console.log(`Backend: Book with ID ${id} not found.`);
            return res.status(404).json({ message: "Book not found." });
        }

        // Prepend full host URL for the frontend for existing files
        const bookWithFullUrls = {
            ...book.toObject(),
            pdfUrl: book.pdfUrl
                ? `http://${req.headers.host}${book.pdfUrl}`
                : null,
            coverImage: book.coverImage
                ? `http://${req.headers.host}${book.coverImage}`
                : null,
        };

        console.log(`Backend: Successfully fetched book: ${book.title}`);
        res.status(200).json(bookWithFullUrls);
    } catch (err) {
        console.error("Backend: Error fetching book by ID:", err);
        if (err.name === "CastError") {
            // Mongoose error for invalid ID format
            return res.status(400).json({ message: "Invalid book ID format." });
        }
        res.status(500).json({ error: err.message || "Failed to fetch book." });
    }
};

// --- UPDATED: Update Book Controller ---
exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Backend: Attempting to update book with ID: ${id}`);

        // Destructure necessary fields from req.body
        const {
            title,
            author,
            description,
            category,
            price,
            publisher,
            publicationDate,
        } = req.body;
        // imageBase64 will be directly used for new uploads or null/empty string for removal
        const imageBase64 = req.body.imageBase64; // Will be null, empty string, or base64 string

        // Find the existing book to get current file paths and potentially delete old files
        const existingBook = await Book.findById(id);
        if (!existingBook) {
            console.log(`Backend: Book with ID ${id} not found for update.`);
            return res.status(404).json({ message: "Book not found." });
        }

        // Prepare fields to update
        const updateFields = {
            title,
            author,
            description,
            category,
            price,
            publisher,
            publicationDate,
        };

        // --- Handle PDF File Logic ---
        // req.file exists if a new PDF was uploaded
        if (req.file) {
            console.log("Backend: New PDF file detected.");
            // Delete old PDF if it exists
            if (existingBook.pdfUrl) {
                const oldPdfPath = path.join(
                    __dirname,
                    "../public",
                    existingBook.pdfUrl
                );
                if (fs.existsSync(oldPdfPath)) {
                    fs.unlinkSync(oldPdfPath);
                    console.log(`Backend: Deleted old PDF: ${oldPdfPath}`);
                }
            }
            updateFields.pdfUrl = `/uploads/pdfs/${req.file.filename}`; // Set new PDF URL
        }
        // Check if the frontend explicitly sent 'pdf' as an empty string (meaning "remove current PDF")
        // Frontend sends an empty string for the 'pdf' FormData field when user clears the file input
        else if (req.body.pdf === "") {
            // IMPORTANT: Check for empty string (or 'null' as string) from FormData
            console.log("Backend: PDF explicitly marked for removal.");
            if (existingBook.pdfUrl) {
                const oldPdfPath = path.join(
                    __dirname,
                    "../public",
                    existingBook.pdfUrl
                );
                if (fs.existsSync(oldPdfPath)) {
                    fs.unlinkSync(oldPdfPath);
                    console.log(
                        `Backend: Deleted old PDF due to explicit client request: ${oldPdfPath}`
                    );
                }
            }
            updateFields.pdfUrl = null; // Set PDF URL to null in DB
        }
        // If req.file is null and req.body.pdf is not an empty string,
        // it means the PDF was not touched, so pdfUrl in updateFields remains undefined,
        // and Mongoose will not update it, preserving the existing one.

        // --- Handle Cover Image Logic (Base64) ---
        // imageBase64 exists if a new image was uploaded (base64 string)
        if (imageBase64) {
            console.log("Backend: New Base64 cover image detected.");
            // Delete old image if it exists
            if (existingBook.coverImage) {
                const oldImagePath = path.join(
                    __dirname,
                    "../public",
                    existingBook.coverImage
                );
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log(
                        `Backend: Deleted old cover image: ${oldImagePath}`
                    );
                }
            }
            const imageUploadDir = path.join(
                __dirname,
                "../public/uploads/images"
            );
            if (!fs.existsSync(imageUploadDir)) {
                fs.mkdirSync(imageUploadDir, { recursive: true });
            }
            updateFields.coverImage = saveBase64Image(
                imageBase64,
                imageUploadDir
            ); // Save new image
        }
        // Check if the frontend explicitly sent 'imageBase64' as an empty string (meaning "remove current image")
        else if (req.body.imageBase64 === "") {
            // IMPORTANT: Check for empty string (or 'null' as string) from FormData
            console.log("Backend: Cover image explicitly marked for removal.");
            if (existingBook.coverImage) {
                const oldImagePath = path.join(
                    __dirname,
                    "../public",
                    existingBook.coverImage
                );
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log(
                        `Backend: Deleted old cover image due to explicit client request: ${oldImagePath}`
                    );
                }
            }
            updateFields.coverImage = null; // Set coverImage to null in DB
        }
        // If imageBase64 is undefined/null and req.body.imageBase64 is not an empty string,
        // it means the image was not touched, so coverImage in updateFields remains undefined,
        // preserving the existing one.

        // Perform the update
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            updateFields, // Use the prepared fields
            { new: true, runValidators: true } // Return the updated document and run Mongoose validators
        );

        if (!updatedBook) {
            console.log(
                `Backend: Book with ID ${id} not found after update attempt (this shouldn't happen if existingBook was found).`
            );
            return res
                .status(404)
                .json({ message: "Book not found after update attempt." });
        }

        console.log(`Backend: Successfully updated book: ${updatedBook.title}`);
        res.status(200).json({
            message: "Book updated successfully",
            book: updatedBook,
        });
    } catch (err) {
        console.error("Backend: Error updating book:", err);
        // If a new file was uploaded during the update and an error occurred, delete it.
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(
                `Backend: Cleaned up temp PDF file on update error: ${req.file.path}`
            );
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

// --- UPDATED: Delete Book Controller ---
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
                fs.unlinkSync(pdfFilePath);
                console.log(`Backend: Deleted PDF file: ${pdfFilePath}`);
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
                fs.unlinkSync(imageFilePath);
                console.log(
                    `Backend: Deleted cover image file: ${imageFilePath}`
                );
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
