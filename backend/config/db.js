// config/db.js
const mongoose = require('mongoose');

const connectDB = async (mongoURI) => { // Accept mongoURI as a parameter
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex: true, // Deprecated in newer Mongoose versions
            // useFindAndModify: false // Deprecated in newer Mongoose versions
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;