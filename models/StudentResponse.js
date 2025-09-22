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
    type: String,
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
  }
});

module.exports = mongoose.model("StudentResponse", studentResponseSchema);