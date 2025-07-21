// this file defines the schema for a book in a MongoDB database using Mongoose.
const mongoose = require("mongoose");
const ALLOWED_CATEGORIES = [
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
const BookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        author: { type: String, required: true },
        description: { type: String },
         category: {
      type: String,
     
      required: [false, 'Category is optional.'], // Set to true if category is mandatory
      enum: {
        values: ALLOWED_CATEGORIES,
        message: '"{VALUE}" is not a valid category. Choose from: ' + ALLOWED_CATEGORIES.join(', ')
      }
    },
        price: {
            type: Number,
            required: [true, "Price is required."],
            min: [0, "Price cannot be negative."], // Price must be non-negative
            max: [100000, "Price cannot exceed 100,000."], // Example max price
            validate: {
                validator: function (v) {
                    return /^\d+(\.\d{1,2})?$/.test(v.toString());
                },
                message: (props) =>
                    `${props.value} is not a valid price format. Max 2 decimal places allowed.`,
            },
        },
        pdfUrl: { type: String }, // Path or URL to the PDF stored in GridFS or elsewhere
        coverImage: { type: String }, // Path or URL to the cover image
    },
    { timestamps: true }
);

module.exports = mongoose.model("Book", BookSchema);
