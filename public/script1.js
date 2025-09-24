// import { Keyboard } from 'react-native';
const BASE_URL = window.location.origin;
const submitURL = `${BASE_URL}/submit`;
const cheatURL = `${BASE_URL}/cheat`;

let timeLeft = 0;
let exam;
let questions;
let testDuration;
let keyboardPermission;
let cheatCount = 0;
let totalCheatCount = 3; // default value, can be overridden by exam data
let timer;
let isLocked = false;
let cheatDisplay;
let timeFlag = 0;
let perQuestionDuration;
let submit = false;
let keylock = false;
let keyBlock = false;
let timerInterval = null;
// question showing credentials
let globalScore = 0;
let userAnswers = []; // Store all user answers
let questionSpace = document.querySelector(".question");
let timerDisplay; // Will be initialized when quiz starts
let index = 0;
let isFullscreenEnabled = false; // Track fullscreen state

const form = document.getElementById("user-form");
const quizSection = document.getElementById("quiz-section");

const warningSound = new Audio(
  "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
);
function randomizeQuestions(){
  const shuffle = (arr) => {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        };

        const pool = shuffle(questions.slice()); // shuffle a copy
        // choose exactly 10 questions or fewer if the pool has less than 10
        const randomCount = Math.min(10, pool.length);
        questions = pool.slice(0, randomCount);
  
   
}

let currentQuestion = 0;

if (!submit) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    blockOnload();
    const email = document.getElementById("email").value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert("Invalid email! Please enter a valid email address.");
      return;
    }

    localStorage.setItem("formSubmitted", "true");

    // to get all data of that particular test
    // Get the test name from localStorage
    const testName = localStorage.getItem("name");
    alert(testName);
    if (!testName) {
      return alert("No test name found in localStorage.");
    }
    try {
      const res = await fetch(
        `/api/examByName/${encodeURIComponent(testName)}`
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const data = await res.json();
      // ...use data...
      exam = data;
      if (typeof data.json === "string") {
        questions = JSON.parse(data.json);
        console.log(typeof(questions));
        randomizeQuestions();
      } else {
        questions = data.json;
      }
      testDuration = data.overallDuration;
      keyboardPermission = data.AllowingKeyboard;
      totalCheatCount = data.cheatCount;
      // rules = data.Rules;
      perQuestionDuration = data.perQuestionDuration;
      
      
    } catch (err) {
      alert("Error fetching test info: " + err.message);
    }

    keylock = true;
    keyBlock = true;

    form.style.display = "none";
    quizSection.style.display = "block";
    cheatDisplay = document.getElementById("cheat-count");
    
    // Update cheat display with correct total count
    if (cheatDisplay) {
      cheatDisplay.textContent = `Cheating Attempts: 0/${totalCheatCount}`;
    }
    
    // Connect timer display element after quiz section is shown
    timerDisplay = document.getElementById("timer-text");
    
    // Initialize timer display immediately
    initializeTimerDisplay();
    
    // Display timer information
    displayTimerInfo();
    
    showQuestion();
    // to show question

    setupAntiCheat();
    
    // Force fullscreen when quiz starts
    forceFullscreen();
    
    // Always use per-question timing approach
    if (perQuestionDuration && !isNaN(perQuestionDuration)) {
      perQuestionTimer();
    } else if (testDuration && !isNaN(testDuration) && questions && questions.length > 0) {
      // Convert total duration to per-question duration
      const totalSeconds = testDuration * 60;
      perQuestionDuration = Math.floor(totalSeconds / questions.length);
      perQuestionTimer();
    } else {
      // No timing information available
      console.warn('No timing information available for the quiz');
    }
  });
}



