require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const uploadTestRoutes = require('./routes/uploadTest');
const examRoutes = require('./routes/exam');
const Exam = require('./models/Test')

const path = require("path");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middlewaremongoose.connect(process.env.MONGO_URI)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS (be cautious in production)


app.use('/api/uploadTest', uploadTestRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/exam", examRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const GOOGLE_SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycby6QIzkGDEH324qRh2UJTM8y6q1ZS6gMOVDzTo0FJOebhFdCDyukjwK0xi0kBmaBieD/exec";

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Connected to MongoDB");    }).catch((err) => {
  console.error("MongoDB connection error:", err);      }
);


// Submit Answers
app.post("/submit", async (req, res) => {
  try {
    const { name, branch, year, email, cheatCount, score, sheetUrl } =
      req.body;

    // Validate required fields (optional but good practice)
    if (!name || !branch || !year || !email) {
      return res.status(400).send("Missing required fields.");
    }
    if(!sheetUrl) {
      return res.status(400).send("Missing or incorrect Google Sheet URL.");
    }

    const url = sheetUrl;

    // Post to Google Apps Script
    const response = await axios.post(url, {
      name,
      branch,
      year,
      email,
    
      cheatCount,
      score,
  
    });

    console.log("Submitted to Google Sheet:", response.status);
    res.status(200).send("Submitted successfully");
  } catch (err) {
    console.error("Submit error:", err.message);
    res.status(500).send("Submission failed");
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/page.html"));
});
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend


// Report Cheating
app.post("/cheat", async (req, res) => {
  try {
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
