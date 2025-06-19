const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());  // Enable CORS (be cautious in production)
app.use(express.static(path.join(__dirname, "public")));  // Serve frontend

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz3LvTeyQaMVlAllVBNL9tB-xSPPCz2nla6kexcY4AD68thr_zWh50x5ItVFRIwhMyS/exec"; 

//Check emails
app.post("/check-email", async (req, res) => {
  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, {
      email: req.body.email,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// Submit Answers
app.post("/submit", async (req, res) => {
  try {
    const { name, branch, year, email, answers } = req.body;

    // Validate required fields (optional but good practice)
    if (!name || !branch || !year || !email || !answers) {
      return res.status(400).send("Missing required fields.");
    }

    // Post to Google Apps Script
    const response = await axios.post(GOOGLE_SCRIPT_URL, {
      name,
      branch,
      year,
      email,
      answers,
      cheating: false
    });

    console.log("Submitted to Google Sheet:", response.status);
    res.status(200).send("Submitted successfully");
  } catch (err) {
    console.error("Submit error:", err.message);
    res.status(500).send("Submission failed", );
  }
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

// Report Cheating
app.post("/cheat", async (req, res) => {
  try {
    const { name, email, reason } = req.body;

    const response = await axios.post(GOOGLE_SCRIPT_URL, {
        name,
      email,
      cheating: true,
      reason
    });

    res.status(200).send("Cheating reported");
  } catch (err) {
    console.error("Cheating error:", err.message);
    res.status(500).send("Failed to report cheating");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