let type = "radio";
let category = "mcq";
// Update showQuestion() to handle Previous/Next button visibility
function showQuestion() {
  if (!questions || !questions[index]) return;

  let type = questions[index].correct.length === 1 ? "radio" : "checkbox";
  let category = questions[index].correct.length === 1 ? "MCQ" : "MSQ";

  // Update question counter
  const currentQuestionSpan = document.getElementById("current-question");
  if (currentQuestionSpan) {
    currentQuestionSpan.textContent = index + 1;
  }

  questionSpace.innerHTML = `
    <p>Q${index + 1}: ${questions[index].question} (${category}) </p>
    <label><input type=${type} name="q${index}" value="a" /> ${
    questions[index].a
  }</label><br/>
    <label><input type=${type} name="q${index}" value="b" /> ${
    questions[index].b
  }</label><br/>
    <label><input type=${type} name="q${index}" value="c" /> ${
    questions[index].c
  }</label><br/>
    <label><input type=${type} name="q${index}" value="d" /> ${
    questions[index].d
  }</label>
  `;

  const progressBarContainer = document.getElementById(
    "progress-bar-container"
  );
  const progressBar = document.getElementById("progress-bar");

  progressBarContainer.style.display = "block";
  const progressPercent = ((index + 1) / questions.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  // Show/hide navigation and submit buttons
  const navButtons = document.querySelector(".nav-buttons");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  // Always hide the previous button
  if (prevBtn) {
    prevBtn.style.display = "none";
  }

  if (index === questions.length - 1) {
    nextBtn.style.display = "none";
    navButtons.style.display = "block";
    submitBtn.classList.remove("hide");
  } else {
    nextBtn.style.display = "inline-block";
    navButtons.style.display = "block";
    submitBtn.classList.add("hide");
  }
}

function initializeTimerDisplay() {
  // Ensure timer display element is connected
  if (!timerDisplay) {
    timerDisplay = document.getElementById("timer-text");
  }
  
  if (timerDisplay) {
    // Set initial timer based on available duration
    if (testDuration && !isNaN(testDuration)) {
      const initialTime = testDuration * 60; // Convert minutes to seconds
      timeLeft = initialTime;
      updateTimerDisplay(initialTime);
    } else if (perQuestionDuration && !isNaN(perQuestionDuration)) {
      timeLeft = perQuestionDuration;
      updateTimerDisplay(perQuestionDuration);
    } else {
      // Fallback: show 00:00 if no duration is set
      timerDisplay.textContent = "00:00";
    }
  }
}

// Fullscreen functionality
function forceFullscreen() {
  requestFullscreen()
    .then(() => {
      document.getElementById("fs-exit-overlay").style.display = "none";

      cheatDisplay.textContent = `Cheating Attempts: ${cheatCount} / 3`;
      // showCheatWarning();
      //showQuestion(currentQuestion);

      questionSpace.innerHTML = `
  <p>Q${index + 1}: ${questions[index].question}</p>
  <label><input type="checkbox" name="q${index}" value="a" /> ${
        questions[index].a
      }</label><br/>
  <label><input type="checkbox" name="q${index}" value="b" /> ${
        questions[index].b
      }</label><br/>
  <label><input type="checkbox" name="q${index}" value="c" /> ${
        questions[index].c
      }</label><br/>
  <label><input type="checkbox" name="q${index}" value="d" /> ${
        questions[index].d
      }</label>
`;

      reportCheating("Exited fullscreen");

      if (cheatCount >= 3) {
        alert("Cheating limit reached. Auto-submitting.");
        autoSubmit("Exited fullscreen 3 times");
      }
    })
    .catch(() => {
      // alert("Please allow fullscreen to continue.");
    });
}

function requestFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    return elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    return elem.msRequestFullscreen();
  } else {
    return Promise.reject();
  }
}


// function tryAlternativeFullscreen() {
//   // If standard fullscreen fails, try to maximize window and hide browser UI
//   console.warn('Standard fullscreen not available, using alternative method');
  
//   // Hide browser UI elements and maximize
//   try {
//     // Move window to top-left and resize to full screen
//     window.moveTo(0, 0);
//     window.resizeTo(screen.width, screen.height);
    
