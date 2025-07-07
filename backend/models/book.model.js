// this file defines the schema for a book in a MongoDB database using Mongoose.
const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    price: { type: Number, required: true },
    pdfUrl: { type: String }, // Path or URL to the PDF stored in GridFS or elsewhere
    coverImage: { type: String }, // Path or URL to the cover image
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", BookSchema);
