const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Test = require("../models/Test");
const fs = require("fs").promises;
const fsSync = require("fs"); // for sync folder checks
const pdfParse = require("pdf-parse");

// Setup file upload destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fsSync.existsSync(uploadDir)) {
      fsSync.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/", upload.single("json"), async (req, res) => {
  try {
    const username = req.headers.username;

    const {
      name,
      description,
      date,
      overallDuration,
      perQuestionDuration,
      Rules,
      AllowingKeyboard,
    } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Test name is required." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    let jsonString = "";

    if (req.file) {
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      if (fileExt === ".json") {
        // Read uploaded JSON file and parse it
        const fileContent = await fs.readFile(req.file.path, "utf-8");
        try {
          const parsedJson = JSON.parse(fileContent);
          jsonString = JSON.stringify(parsedJson);
        } catch (parseErr) {
          return res.status(400).json({ error: "Invalid JSON file content." });
        }
      } else if (fileExt === ".pdf") {
        // Ensure file is completely written before parsing
        await new Promise(resolve => setTimeout(resolve, 100));

        // Read and parse PDF file
        const pdfBuffer = await fs.readFile(req.file.path);
        const data = await pdfParse(pdfBuffer);
        const text = data.text;

        // Improved parser: handles empty lines, trims spaces
        const questions = [];
        const questionBlocks = text.split(/Q\d+:/).slice(1);
        questionBlocks.forEach(block => {
          const lines = block
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

          if (!lines.length) return;

          const questionText = lines[0];
          const options = {};
          let correct = [];
          lines.slice(1).forEach(line => {
            if (line.startsWith("a)")) options.a = line.slice(2).trim();
            if (line.startsWith("b)")) options.b = line.slice(2).trim();
            if (line.startsWith("c)")) options.c = line.slice(2).trim();
            if (line.startsWith("d)")) options.d = line.slice(2).trim();
            if (line.toLowerCase().startsWith("answer:")) {
              const ans = line.split(":")[1];
              if (ans) correct = [ans.trim()];
            }
          });

          if (
            questionText &&
            (options.a || options.b || options.c || options.d) &&
            correct.length
          ) {
            questions.push({
              question: questionText,
              ...options,
              correct,
            });
          }
        });

        jsonString = JSON.stringify(questions);
      } else {
        return res
          .status(400)
          .json({ error: "Unsupported file type. Only JSON and PDF are allowed." });
      }
    }

    const testData = new Test({
      username: username || "defaultUser",
      name,
      description,
      date: date || new Date(),
      filePath: req.file.path,
      fileType: req.file.mimetype,
      json: jsonString,
      overallDuration: overallDuration ? parseInt(overallDuration) : null,
      perQuestionDuration: perQuestionDuration ? parseInt(perQuestionDuration) : null,
      Rules,
      AllowingKeyboard: AllowingKeyboard === "true" || AllowingKeyboard === "yes",
    });

    await testData.save();

    res.status(200).json({ message: "Test created successfully", data: testData });
  } catch (err) {
    console.error("Upload Test Error:", err);
    
    // More detailed error responses
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Validation Error: ${errors.join(', ')}` });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ error: "A test with this name already exists for this user." });
    }
    
    res.status(500).json({ error: `Server Error: ${err.message}` });
  }
});

module.exports = router;
