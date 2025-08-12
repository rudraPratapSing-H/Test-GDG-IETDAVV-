const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Test = require("../models/Test");
const fs = require("fs").promises; // use promises API for async/await


// Setup file upload destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
 // use promises API for async/await

router.post("/", upload.single("json"), async (req, res) => {
  try {
    const username = req.headers.username;
    const sheetUrl = req.headers.sheeturl;

    const {
      name,
      description,
      date,
      overallDuration,
      perQuestionDuration,
      Rules,
    
      AllowingKeyboard,
    } = req.body;

    let jsonString = "";

    if (req.file) {
      // Read uploaded file and parse it
      const fileContent = await fs.readFile(req.file.path, "utf-8");
      
      try {
        const parsedJson = JSON.parse(fileContent); // Optional: validate it's valid JSON
        jsonString = JSON.stringify(parsedJson);     // Save as string in DB
      } catch (parseErr) {
        return res.status(400).json({ error: "Invalid JSON file content." });
      }
    }

    const testData = new Test({
      username: username || "defaultUser",
      name,
      description,
      date: date || new Date(),
      filePath: req.file.path,
      fileType: req.file.mimetype,
      json: jsonString, // store parsed JSON string
      overallDuration: overallDuration ? parseInt(overallDuration) : null,
      perQuestionDuration: perQuestionDuration ? parseInt(perQuestionDuration) : null,
      Rules,
      AllowingKeyboard: AllowingKeyboard === "true" || AllowingKeyboard === "yes",
      sheetUrl,
    });

    await testData.save();

    res.status(200).json({ message: "Test created successfully", data: testData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
