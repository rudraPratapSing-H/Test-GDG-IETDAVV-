const express = require("express");
const Exam = require("../models/Test");
  

const router = express.Router();

router.get("exam/:username", async (req, res) => {
  try {
    const exam = await Exam.findOne({ username: req.params.username });
    if (!exam) return res.status(404).json({ message: "Not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
