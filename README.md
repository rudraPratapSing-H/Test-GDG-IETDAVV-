# Test-GDG-IETDAVV Quiz Platform

A modern, reusable, and efficient web application for creating, managing, and attempting online quizzes with robust anti-cheating features and flexible timer modes.

---

## 🚀 Features

- **Reusable Quiz Engine:**  
  Easily create, edit, and reuse quizzes for different events, classes, or organizations.
- **Flexible Timer Modes:**  
  Supports both overall quiz timer and per-question timer, selectable per test. overall timer for a slow paced test and per-question timer for a fast paced test with no access to previous question, like a rapid fire round.
- **Anti-Cheat System:**  
  Fullscreen enforcement, keyboard/clipboard blocking, cheat attempt tracking, and auto-submit on repeated violations.
- **User Authentication:**  
  Simple signup/login for quiz creators, with secure token storage.
- **Intuitive UI:**  
  Minimal, clean, and responsive design for both students and creators.
- **Result Logging:**  
  Quiz results and cheat counts are submitted to a backend and can be logged in a Google Sheet(owned by you).
- **Mobile Friendly:**  
  Fully responsive layouts for all major devices.

---

## 📁 Folder Structure

```
.
├── models
│   ├── Test.js
│   └── User.js
├── node_modules
├── public
│   ├── dashboard
│   │   └── dashboard.html
│   ├── search
│   │   └── search.html
│   ├── .gitignore
│   ├── create-test.html
│   ├── data.js
│   ├── index.html
│   ├── login.html
│   ├── logo.jpg
│   ├── page.html
│   ├── script1.js
│   ├── script2.js
│   ├── style.css
│   └── thankyou.html
├── routes
│   ├── auth.js
│   ├── exam.js
│   └── uploadTest.js
├── .env
├── package-lock.json
├── package.json
├── README.md
└── server.js

---

## 🛠️ How to Use

### For Students
1. **Attempt a Quiz:**  
   - Go to the home page (`page.html`) and click "Attempt Test".
   - Write the name of the Test provided by your Teacher/Institute.
   - Enter your IET-DAVV email and quiz details.
   - The quiz starts in fullscreen mode with anti-cheat enabled.
   - Timer runs (overall or per-question, as set by the test).
   - Answers and cheat count are submitted.

### For Creators
1. **Create a Quiz:**  
   - Go to "Create Test" via the home page.
   - Sign up or log in.
   - Fill out the quiz creation form:  
     - Test name, description, upload questions (JSON/PDF), timer mode, cheat count, rules, etc.
   - Submit to create a new quiz.
   - Create as many tests as you want for different events and subjects.

---

## 🔄 Reusability & Efficiency

- **Reusable Components:**  
  The quiz engine and creation forms are modular and can be adapted for any educational or organizational context.
- **Efficient Data Handling:**  
  Questions are loaded dynamically from JSON or PDF, and results are submitted asynchronously.
- **Minimal Dependencies:**  
  Uses vanilla JS, HTML, and CSS for fast load times and easy customization.
- **Backend Agnostic:**  
  Works with any backend that exposes the required API endpoints (Express/Node.js recommended).

---

## 🧑‍💻 Developer Notes

- **Question Format Example:**
  ```json
  [
    {
      "question": "A fair die is rolled. What is the probability of getting an even number?",
      "a": "1/3",
      "b": "1/2",
      "c": "2/3",
      "d": "5/6",
      "correct": ["b"]
    }
  ]
  ```

---

## 📦 Installation & Setup

1. **Clone the Repository:**  
   `git clone https://github.com/yourusername/quiz-platform.git`
2. **Navigate to the Project Directory:**  
   `cd quiz-platform`
3. **Install Dependencies:**  
   `npm install`
4. **Start the Development Server:**  
   `npm start`
5. **Open in Browser:**  
   Visit `http://localhost:3000` to view the app.

---

## 📄 License

No License yet.

---

## 📫 Contact

For questions or feedback, please reach out:

- Email: rudrajabalpur1112@gmail.com
- GitHub: [rudraPratapSing-H](https://github.com/rudraPratapSing-H)

---

## 🖥️ Server Setup (For Developers)

To run the server locally:

1. **Ensure Node.js is Installed:**  
   Download and install from [Node.js official site](https://nodejs.org/).
2. **Install Dependencies:**  
   Navigate to the server directory and run `npm install`.
3. **Start the Server:**  
   Run `node server.js` to start the backend server.
4. **Access the API:**  
   The API will be available at `http://localhost:5000` (or the port you configured).

For a production setup, consider using a process manager like PM2, and configure a reverse proxy with Nginx or Apache.
