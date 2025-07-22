const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "field must be a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      required: true,
    },
    isVerified: {
      type: Boolean,
      required: false,
    },
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
  },
  {
    timeseries: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);
module.exports = mongoose.model("User", userSchema);