require('dotenv').config();
const mongoose = require("mongoose");
const StudentResponse = require("./models/StudentResponse"); // Import the StudentResponse schema

// Connect to MongoDB
const DATABASE_URI = process.env.MONGO_URI; // Replace with your MongoDB URI
mongoose.connect(DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Fetch and sort data by examName
async function fetchAndSortResponses() {
  try {
    const responses = await StudentResponse.find().sort({ examName: 1 }); // Sort by examName in ascending order
    console.log("Sorted Responses by Exam Name:");
    responses.forEach((response, index) => {
      console.log(`\nResponse ${index + 1}:`);
      console.log(`Name: ${response.name}`);
      console.log(`Branch: ${response.branch}`);
      console.log(`Year: ${response.year}`);
      console.log(`Email: ${response.email}`);
      console.log(`Cheat Count: ${response.cheatCount}`);
      console.log(`Score: ${response.score}`);
    //   console.log(`Answers: ${JSON.stringify(response.answers)}`);
    //   console.log(`Exam Name: ${response.examName}`);
      
      // Format date and time separately
      const submissionDate = new Date(response.createdAt);
      const formattedDate = submissionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = submissionDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      console.log(`Date: ${formattedDate}`);
      console.log(`Time of Submission: ${formattedTime}`);
    });
  } catch (err) {
    console.error("Error fetching and sorting responses:", err);
  } finally {
    mongoose.connection.close(); // Close the database connection
  }
}

// Run the function
fetchAndSortResponses();