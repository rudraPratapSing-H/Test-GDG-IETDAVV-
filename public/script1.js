// import { Keyboard, Alert } from 'react-native'};

const BASE_URL = window.location.origin;
const submitURL = `${BASE_URL}/submit`;
const cheatURL = `${BASE_URL}/cheat`;
let scorePercentage = 0; // Declare scorePercentage variable
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

  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] && JSON.stringify(userAnswers[i]) === JSON.stringify(questions[i].correct)) {
      correctAnswers++;
    }
  }

  // Calculate percentage score (0-100)
  scorePercentage = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

  // Alert the user about their score
  alert(`Your score is ${scorePercentage}%.`);

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
           name: document.getElementById("name").value.trim(),
           branch: document.getElementById("branch").value.trim(),
           year: parseInt(document.getElementById("year").value),
           email: email,
           uniqueCode: uniqueCode,
           answers: userAnswers,
           score: scorePercentage, // Assuming calculateScore() exists
           cheatCount: cheatCount,
           examName: localStorage.getItem("name") || "Unknown Exam"
       };

       console.log('Submitting data:', submissionData);

       // Submit to server
       fetch('/submit', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify(submissionData)
       })
       .then(response => response.json())
       .then(data => {
           console.log('Submission successful:', data);
                   window.location.href = "thankyou.html";

           alert('Quiz submitted successfully!');
       })
       .catch(error => {
           console.error('Submission failed:', error);
           alert('Failed to submit quiz. Please try again later.');
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

       // Retrieve unique code from the form
       const uniqueCodeField = document.getElementById("unique-code");
       console.log('uniqueCodeField:', uniqueCodeField);
       console.log('emailField:', document.getElementById("email"));
       const uniqueCode = uniqueCodeField ? uniqueCodeField.value.trim() : null;

       // Retrieve email from the form
       const emailField = document.getElementById("email");
       const email = emailField ? emailField.value.trim() : null;

       // Validate unique code and email
       let isValid = false;
       if (uniqueCode && email) {
           isValid = EU.some(entry => entry.email === email && entry.uniqueCode === uniqueCode);
       }

       if (!isValid) {
           alert('Invalid unique code or email. Please check and try again.');
           window.location.reload();

           return;
       }

       // Calculate score before submission
       let correctAnswers = 0;
       for (let i = 0; i < questions.length; i++) {
           if (userAnswers[i] && JSON.stringify(userAnswers[i]) === JSON.stringify(questions[i].correct)) {
               correctAnswers++;
           }
       }

       // Calculate percentage score (0-100)
       scorePercentage = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

       // Alert the user about their score
       alert(`Your score is ${scorePercentage}%.`);

       console.log(`Score calculation: ${correctAnswers}/${questions.length} = ${scorePercentage}%`); // Debug log

       // Prepare submission data
       const submissionData = {
           name: document.getElementById("name").value.trim(),
           branch: document.getElementById("branch").value.trim(),
           year: parseInt(document.getElementById("year").value),
           email: email,
           uniqueCode: uniqueCode,
           answers: userAnswers,
           score: scorePercentage,
           cheatCount: cheatCount,
           examName: localStorage.getItem("name") || "Unknown Exam"
       };

       console.log('Submitting data:', submissionData);

       // Submit to server
       fetch('/submit', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify(submissionData)
       })
       .then(response => response.json())
       .then(data => {
           console.log('Submission successful:', data);
                   window.location.href = "thankyou.html";
           alert('Quiz submitted successfully!');
           
       })
       .catch(error => {
           console.error('Submission failed:', error);
           alert('Failed to submit quiz. Please try again later.');
       });
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

// Hardcoded EU array
const EU = [
  {
    "email": "prashasht61@gmail.com",
    "uniqueCode": "1"
  },
  {
    "email": "avnipandey0723@gmail.com",
    "uniqueCode": "2"
  },
  {
    "email": "atharvporwal53@gmail.com",
    "uniqueCode": "3"
  },
  {
    "email": "anshikabhand09@gmail.com",
    "uniqueCode": "4"
  },
  {
    "email": "adityagupta86548@gmail.com",
    "uniqueCode": "5"
  },
  {
    "email": "shivambose07@gmail.com",
    "uniqueCode": "6"
  },
  {
    "email": "parmarkumkum2007@gmail.com",
    "uniqueCode": "7"
  },
  {
    "email": "avaniupadhyay17@gmail.com",
    "uniqueCode": "8"
  },
  {
    "email": "ektabare6@gmail.com",
    "uniqueCode": "9"
  },
  {
    "email": "bhinijain2006@gmail.com",
    "uniqueCode": "10"
  },
  {
    "email": "mehulaithekar@gmail.com",
    "uniqueCode": "11"
  },
  {
    "email": "mananc2007@gmail.com",
    "uniqueCode": "12"
  },
  {
    "email": "umang.b@gmail.com",
    "uniqueCode": "14"
  },
  {
    "email": "priyankanihalani9@gmail.com",
    "uniqueCode": "15"
  },
  {
    "email": "suhanihedau5@gmail.com",
    "uniqueCode": "16"
  },
  {
    "email": "prakharbandi7@gmail.com",
    "uniqueCode": "17"
  },
  {
    "email": "vinay1006r@gmail.com",
    "uniqueCode": "18"
  },
  {
    "email": "kavyanshsaxena23@gmail.com",
    "uniqueCode": "19"
  },
  {
    "email": "priyalsoni9528@gmail.com",
    "uniqueCode": "20"
  },
  {
    "email": "ps25.pragya@gmail.com",
    "uniqueCode": "21"
  },
  {
    "email": "agratachaturvedi8@gmail.com",
    "uniqueCode": "22"
  },
  {
    "email": "24btc041@ietdavv.edu.in",
    "uniqueCode": "23"
  },
  {
    "email": "anitadhakad333@gmail.com",
    "uniqueCode": "24"
  },
  {
    "email": "23bcs101@ietdavv.edu.in",
    "uniqueCode": "25"
  },
  {
    "email": "parsaivaidik25@gmail.com",
    "uniqueCode": "26"
  },
  {
    "email": "angelkalra122046@gmail.com",
    "uniqueCode": "27"
  },
  {
    "email": "parthjagwani9@gmail.com",
    "uniqueCode": "28"
  },
  {
    "email": "khandelwalmahi004@gmail.com",
    "uniqueCode": "29"
  },
  {
    "email": "9664047628pawan@gmail.com",
    "uniqueCode": "30"
  },
  {
    "email": "Vedikagangrade0111@gmail.com",
    "uniqueCode": "31"
  },
  {
    "email": "suryanshteepa1@gmail.com",
    "uniqueCode": "32"
  },
  {
    "email": "patelrashik247@gmail.com",
    "uniqueCode": "33"
  },
  {
    "email": "aryanmasani9@gmail.com",
    "uniqueCode": "34"
  },
  {
    "email": "naitik9575@gmail.com",
    "uniqueCode": "35"
  },
  {
    "email": "nehadsoni@gmail.com",
    "uniqueCode": "36"
  },
  {
    "email": "bankeyharsh11@gmail.com",
    "uniqueCode": "37"
  },
  {
    "email": "utkarshpandey3456@gmail.com",
    "uniqueCode": "38"
  },
  {
    "email": "jaydevverma029@gmail.com",
    "uniqueCode": "39"
  },
  {
    "email": "tajhatim8@gmail.com",
    "uniqueCode": "40"
  },
  {
    "email": "24bcs034@ietdavv.edu.in",
    "uniqueCode": "41"
  },
  {
    "email": "24bcb073@ietdavv.edu.in",
    "uniqueCode": "42"
  },
  {
    "email": "aishwaryamandlecha13@gmail.com",
    "uniqueCode": "43"
  },
  {
    "email": "shivamgupta262007@gmail.com",
    "uniqueCode": "44"
  },
  {
    "email": "2006jainparv@gmail.com",
    "uniqueCode": "45"
  },
  {
    "email": "24bcs171@ietdavv.edu.in",
    "uniqueCode": "46"
  },
  {
    "email": "prathmeshkumarsingh46395@gmail.com",
    "uniqueCode": "47"
  },
  {
    "email": "24bcs152@ietdavv.edu.in",
    "uniqueCode": "48"
  },
  {
    "email": "Vinitaporwal40@gmail.com",
    "uniqueCode": "49"
  },
  {
    "email": "abhisheksharma67658@gmail.com",
    "uniqueCode": "50"
  },
  {
    "email": "ananyatiwari3092007@gmail.com",
    "uniqueCode": "51"
  },
  {
    "email": "asthaporwal19@gmail.com",
    "uniqueCode": "52"
  },
  {
    "email": "rrishiyadav1919@gmail.com",
    "uniqueCode": "53"
  },
  {
    "email": "surajbhawsar014@gmail.com",
    "uniqueCode": "54"
  },
  {
    "email": "princynanno@gmail.com",
    "uniqueCode": "55"
  },
  {
    "email": "antima.singh.csrl@gmail.com",
    "uniqueCode": "56"
  },
  {
    "email": "khushibarkur@gmail.com",
    "uniqueCode": "57"
  },
  {
    "email": "ahirwarsonam063@gmail.com",
    "uniqueCode": "58"
  },
  {
    "email": "aryanmeena93023@gmail.com",
    "uniqueCode": "59"
  },
  {
    "email": "aisha.21217940@gmail.com",
    "uniqueCode": "60"
  },
  {
    "email": "luckykaran56@gmail.com",
    "uniqueCode": "61"
  },
  {
    "email": "Shejolesumesh@gmail.com",
    "uniqueCode": "62"
  },
  {
    "email": "mitanshjain143@gmail.com",
    "uniqueCode": "63"
  },
  {
    "email": "piyushsalve2296@gmail.com",
    "uniqueCode": "64"
  },
  {
    "email": "anahitamodi37@gmail.com",
    "uniqueCode": "65"
  },
  {
    "email": "khushikhusi587@gmail.com",
    "uniqueCode": "66"
  },
  {
    "email": "krishnpalsingh7926@gmail.com",
    "uniqueCode": "67"
  },
  {
    "email": "ysen9224@gmail.com",
    "uniqueCode": "68"
  },
  {
    "email": "shivanidhanore086@gmail.com",
    "uniqueCode": "69"
  },
  {
    "email": "np9827016@gmail.com",
    "uniqueCode": "70"
  },
  {
    "email": "shivanshukhode043@gmail.com",
    "uniqueCode": "71"
  },
  {
    "email": "officialaachman03@gmail.com",
    "uniqueCode": "72"
  },
  {
    "email": "24bei051@ietdavv.edu.in",
    "uniqueCode": "73"
  },
  {
    "email": "stutisahu410@gmail.com",
    "uniqueCode": "74"
  },
  {
    "email": "kanakk2412@gmail.com",
    "uniqueCode": "75"
  },
  {
    "email": "Ankushnema20@gmail.com",
    "uniqueCode": "76"
  },
  {
    "email": "revanimgaonkar06@gmail.com",
    "uniqueCode": "77"
  },
  {
    "email": "parauhaanjali28@gmail.com",
    "uniqueCode": "78"
  },
  {
    "email": "bhavyaagrawat7059@gmail.com",
    "uniqueCode": "79"
  },
  {
    "email": "niteshmali0223@gmail.com",
    "uniqueCode": "80"
  },
  {
    "email": "aryanneekhra9806@gmail.com",
    "uniqueCode": "81"
  },
  {
    "email": "patidarpreetam13@gmail.com",
    "uniqueCode": "82"
  },
  {
    "email": "anaygattani@gmail.com",
    "uniqueCode": "83"
  },
  {
    "email": "prakratcs@gmail.com",
    "uniqueCode": "84"
  },
  {
    "email": "adityajnv10@gmail.com",
    "uniqueCode": "85"
  },
  {
    "email": "gouravyadav0718@gmail.com",
    "uniqueCode": "86"
  },
  {
    "email": "23btc036@ietdavv.edu.in",
    "uniqueCode": "87"
  },
  {
    "email": "24bcs031@ietdavv.edu.in",
    "uniqueCode": "88"
  },
  {
    "email": "nikitamahajan1622002@gmail.com",
    "uniqueCode": "89"
  },
  {
    "email": "abhaysinghb36@gmail.com",
    "uniqueCode": "90"
  },
  {
    "email": "24bit025@ietdavv.edu.in",
    "uniqueCode": "91"
  },
  {
    "email": "jobinfo.twinkal@gmail.com",
    "uniqueCode": "92"
  },
  {
    "email": "singh.ranvir.0208@gmail.com",
    "uniqueCode": "93"
  },
  {
    "email": "ishajrathor1616@gmail.com",
    "uniqueCode": "94"
  },
  {
    "email": "24bcs066@ietdavv.edu.in",
    "uniqueCode": "95"
  },
  {
    "email": "harshitpatidar011@gmail.com",
    "uniqueCode": "96"
  },
  {
    "email": "chetandeshmukh2505@gmail.com",
    "uniqueCode": "97"
  },
  {
    "email": "khamkarmanashvi@gmail.com",
    "uniqueCode": "98"
  },
  {
    "email": "dandharearpit56@gmail.com",
    "uniqueCode": "99"
  },
  {
    "email": "Soumyachandel1@gmail.com",
    "uniqueCode": "100"
  },
  {
    "email": "adityasitola03@gmail.com",
    "uniqueCode": "101"
  },
  {
    "email": "dhruvij33@gmail.com",
    "uniqueCode": "102"
  },
  {
    "email": "kartavyakumarkurmi6@gmail.com",
    "uniqueCode": "103"
  },
  {
    "email": "smrititigga8@gmail.com",
    "uniqueCode": "104"
  },
  {
    "email": "siyakgupta2308@gmail.com",
    "uniqueCode": "105"
  },
  {
    "email": "vinitpatidar626@gmail.com",
    "uniqueCode": "106"
  },
  {
    "email": "satyamjatav56@gmail.com",
    "uniqueCode": "107"
  },
  {
    "email": "sanjanamandrai12@gmail.com",
    "uniqueCode": "108"
  },
  {
    "email": "twinkleassudani@gmail.com",
    "uniqueCode": "109"
  },
  {
    "email": "jpalak233@gmail.com",
    "uniqueCode": "110"
  },
  {
    "email": "kewatevansh01@gmail.com",
    "uniqueCode": "111"
  },
  {
    "email": "ms1293369@gamil.com",
    "uniqueCode": "112"
  },
  {
    "email": "lakshyadeepkale@gmail.com",
    "uniqueCode": "113"
  },
  {
    "email": "jayeshbetav16@gmail.com",
    "uniqueCode": "114"
  },
  {
    "email": "1anadi1sharma@gmail.com",
    "uniqueCode": "115"
  },
  {
    "email": "Jainchiku408@gmail.com",
    "uniqueCode": "116"
  },
  {
    "email": "ankushsingh8871@gmail.com",
    "uniqueCode": "117"
  },
  {
    "email": "bhagyaasati@gmail.com",
    "uniqueCode": "118"
  },
  {
    "email": "dmahi465@gmail.com",
    "uniqueCode": "119"
  },
  {
    "email": "sonimahak21@gmail.com",
    "uniqueCode": "120"
  },
  {
    "email": "gmukati03@gmail.com",
    "uniqueCode": "121"
  },
  {
    "email": "moksh.jain.dhar@gmail.com",
    "uniqueCode": "122"
  },
  {
    "email": "amishmahajan26@gmail.com",
    "uniqueCode": "123"
  },
  {
    "email": "gehnabhawsar1@gmail.com",
    "uniqueCode": "124"
  },
  {
    "email": "aadeshj646@gmail.com",
    "uniqueCode": "125"
  },
  {
    "email": "mirdeeba7@gmail.com",
    "uniqueCode": "126"
  },
  {
    "email": "5132tanish@gmail.com",
    "uniqueCode": "127"
  },
  {
    "email": "yashtomar14012007@gmail.com",
    "uniqueCode": "128"
  },
  {
    "email": "anujtibdewal7@gmail.com",
    "uniqueCode": "129"
  },
  {
    "email": "apksharathore6@gmail.com",
    "uniqueCode": "130"
  },
  {
    "email": "ishanshahi200@gmail.com",
    "uniqueCode": "131"
  },
  {
    "email": "arpitkumarguptaakg@gmail.com",
    "uniqueCode": "132"
  },
  {
    "email": "jodhwanijayant1313@gmail.com",
    "uniqueCode": "133"
  },
  {
    "email": "anshikatrivedi098@gmail.com",
    "uniqueCode": "134"
  },
  {
    "email": "23bcs070@ietdavv.edu.in",
    "uniqueCode": "135"
  },
  {
    "email": "shubhisaraf.13@gmail.com",
    "uniqueCode": "136"
  },
  {
    "email": "aliayaan28506@gmail.com",
    "uniqueCode": "137"
  },
  {
    "email": "palakdubey0306@gmail.com",
    "uniqueCode": "138"
  },
  {
    "email": "vikaskelwa1497@gmail.com",
    "uniqueCode": "139"
  },
  {
    "email": "agaurhar@gmail.com",
    "uniqueCode": "140"
  },
  {
    "email": "kanhaagrawal272@gmail.com",
    "uniqueCode": "141"
  },
  {
    "email": "Sneharaghuwanshi05@gmail.com",
    "uniqueCode": "142"
  },
  {
    "email": "a2043728022@gmail.com",
    "uniqueCode": "143"
  },
  {
    "email": "aagamjain762@gmail.com",
    "uniqueCode": "144"
  },
  {
    "email": "24bit120@ietdavv.edu.in",
    "uniqueCode": "145"
  },
  {
    "email": "ishakumbhkar958@gmail.com",
    "uniqueCode": "146"
  },
  {
    "email": "adityakumawat709@gmail.com",
    "uniqueCode": "147"
  },
  {
    "email": "ami.tated04@gmail.com",
    "uniqueCode": "148"
  },
  {
    "email": "sumit7067singh@gmail.com",
    "uniqueCode": "149"
  },
  {
    "email": "raotanishq082@gmail.com",
    "uniqueCode": "150"
  },
  {
    "email": "nainachourasia21@gmail.com",
    "uniqueCode": "151"
  },
  {
    "email": "sheikhrafe786@gmail.com",
    "uniqueCode": "152"
  },
  {
    "email": "24bcv045@IET-DAVV.edu.in",
    "uniqueCode": "153"
  },
  {
    "email": "ap5934400@gmail.com",
    "uniqueCode": "154"
  },
  {
    "email": "jayeshshastri0993@gmail.com",
    "uniqueCode": "155"
  },
  {
    "email": "priyanshuarya994@gmail.com",
    "uniqueCode": "156"
  },
  {
    "email": "raghuwanshinainsi@gmail.com",
    "uniqueCode": "157"
  },
  {
    "email": "reenarewer@gmail.com",
    "uniqueCode": "158"
  },
  {
    "email": "hetvirathore248@gmail.com",
    "uniqueCode": "159"
  },
  {
    "email": "shridharpandey500000@gmail.com",
    "uniqueCode": "160"
  },
  {
    "email": "kalawatiahirwar16@gmail.com",
    "uniqueCode": "161"
  },
  {
    "email": "kabiryadav588@gmail.com",
    "uniqueCode": "162"
  },
  {
    "email": "patidarbhawana2006@gmail.com",
    "uniqueCode": "163"
  },
  {
    "email": "muskan66504@gmail.com",
    "uniqueCode": "164"
  },
  {
    "email": "agrawalyash2206@gmail.com",
    "uniqueCode": "165"
  },
  {
    "email": "nihalparteti26@gmail.com",
    "uniqueCode": "166"
  },
  {
    "email": "palakmaheshwari999@gmail.com",
    "uniqueCode": "167"
  },
  {
    "email": "raghav21184@gmail.com",
    "uniqueCode": "168"
  },
  {
    "email": "sidranoorkhan11@gmail.com",
    "uniqueCode": "169"
  },
  {
    "email": "24bcs029@ietdavv.edu.in",
    "uniqueCode": "170"
  },
  {
    "email": "Tisyadhruv@gmail.com",
    "uniqueCode": "171"
  },
  {
    "email": "121yash212@gmail.com",
    "uniqueCode": "172"
  },
  {
    "email": "shubhikashukla24@gmail.com",
    "uniqueCode": "173"
  },
  {
    "email": "shivrashi282@gmail.com",
    "uniqueCode": "174"
  },
  {
    "email": "divyanshivaishnav554@gmail.com",
    "uniqueCode": "175"
  },
  {
    "email": "24bcs143@ietdavv.edu.in",
    "uniqueCode": "176"
  },
  {
    "email": "24bit080@ietdavv.edu.in",
    "uniqueCode": "177"
  },
  {
    "email": "beingkhushi22@gmail.com",
    "uniqueCode": "178"
  },
  {
    "email": "parasmanipatel2010@gmail.com",
    "uniqueCode": "179"
  },
  {
    "email": "24bit152@ietdavv.edu.in",
    "uniqueCode": "180"
  },
  {
    "email": "charvijain77@gmail.com",
    "uniqueCode": "181"
  },
  {
    "email": "divyanshkarma98@gmail.com",
    "uniqueCode": "182"
  },
  {
    "email": "vrandamundra27@gmail.com",
    "uniqueCode": "183"
  },
  {
    "email": "ashwini.gupta.9@gmail.com",
    "uniqueCode": "184"
  },
  {
    "email": "tusharrthr007@gmail.com",
    "uniqueCode": "185"
  },
  {
    "email": "24bcs064@ietdavv.edu.in",
    "uniqueCode": "186"
  },
  {
    "email": "zaki.khan.8311@gmail.com",
    "uniqueCode": "187"
  },
  {
    "email": "ritikvora1911@gmail.com",
    "uniqueCode": "188"
  },
  {
    "email": "ayushi.parmar2610@gmail.com",
    "uniqueCode": "189"
  },
  {
    "email": "shiv07raghu@gmail.com",
    "uniqueCode": "190"
  },
  {
    "email": "ambersaluja2006@gmail.com",
    "uniqueCode": "191"
  },
  {
    "email": "naitikboriya16@gmail.com",
    "uniqueCode": "192"
  },
  {
    "email": "24bcs032@ietdavv.edu.in",
    "uniqueCode": "193"
  },
  {
    "email": "24bcs133@ietdavv.edu.in",
    "uniqueCode": "194"
  },
  {
    "email": "ranjeetsitole2007@gmail.com",
    "uniqueCode": "195"
  },
  {
    "email": "mouryarahul068@gmail.com",
    "uniqueCode": "196"
  },
  {
    "email": "anshikatiwari9990@gmail.com",
    "uniqueCode": "197"
  },
  {
    "email": "24btc124@ietdavv.edu.in",
    "uniqueCode": "198"
  },
  {
    "email": "adityasitola03@gmail.com",
    "uniqueCode": "199"
  },
  {
    "email": "Sarthakpatidar27sp@gmail.com",
    "uniqueCode": "200"
  },
  {
    "email": "raoanuhp7@gmail.com",
    "uniqueCode": "201"
  },
  {
    "email": "latathakur1790@gmail.com",
    "uniqueCode": "202"
  },
  {
    "email": "deepanshuvanchhode@gmail.com",
    "uniqueCode": "203"
  },
  {
    "email": "naveenpatel21062006@gmail.com",
    "uniqueCode": "204"
  },
  {
    "email": "24btc137@ietdavv.edu.in",
    "uniqueCode": "205"
  },
  {
    "email": "sarthaksomtiya@gmail.com",
    "uniqueCode": "206"
  },
  {
    "email": "harshitsiddharth3@gmail.com",
    "uniqueCode": "207"
  },
  {
    "email": "vedikawadgaonkar@gmail.com",
    "uniqueCode": "208"
  },
  {
    "email": "pandeypranjali658@gmail.com",
    "uniqueCode": "209"
  },
  {
    "email": "lakshyarohitas127@gmail.com",
    "uniqueCode": "210"
  },
  {
    "email": "omniranjan108@gmail.com",
    "uniqueCode": "211"
  },
  {
    "email": "vishnukhatik2004@gmail.com",
    "uniqueCode": "212"
  },
  {
    "email": "jyotiarya2006@gmail.com",
    "uniqueCode": "213"
  },
  {
    "email": "mohitmotwani002@gmail.com",
    "uniqueCode": "214"
  },
  {
    "email": "rishi.73.patel@gmail.com",
    "uniqueCode": "215"
  },
  {
    "email": "shivanshu200720072007@gmail.com",
    "uniqueCode": "216"
  },
  {
    "email": "ramr887685@gmail.com",
    "uniqueCode": "217"
  },
  {
    "email": "dsbaghel2231@gmail.com",
    "uniqueCode": "218"
  },
  {
    "email": "rajputsameeksha2005@gmail.com",
    "uniqueCode": "219"
  },
  {
    "email": "vishalkirar091@gmail.com",
    "uniqueCode": "220"
  },
  {
    "email": "sejalsomkuwar1@gmail.com",
    "uniqueCode": "221"
  },
  {
    "email": "24btc011@ietdavv.edu.in",
    "uniqueCode": "222"
  },
  {
    "email": "24btc013@ietdavv.edu.in",
    "uniqueCode": "223"
  },
  {
    "email": "24bcb047@ietdavv.edu.in",
    "uniqueCode": "224"
  },
  {
    "email": "arnav.kekre.2807@gmail.com",
    "uniqueCode": "225"
  },
  {
    "email": "24btc118@ietdavv.edu.in",
    "uniqueCode": "226"
  },
  {
    "email": "aayushchourasia2022@gmail.com",
    "uniqueCode": "227"
  },
  {
    "email": "deebamir146@gmail.com",
    "uniqueCode": "228"
  },
  {
    "email": "leonrudy1403@gmail.com",
    "uniqueCode": "229"
  },
  {
    "email": "24bcs171@ietdavv.edu.in",
    "uniqueCode": "230"
  },
  
  
]