//     // Hide scrollbars and other UI elements
//     document.body.style.overflow = 'hidden';
//     document.documentElement.style.overflow = 'hidden';
    
//     isFullscreenEnabled = true;
//     hideFullscreenOverlay();
    
//     // Show a warning that true fullscreen couldn't be activated
//     setTimeout(() => {
//       alert('Please press F11 or use browser fullscreen for better quiz experience.');
//     }, 1000);
    
//   } catch (err) {
//     console.error('Alternative fullscreen method failed:', err);
//     alert('Fullscreen is required for this quiz. Please manually enter fullscreen mode (F11) to continue.');
//     showFullscreenOverlay();
//   }
// }

function hideFullscreenOverlay() {
  const overlay = document.getElementById('fs-exit-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showFullscreenOverlay() {
  const overlay = document.getElementById('fs-exit-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function setupFullscreenMonitoring() {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      // User exited fullscreen - mark as cheating
      cheatCount++;
      if (cheatDisplay) {
        cheatDisplay.textContent = `Cheating Attempt: ${cheatCount} / ${totalCheatCount}`;
      }
      showCheatWarning();
      reportCheating("Exited fullscreen mode");
      showFullscreenOverlay();

      if (cheatCount >= totalCheatCount) {
        alert("Cheating limit reached. Auto-submitting your quiz.");
        autoSubmit("Exited fullscreen too many times");
      } else {
        // Force the user back into fullscreen
        setTimeout(() => {
          // alert("You must stay in fullscreen mode to continue the quiz.");
          forceFullscreen();
        }, 1000);
      }
    }
  });

  // Add click handler to re-enter fullscreen button
  const reenterBtn = document.getElementById('re-enter');
  if (reenterBtn) {
    reenterBtn.addEventListener('click', forceFullscreen);
  }
}

function displayTimerInfo() {
  const totalDurationInfo = document.getElementById("total-duration-info");
  const totalDurationDisplay = document.getElementById("total-duration-display");
  const perQuestionInfo = document.getElementById("per-question-info");
  const perQuestionDisplay = document.getElementById("per-question-display");
  const totalQuestionsSpan = document.getElementById("total-questions");
  const timerLabel = document.getElementById("timer-label");

  // Show total questions count
  if (questions && questions.length) {
    totalQuestionsSpan.textContent = questions.length;
  }

  // Hide total duration info - we only want per-question timer
  if (totalDurationInfo) {
    totalDurationInfo.style.display = "none";
  }

  // Show per-question duration if available
  if (perQuestionDuration && !isNaN(perQuestionDuration)) {
    perQuestionInfo.style.display = "block";
    perQuestionDisplay.textContent = perQuestionDuration;
    timerLabel.textContent = "⏱️ Question Time Left:";
  } else if (testDuration && !isNaN(testDuration)) {
    // If no per-question duration, show total as per-question format
    perQuestionInfo.style.display = "block";
    const totalSeconds = testDuration * 60;
    const perQuestionSeconds = Math.floor(totalSeconds / questions.length);
    perQuestionDisplay.textContent = perQuestionSeconds;
    timerLabel.textContent = "⏱️ Question Time Left:";
  } else {
    // Hide per-question info if no timing data
    if (perQuestionInfo) {
      perQuestionInfo.style.display = "none";
    }
    timerLabel.textContent = "⏱️ Question Time Left:";
  }
}

// Timer functions for both test duration and per-question duration


function overallTimer() {
  if (!testDuration || isNaN(testDuration)) return;
  
  timeLeft = testDuration * 60; // Convert minutes to seconds
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleQuizSubmission();
    }
  }, 1000);
}

