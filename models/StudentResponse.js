const mongoose = require("mongoose");

const studentResponseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  year: {
    type: Number, // Changed from String to Number to match client data
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cheatCount: {
    type: Number,
    default: 0, // Individual student's cheat count
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  answers: {
    type: Array, // Add answers field to store user responses
    default: []
  }
}, {
  timestamps: true // Add created/updated timestamps
});

module.exports = mongoose.model("StudentResponse", studentResponseSchema);