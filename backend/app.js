
const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from .env
import userRouter from "./src/routers/user.router.js";
import { dbConnect } from "./src/configs/database.config.js";
import cookieparser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import { passportFunctionality } from "./src/configs/passport.config.js";
const cors = require("cors");
const connectDB = require("./config/db"); // Assuming you have this for MongoDB connection
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Still needed for temporary local PDF storage

// --- AWS SDK v3 Imports ---
const { S3Client } = require("@aws-sdk/client-s3"); // Import S3Client from v3 SDK
const multerS3 = require("multer-s3"); // multer-s3 is compatible with v3 S3Client

const bookController = require("./controllers/book.controller");

// FIX for MongoDB Atlas URI: Use the provided URI
const ATLAS_URI =
    process.env["MONGO_URI"] ||
    "mongodb+srv://ongamohamed89:Bondok23@cluster0.mzgdznh.mongodb.net/EBooks.Books";
connectDB(ATLAS_URI); // Pass the URI to connectDB



dotenv.config();
dbConnect();


const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:4200"],
  })
);
passportFunctionality();
app.use(
  session({
    secret: process.env.JWT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true only with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ✅ Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());





app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON bodies (e.g., base64 images in other routes)

// --- AWS S3 Configuration (AWS SDK v3) ---
const s3Client = new S3Client({ // Initialize S3Client from v3 SDK
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// --- Multer Configuration for PDF Processing Upload (LOCAL TEMP STORAGE) ---
// This uses disk storage because pdf-parse needs a local file or buffer.
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

// --- Multer Configuration for Final PDF Storage (AWS S3 - v3 compatible) ---
const uploadFinalPdfToS3 = multer({
    storage: multerS3({
        s3: s3Client, // Pass the v3 S3Client instance here
        bucket: process.env.S3_BUCKET_NAME,
        // acl: 'public-read', // REMOVED: This causes AccessControlListNotSupported error if bucket does not allow ACLs
        contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect content type
        key: function (req, file, cb) {
            // Define the file name in S3 (e.g., unique timestamp + original name)
            // Store PDFs in a 'pdfs' folder within the bucket
            cb(null, `pdfs/${Date.now()}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed for final storage!"), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 50, // Increased to 50MB for PDF files to prevent LIMIT_FILE_SIZE
        fieldSize: 1024 * 1024 * 50, // 50MB for non-file fields like base64 image
    },
});

// --- Define Routes ---
// Route for PDF processing (autofill)
app.post(
    "/api/books/process-pdf",
    uploadTempPdf.single("pdf"),
    bookController.processPdfForAutofill
);

// Route to add a new book
app.post(
    "/api/books/add",
    uploadFinalPdfToS3.single("pdf"), // Uses S3 storage for final PDF
    bookController.addBook // This controller will also handle base64 image to S3
);

// Route to get all books
app.get("/api/books", bookController.getAllBooks);

// Route to get a book by ID
app.get("/api/books/:id", bookController.getBookById);

// Route to update a book by ID
app.put(
    "/api/books/:id",
    uploadFinalPdfToS3.single("pdf"), // Uses S3 storage for updated PDF
    bookController.updateBook // This controller will also handle base64 image to S3
);

// Route to delete a book by ID
app.delete("/api/books/:id", bookController.deleteBook);

// Basic root route
app.get("/", (req, res) => {
    res.send("Welcome to the Book API!");
});

// --- Global Error Handling Middleware for Multer and custom errors ---
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error("*** MULTER ERROR CAUGHT ***");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Field:", err.field);
        return res.status(400).json({
            message: `File upload error: ${err.message}`,
            code: err.code,
            field: err.field,
        });
    } else if (err.message === "Only PDF files are allowed for processing!" ||
               err.message === "Only PDF files are allowed for final storage!") {
        // Custom file filter errors
        return res.status(400).json({ message: err.message });
    }
    // For any other unhandled errors, log and send a generic 500 response
    console.error("Unhandled server error:", err);
    res.status(500).json({
        message: "An unexpected server error occurred.",
        error: err.message,
    });
});
app.use("/api/users", userRouter);

const PORT = process.env["PORT"] || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