function perQuestionTimer() {
  if (!perQuestionDuration || isNaN(perQuestionDuration)) return;
  
  timeLeft = perQuestionDuration;
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      moveToNextQuestion();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  // Ensure we have the timer display element
  if (!timerDisplay) {
    timerDisplay = document.getElementById("timer-text");
  }
  
  if (timerDisplay) {
    timerDisplay.textContent = formattedTime;
    
    // Change color when time is running low
    if (seconds <= 60) { // Last minute
      timerDisplay.style.color = '#ff4444';
      timerDisplay.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
    } else if (seconds <= 300) { // Last 5 minutes  
      timerDisplay.style.color = '#ff8800';
      timerDisplay.style.background = 'linear-gradient(45deg, #ff8800, #cc6600)';
    } else {
      timerDisplay.style.color = '#007bff';
      timerDisplay.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
    }
    
    // Apply the gradient text effect
    timerDisplay.style.webkitBackgroundClip = 'text';
    timerDisplay.style.webkitTextFillColor = 'transparent';
    timerDisplay.style.backgroundClip = 'text';
  }
}

function moveToNextQuestion() {
  getUserAnswer();
  
  if (index < questions.length - 1) {
    index++;
    showQuestion();
    if (perQuestionDuration && !isNaN(perQuestionDuration)) {
      perQuestionTimer();
    }
  } else {
    handleQuizSubmission();
  }
}

function moveToPrevQuestion() {
  if (index > 0) {
    getUserAnswer();
    index--;
    showQuestion();
    if (perQuestionDuration && !isNaN(perQuestionDuration)) {
      perQuestionTimer();
    }
  }
}

function getUserAnswer() {
  if (!questions || !questions[index]) return;
  
  const questionInputs = document.querySelectorAll(`input[name="q${index}"]`);
  const selectedAnswers = [];
  
  questionInputs.forEach(input => {
    if (input.checked) {
      selectedAnswers.push(input.value);
    }
  });
  
  userAnswers[index] = selectedAnswers;
}

function handleQuizSubmission() {
  getUserAnswer(); // Get the current question's answer
  
  // Calculate score
  let correctAnswers = 0;
  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] && questions[i]) {
      const userAnswer = Array.isArray(userAnswers[i]) ? userAnswers[i].sort() : [userAnswers[i]];
      const correctAnswer = Array.isArray(questions[i].correct) ? questions[i].correct.sort() : [questions[i].correct];
      
      if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
        correctAnswers++;
      }
    }
  }
  
  // Calculate percentage score (0-100) as expected by server
  const scorePercentage = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
  
  console.log(`Score calculation: ${correctAnswers}/${questions.length} = ${scorePercentage}%`); // Debug log
  
  // Get form values and validate they exist
  const nameField = document.getElementById("name");
  const branchField = document.getElementById("branch");
  const yearField = document.getElementById("year");
  const emailField = document.getElementById("email");
  
  if (!nameField || !branchField || !yearField || !emailField) {
    alert("Error: Form fields not found. Please refresh the page and try again.");
    return;
  }
  
  const name = nameField.value.trim();
  const branch = branchField.value.trim();
  const year = yearField.value;
  const email = emailField.value.trim();
  
  // Validate required fields on client side
  if (!name || !branch || !year || !email) {
    alert("Please fill in all required fields.");
    return;
  }
  let exam = localStorage.getItem("name");
  console.log
  
  // Prepare submission data
  const submissionData = {
    name: name,
    branch: branch,
    year: parseInt(year), // Ensure year is a number
    email: email,
    answers: userAnswers,
    score: scorePercentage, // Use percentage score (0-100)
    cheatCount: cheatCount,
    examName: exam || "Unknown Exam" // Ensure examName is provided
  };
  
  console.log('Submitting data:', submissionData);
   // Debug log
  
  // Submit to server
  fetch('/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submissionData)
  })
  .then(response => {
    console.log('Response status:', response.status); // Debug log
    if (response.ok) {
      return response.json();
    } else {
      // Handle HTTP error responses
      return response.json().then(errorData => {
        console.log('Error data:', errorData); // Debug log
        throw new Error(errorData.error || 'Submission failed');
      }).catch(() => {
        // If JSON parsing fails, throw a generic error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      });
    }
  })
  .then(data => {
    // Server returns { message: "Data submitted successfully." } on success
    console.log('Success response:', data); // Debug log
    clearInterval(timerInterval);
    alert(`Quiz submitted successfully! Your score: ${correctAnswers}/${questions.length} (${scorePercentage}%)`);
    window.location.href = '/thankyou.html';
  })
  .catch(error => {
    console.error('Submission error:', error);
    alert('Error submitting quiz: ' + error.message);
  });
}

function reportCheating(reason) {
  fetch('/cheat', {
    method: "POST",
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      cheating: true,
      reason,
    }),
    headers: { "Content-Type": "application/json" },
  }).catch((err) => console.log(`ERROR:-${err}`));
}

