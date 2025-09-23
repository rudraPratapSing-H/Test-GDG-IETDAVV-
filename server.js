require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const uploadTestRoutes = require('./routes/uploadTest');
const examRoutes = require('./routes/exam');
const Exam = require('./models/Test');
const StudentResponse = require('./models/StudentResponse'); // Import the StudentResponse model

const path = require("path");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS (be cautious in production)


app.use('/api/uploadTest', uploadTestRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/exam", examRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const GOOGLE_SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycby6QIzkGDEH324qRh2UJTM8y6q1ZS6gMOVDzTo0FJOebhFdCDyukjwK0xi0kBmaBieD/exec";

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


// Submit Answers
app.post("/submit", async (req, res) => {
  try {
    const { name, branch, year, email, cheatCount, score, answers, examName } = req.body;

    console.log("Received submission:", { name, branch, year, email, cheatCount, score, answersLength: answers?.length }); // Debug log

    // Validate required fields
    if (!name || !branch || !year || !email) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Validate year (should be a number between 1-4)
    if (typeof year !== 'number' || year < 1 || year > 4) {
      console.log("Invalid year:", year);
      return res.status(400).json({ error: "Year must be a number between 1 and 4." });
    }

    // Validate score (should be a number and within reasonable range)
    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) {
      console.log("Invalid score:", score);
      return res.status(400).json({ error: "Score must be a number between 0 and 100." });
    }

    // Validate cheatCount (should be a non-negative number)
    if (cheatCount !== undefined && (typeof cheatCount !== 'number' || cheatCount < 0)) {
      console.log("Invalid cheat count:", cheatCount);
      return res.status(400).json({ error: "Cheat count must be a non-negative number." });
    }

    // Store data in the StudentResponse collection
    const studentResponse = new StudentResponse({
      name,
      branch,
      year,
      email,
      cheatCount: cheatCount || 0,
      score: score || 0,
      answers: answers || [],
      examName: examName || "Unknown Exam", // Ensure examName is provided
    });

    await studentResponse.save(); // Save the response to the database
    console.log("Student response saved successfully");

    return res.status(200).json({ message: "Data submitted successfully." });
  } catch (err) {
    console.error("Submit error:", err.message);
    console.error("Full error:", err); // More detailed error logging
    
    // Handle duplicate key error (if email is unique)
    if (err.code === 11000) {
      return res.status(409).json({ error: "Student response already exists for this email." });
    }
    
    res.status(500).json({ error: "Submission failed." });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/page.html"));
});
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend


// Report Cheating
app.post("/cheat", async (req, res) => {
  try {
    const { studentEmail, examId, eventType, description } = req.body;
    
    // Log cheating event (you could save to CheatEvent schema here)
    console.log("Cheating reported:", { studentEmail, examId, eventType, description });
    
    // TODO: Implement actual cheating logic here
    res.status(200).send("Cheating reported");
  } catch (err) {
    console.error("Cheating error:", err.message);
    res.status(500).send("Failed to report cheating");
  }
});

// post request ot get all the tests sorted by username
app.post("/api/getAllTests", async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) return res.status(400).json({ error: "Username required" });

    const tests = await Exam.find({ username }).sort({ date: -1 });
    res.status(200).json(tests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

// Delete a test by ID
app.delete("/api/deleteTest/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Exam.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }
    res.json({ success: true, message: "Test deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Toggle the isLive status of a test by ID
app.patch("/api/toggleLive/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Exam.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }
    test.isLive = !test.isLive;
    await test.save();
    res.json({ success: true, isLive: test.isLive });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get exam by name (case-insensitive, returns first match)
app.get("/api/examByName/:name", async (req, res) => {
  try {
    const name = req.params.name;
    // Case-insensitive search for the first matching exam
    const exam = await Exam.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
