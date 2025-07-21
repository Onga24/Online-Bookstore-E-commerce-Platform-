// book.controller.js
const Book = require("../models/book.model");
const fs = require("fs"); // Still needed for temporary PDF cleanup
const pdfParse = require('pdf-parse');
const path = require('path'); // Still useful for path.join for temp files
require('dotenv').config(); // Ensure dotenv is loaded here too for AWS credentials

// --- AWS SDK v3 Imports ---
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage"); // For managed multipart uploads

// --- COHERE API INITIALIZATION ---
const { CohereClient } = require('cohere-ai');
const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY, // Ensure COHERE_API_KEY is in your .env file
});

// --- AWS S3 Configuration (AWS SDK v3) ---
const s3Client = new S3Client({ // Initialize S3Client from v3 SDK
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION; // Still useful for constructing URLs if needed, though data.Location is preferred


// Helper function to save base64 encoded images to S3 using AWS SDK v3's Upload
async function saveBase64ImageToS3(base64String, folder = 'images') {
    if (!base64String) {
        return null;
    }

    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image string format.');
    }

    const imageType = matches[1];
    const imageData = matches[2]; // Base64 data without prefix

    let fileExtension;
    if (imageType.includes('image/png')) {
        fileExtension = 'png';
    } else if (imageType.includes('image/jpeg') || imageType.includes('image/jpg')) {
        fileExtension = 'jpeg';
    } else {
        throw new Error(`Unsupported image type for S3 upload: ${imageType}`);
    }

    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`; // Store in 'images' folder in S3
    const buffer = Buffer.from(imageData, 'base64'); // Convert base64 to Buffer

    const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: filename, // File name in S3
        Body: buffer,
        ContentType: imageType,
        // ACL: 'public-read' // REMOVED: This causes AccessControlListNotSupported error if bucket does not allow ACLs
    };

    try {
        // Use the Upload class from @aws-sdk/lib-storage for managed multipart upload
        const uploader = new Upload({
            client: s3Client, // Pass the v3 S3Client
            params: uploadParams,
        });

        const data = await uploader.done(); // Perform the upload
        console.log(`Image uploaded to S3: ${data.Location}`);
        return data.Location; // Return the public URL of the uploaded image
    } catch (err) {
        console.error("Error uploading base64 image to S3:", err);
        throw new Error("Failed to upload image to S3.");
    }
}


async function extractBookInfoWithCohere(text) {
    try {
        const limitedText = text.substring(0, 8000);

        const allowedCategories = [
            "Fiction", "Non-fiction", "Science Fiction", "Fantasy", "Mystery",
            "Thriller", "Horror", "Romance", "Drama", "Comedy", "History",
            "Science", "Technology", "Education", "Self-help", "Business",
            "Art", "Cooking", "Travel", "Health"
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

        const response = await cohere.generate({
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
                title: "Not Found", author: "Not Found", description: "Not Found",
                category: "Not Found", publisher: "Not Found", publicationDate: "Not Found",
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
                    title: "Not Found", author: "Not Found", description: "Not Found",
                    category: "Not Found", publisher: "Not Found", publicationDate: "Not Found",
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
                title: "Not Found", author: "Not Found", description: "Not Found",
                category: "Not Found", publisher: "Not Found", publicationDate: "Not Found",
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
            title: "Not Found", author: "Not Found", description: "Not Found",
            category: "Not Found", publisher: "Not Found", publicationDate: "Not Found",
            price: "Not Found",
        };
    }
}

// Controller Method: Process PDF and Get Data (Uses local temp file)
exports.processPdfForAutofill = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded for processing." });
    }

    const pdfPath = req.file.path; // This is the temporary local path

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);

        if (!pdfData || !pdfData.text) {
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath); // Clean up temp file
            }
            return res
                .status(400)
                .json({ message: "Could not extract text from PDF." });
        }

        const extractedText = pdfData.text;
        const bookInfo = await extractBookInfoWithCohere(extractedText);

        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath); // Clean up temp file after processing
        }

        res.status(200).json(bookInfo);
    } catch (error) {
        console.error("Error in processPdfForAutofill:", error);
        if (req.file && fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath); // Clean up temp PDF file on error
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
        console.log("Received req.file (for PDF):", req.file);

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

        let s3CoverImageUrl = null; // To hold the S3 URL of the uploaded cover image

        // Handle PDF File Logic (from Multer-S3)
        if (req.file && req.file.location) { // req.file.location is the S3 URL provided by multer-s3
            console.log("Backend: New PDF file uploaded to S3:", req.file.location);
            bookData.pdfUrl = req.file.location;
        } else {
            console.log("Backend: No PDF file found in req.file for this request, setting pdfUrl to null.");
            bookData.pdfUrl = null;
        }

        // Handle Cover Image Logic (Base64 to S3)
        if (imageBase64) {
            console.log("Backend: New Base64 cover image detected, uploading to S3.");
            s3CoverImageUrl = await saveBase64ImageToS3(imageBase64); // Upload to S3
            bookData.coverImage = s3CoverImageUrl;
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

        // Clean up uploaded PDF from S3 if an error occurs during book saving
        if (req.file && req.file.key) { // req.file.key is the S3 object key
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: req.file.key
            };
            try {
                const command = new DeleteObjectCommand(params); // Create v3 command
                await s3Client.send(command); // Send v3 command
                console.log(`Backend: Cleaned up uploaded PDF from S3 on add error: ${req.file.key}`);
            } catch (s3Err) {
                console.error(`Error deleting PDF from S3 during add error cleanup: ${s3Err}`);
            }
        }

        // Clean up uploaded image from S3 if an error occurs during book saving
        if (s3CoverImageUrl) {
            // Extract key from S3 URL (assuming format like .../bucket/images/filename.ext)
            const url = new URL(s3CoverImageUrl);
            const imageKey = url.pathname.substring(1); // Remove leading slash
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: imageKey
            };
            try {
                const command = new DeleteObjectCommand(params); // Create v3 command
                await s3Client.send(command); // Send v3 command
                console.log(`Backend: Cleaned up uploaded image from S3 on add error: ${imageKey}`);
            } catch (s3Err) {
                console.error(`Error deleting image from S3 during add error cleanup: ${s3Err}`);
            }
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
        // S3 URLs are already absolute, so no need to construct them
        const booksWithFullUrls = books.map((book) => {
            return {
                ...book.toObject(),
                pdfUrl: book.pdfUrl || null,
                coverImage: book.coverImage || null,
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

        // S3 URLs are already absolute, so no need to construct them
        const bookWithFullUrls = {
            ...book.toObject(),
            pdfUrl: book.pdfUrl || null,
            coverImage: book.coverImage || null,
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
        const currentPdfUrl = req.body.pdfUrl;
        const currentCoverImageUrl = req.body.coverImage;


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

        let newS3CoverImageUrl = null; // To store the S3 URL of a newly uploaded cover image

        // --- Handle PDF File Logic ---
        if (req.file && req.file.location) { // A new PDF file was uploaded to S3
            console.log("Backend: New PDF file uploaded to S3 during update:", req.file.location);
            // Delete old PDF from S3 if it exists
            if (existingBook.pdfUrl) {
                const url = new URL(existingBook.pdfUrl);
                const oldPdfKey = url.pathname.substring(1); // Remove leading slash
                const deleteParams = {
                    Bucket: S3_BUCKET_NAME,
                    Key: oldPdfKey
                };
                try {
                    const command = new DeleteObjectCommand(deleteParams);
                    await s3Client.send(command);
                    console.log(`Backend: Deleted old PDF from S3: ${oldPdfKey}`);
                } catch (s3Err) {
                    console.error(`Error deleting old PDF from S3 during update: ${s3Err}`);
                }
            }
            updateFields.pdfUrl = req.file.location; // Set new PDF URL
        } else if (currentPdfUrl === null || currentPdfUrl === "") { // Client explicitly wants to remove PDF
            console.log("Backend: PDF explicitly marked for removal during update.");
            if (existingBook.pdfUrl) {
                const url = new URL(existingBook.pdfUrl);
                const oldPdfKey = url.pathname.substring(1);
                const deleteParams = {
                    Bucket: S3_BUCKET_NAME,
                    Key: oldPdfKey
                };
                try {
                    const command = new DeleteObjectCommand(deleteParams);
                    await s3Client.send(command);
                    console.log(`Backend: Deleted old PDF from S3 due to explicit client request: ${oldPdfKey}`);
                } catch (s3Err) {
                    console.error(`Error deleting old PDF from S3 (explicit removal): ${s3Err}`);
                }
            }
            updateFields.pdfUrl = null; // Set PDF URL to null
        } else { // No new PDF upload, and not explicitly removed, retain existing
            updateFields.pdfUrl = existingBook.pdfUrl;
        }


        // --- Handle Cover Image Logic (Base64 to S3) ---
        if (imageBase64 && imageBase64 !== "null") { // New base64 image provided
            console.log("Backend: New Base64 cover image detected during update, uploading to S3.");
            // Delete old image from S3 if it exists
            if (existingBook.coverImage) {
                const url = new URL(existingBook.coverImage);
                const oldImageKey = url.pathname.substring(1);
                const deleteParams = {
                    Bucket: S3_BUCKET_NAME,
                    Key: oldImageKey
                };
                try {
                    const command = new DeleteObjectCommand(deleteParams);
                    await s3Client.send(command);
                    console.log(`Backend: Deleted old cover image from S3: ${oldImageKey}`);
                } catch (s3Err) {
                    console.error(`Error deleting old cover image from S3 during update: ${s3Err}`);
                }
            }
            newS3CoverImageUrl = await saveBase64ImageToS3(imageBase64); // Upload new image to S3
            updateFields.coverImage = newS3CoverImageUrl; // Set new image URL
        } else if (currentCoverImageUrl === null || currentCoverImageUrl === "") { // Client explicitly wants to remove image
            console.log("Backend: Cover image explicitly marked for removal during update.");
            if (existingBook.coverImage) {
                const url = new URL(existingBook.coverImage);
                const oldImageKey = url.pathname.substring(1);
                const deleteParams = {
                    Bucket: S3_BUCKET_NAME,
                    Key: oldImageKey
                };
                try {
                    const command = new DeleteObjectCommand(deleteParams);
                    await s3Client.send(command);
                    console.log(`Backend: Deleted old cover image from S3 due to explicit client request: ${oldImageKey}`);
                } catch (s3Err) {
                    console.error(`Error deleting old cover image from S3 (explicit removal): ${s3Err}`);
                }
            }
            updateFields.coverImage = null;
        } else {
            updateFields.coverImage = existingBook.coverImage;
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

        // Clean up newly uploaded PDF from S3 if an error occurs during book saving
        if (req.file && req.file.key) {
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: req.file.key
            };
            try {
                const command = new DeleteObjectCommand(params);
                await s3Client.send(command);
                console.log(`Backend: Cleaned up new PDF from S3 on update error: ${req.file.key}`);
            } catch (s3Err) {
                console.error(`Error deleting new PDF from S3 during update error cleanup: ${s3Err}`);
            }
        }

        // Clean up newly uploaded image from S3 if an error occurs during book saving
        if (newS3CoverImageUrl) {
            const url = new URL(newS3CoverImageUrl);
            const imageKey = url.pathname.substring(1);
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: imageKey
            };
            try {
                const command = new DeleteObjectCommand(params);
                await s3Client.send(command);
                console.log(`Backend: Cleaned up new image from S3 on update error: ${imageKey}`);
            } catch (s3Err) {
                console.error(`Error deleting new image from S3 during update error cleanup: ${s3Err}`);
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

        // Delete associated PDF file from S3
        if (bookToDelete.pdfUrl) {
            // Extract the S3 Key from the URL
            const url = new URL(bookToDelete.pdfUrl);
            const pdfKey = url.pathname.substring(1); // Remove leading slash (e.g., 'pdfs/filename.pdf')
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: pdfKey
            };
            try {
                const command = new DeleteObjectCommand(params);
                await s3Client.send(command);
                console.log(`Backend: Deleted PDF file from S3: ${pdfKey}`);
            } catch (s3Err) {
                console.error(`Error deleting PDF from S3: ${s3Err}`);
            }
        }

        // Delete associated cover image file from S3
        if (bookToDelete.coverImage) {
            // Extract the S3 Key from the URL
            const url = new URL(bookToDelete.coverImage);
            const imageKey = url.pathname.substring(1); // Remove leading slash (e.g., 'images/filename.jpeg')
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: imageKey
            };
            try {
                const command = new DeleteObjectCommand(params);
                await s3Client.send(command);
                console.log(`Backend: Deleted cover image file from S3: ${imageKey}`);
            } catch (s3Err) {
                console.error(`Error deleting cover image from S3: ${s3Err}`);
            }
        }

        // Delete the book from the database
        await Book.findByIdAndDelete(id);
        console.log(`Backend: Successfully deleted book from DB: ${id}`);

        res.status(200).json({ message: "Book deleted successfully." });
    } catch (err) {
        console.error("Backend: Error deleting book:", err);
        // ... (error handling) ...
    }
};