function autoSubmit(reason) {
  clearInterval(timerInterval);
  reportCheating(reason);
  isLocked = true;
  handleQuizSubmission();
}

function showCheatWarning() {
  const warning = document.getElementById("cheat-warning");
  if (warning) {
    warning.style.display = "block";
    warningSound.play();
    setTimeout(() => {
      warning.style.display = "none";
    }, 3000);
  }
}

function setupAntiCheat() {
  // Setup fullscreen monitoring
  setupFullscreenMonitoring();
  
  // document.addEventListener("visibilitychange", () => {
  //   if (document.visibilityState === "hidden") {
  //     cheatCount++;
  //     if (!cheatDisplay) cheatDisplay = document.getElementById("cheat-count");
  //     if (cheatDisplay)
  //       cheatDisplay.textContent = `Cheating Attempt: ${cheatCount} / ${totalCheatCount}`;
  //     showCheatWarning();
  //     reportCheating("Tab switched");

  //     if (cheatCount >= totalCheatCount) {
  //       alert("Cheating limit reached. Auto-submitting your quiz.");
  //       autoSubmit("Cheated 3 times");
  //     }
  //   }
  // });

  window.addEventListener("copy", (e) => e.preventDefault());
  window.addEventListener("paste", (e) => e.preventDefault());
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  
  // Keyboard blocking
  document.addEventListener('keydown', (e) => {
    if (keyBlock) {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        cheatCount++;
        if (cheatDisplay) cheatDisplay.textContent = `Cheating Attempt: ${cheatCount} / ${totalCheatCount}`;
        showCheatWarning();
        reportCheating("Attempted to open developer tools");
        
        if (cheatCount >= totalCheatCount) {
          alert("Cheating limit reached. Auto-submitting your quiz.");
          autoSubmit("Attempted to open developer tools 3 times");
        }
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
   console.log('nextQuestion is defined');

   window.nextQuestion = () => {
       if (!isLocked && index < questions.length - 1) {
         moveToNextQuestion();
       }
   };

   window.prevQuestion = () => {
       if (!isLocked && index > 0) {
         moveToPrevQuestion();
       }
   };

   window.submitQuiz = () => {
       // Ensure the last question's answer is captured
       getUserAnswer();

       if (confirm("Are you sure you want to submit your quiz? This action cannot be undone.")) {
         // Force fullscreen before submission
         if (!document.fullscreenElement) {
           forceFullscreen();
           // Wait a moment for fullscreen to activate, then submit
           setTimeout(() => {
             handleQuizSubmission();
           }, 500);
         } else {
           handleQuizSubmission();
         }
       }
   };
});

// Block onload function to prevent certain browser behaviors
function blockOnload() {
  if (keyBlock) {
    document.body.onbeforeunload = function() {
      return "Are you sure you want to leave? Your quiz progress may be lost.";
    };
  }
}

// Initialize block on load
if (typeof blockOnload === 'function') {
  blockOnload();
}

// Ensure questions is an array
if (typeof questions === 'string') {
  try {
    questions = JSON.parse(questions);
  } catch (error) {
    console.error('Failed to parse questions string:', error);
    questions = [];
  }
}

if (!Array.isArray(questions)) {
  console.error('Questions is not an array. Defaulting to an empty array.');
  questions = [];
}