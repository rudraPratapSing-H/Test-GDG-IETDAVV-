const mongoose = require("mongoose");

const cheatEventSchema = new mongoose.Schema({
  studentResponseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentResponse',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    enum: [
      'tab_switch',
      'window_blur', 
      'window_focus',
      'copy_attempt',
      'paste_attempt',
      'right_click',
      'keyboard_shortcut',
      'dev_tools_open',
      'fullscreen_exit',
      'suspicious_activity',
      'other'
    ],
    required: true,
  },
  description: {
    type: String,
  },
  questionIndex: {
    type: Number, // Which question was active when cheating occurred
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  browserInfo: {
    userAgent: String,
    screenResolution: String,
    windowSize: String,
  },
  actionTaken: {
    type: String,
    enum: ['warning_shown', 'exam_terminated', 'logged_only', 'ignored'],
    default: 'logged_only',
  }
});

// Indexes for better performance
cheatEventSchema.index({ studentResponseId: 1 });
cheatEventSchema.index({ examId: 1, studentEmail: 1 });
cheatEventSchema.index({ timestamp: -1 });
cheatEventSchema.index({ severity: 1 });

module.exports = mongoose.model("CheatEvent", cheatEventSchema);