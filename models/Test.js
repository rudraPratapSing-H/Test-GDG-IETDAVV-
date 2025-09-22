const { json } = require("express");
const mongoose = require("mongoose");


const examSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now, // sets current date automatically
  },
  json: {
    type: mongoose.Schema.Types.Mixed, 
    required: true, // stores any valid JSON object
  },
  overallDuration: {
    type: Number, // in minutes
    required: true,
  },
  perQuestionDuration: {
    type: Number, // in minutes
  },
  Rules: {
    type: String,
    
  },
  cheatCount: {
    type: Number,
    default: 0, // default value for cheat count
  },
  AllowingKeyboard: {
    type: Boolean,
    default: false,
  },
  isLive: {            
    type: Boolean,
    default: false,
  },
  sheetUrl: {
    type: String,
    required: false, // URL of the Google Sheet (now optional)
  },
});

module.exports = mongoose.model("Exam", examSchema);
