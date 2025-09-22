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
// let timeLeft = exam.overallDuration
let isLocked = false;
let cheatDisplay; // Fixed typo
// let keybordPermission = exam.allowingKeyboard || false;
let timeFlag = 0;
let perQuestionDuration;
let sheetUrl;
let submit = false;
let keylock = false;
let keyBlock = false;
// question showing credentials
let globalScore = 0;
let userAnswersArray = []; // Store all user answers
let questionSpace = document.querySelector(".question");
let index = 0;

const form = document.getElementById("user-form");
const quizSection = document.getElementById("quiz-section");

const warningSound = new Audio(
  "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
);

if (!submit) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    blockOnload();
    const email = document.getElementById("email").value.trim();
    const emailPattern = /^[0-2][0-9][a-z]{3}[0-9]{3}@ietdavv\.edu\.in$/;

    if (!emailPattern.test(email)) {
      alert("Invalid email! Use your IET-DAVV email.");
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

 
    requestFullscreen()
      .then(() => {
        form.style.display = "none";
        quizSection.style.display = "block";
        cheatDisplay = document.getElementById("cheat-count");
        
        // Display timer information
        displayTimerInfo();
        
        showQuestion();
        // to show question

        setupAntiCheat();
        if (testDuration && !isNaN(testDuration)) {
          overallTimer();
        } else if (
          data.perQuestionDuration &&
          !isNaN(data.perQuestionDuration)
        ) {
          perQuestionTimer();
        }
      })
      .catch(() => {
        alert("Please enter full screen to continue. ");
      });
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

  if (index === 0) {
    prevBtn.style.display = "none";
  } else {
    prevBtn.style.display = "inline-block";
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

  // Show total duration if available
  if (testDuration && !isNaN(testDuration)) {
    totalDurationInfo.style.display = "block";
    totalDurationDisplay.textContent = testDuration;
  }

  // Show per-question duration if available
  if (perQuestionDuration && !isNaN(perQuestionDuration)) {
    perQuestionInfo.style.display = "block";
    perQuestionDisplay.textContent = perQuestionDuration;
  }

  // Update the timer label based on timer type
  if (perQuestionDuration && !isNaN(perQuestionDuration)) {
    timerLabel.textContent = "⏱️ Question Time Left:";
  } else {
    timerLabel.textContent = "⏰ Total Time Left:";
  }
}

function forceFullscreen() {
  requestFullscreen()
    .then(() => {
      document.getElementById("fs-exit-overlay").style.display = "none";

      cheatDisplay.textContent = `Cheating Attempts: ${cheatCount} / ${totalCheatCount}`;
      
      // Use correct question type
      let type = questions[index].correct.length === 1 ? "radio" : "checkbox";
          
      questionSpace.innerHTML = `
  <p>Q${index + 1}: ${questions[index].question}</p>
  <label><input type="${type}" name="q${index}" value="a" /> ${
        questions[index].a
      }</label><br/>
  <label><input type="${type}" name="q${index}" value="b" /> ${
        questions[index].b
      }</label><br/>
  <label><input type="${type}" name="q${index}" value="c" /> ${
        questions[index].c
      }</label><br/>
  <label><input type="${type}" name="q${index}" value="d" /> ${
        questions[index].d
      }</label>
`;

      reportCheating("Exited fullscreen");

      if (cheatCount >= totalCheatCount) {
        alert("Cheating limit reached. Auto-submitting.");
        autoSubmit(`Exited fullscreen ${totalCheatCount} times`);
      }
    })
    .catch(() => {
      alert("Please allow fullscreen to continue.");
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

// ...existing code...

// DOM handling for create-test.html

// ...existing code...
let currentQuestion = 0;

function reportCheating(reason) {
  fetch(cheatURL, {
    method: "POST",
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      cheating: true,
      reason,
    }),
    headers: { "Content-Type": "application/json" },
  }).catch((err) => console.log(`ERROR: ${err}`));
}

function autoSubmit(reason) {
  clearInterval(timer);
  reportCheating(reason);
  isLocked = true;
  submitForm(true);
}

function showCheatWarning() {
  const warning = document.getElementById("cheat-warning");
  if (warning) {
    warning.innerText = `⚠️ Don't try to switch tab or escape the full screen. You already switched ${cheatCount} time(s). It will auto-submit after ${totalCheatCount} attempts.`;
    warning.style.display = "block";
    warning.style.color = "red";
    warning.style.fontWeight = "bold";
    warning.style.textAlign = "center";

    warningSound.currentTime = 0;
    warningSound.play();

    // ⏱️ Stop sound after 1.5 seconds
    setTimeout(() => {
      warningSound.pause();
      warningSound.currentTime = 0;
    }, 3000);

    // ⏱️ Hide warning message after 3 seconds
  }
}

function warnSound() {
  warningSound.currentTime = 0;
  warningSound.play();

  // ⏱️ Stop sound after 1.5 seconds
  setTimeout(() => {
    warningSound.pause();
    warningSound.currentTime = 0;
  }, 3000);
}

// block all keys
window.addEventListener(
  "keydown",
  function (e) {
    if (keyboardPermission || !keylock) return;

    const blockedKeys = [
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8",
      "F9",
      "F10",
      "F11",
      "F12",
      "Escape",
      "Tab",
    ];

    if (
      blockedKeys.includes(e.key) ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.shiftKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      warnSound();
      cheatCount++;
      if (!cheatDisplay) cheatDisplay = document.getElementById("cheat-count");
      if (cheatDisplay)
        cheatDisplay.textContent = `Cheating Attempts: ${cheatCount} / ${totalCheatCount}`;

      showCheatWarning();
      reportCheating("Pressed undesired keys!");
      if (cheatCount >= totalCheatCount) {
        alert("Cheating limit reached. Auto-submitting your quiz.");
        autoSubmit(`Cheated ${totalCheatCount} times`);
      }
      return false;
    }
  },
  true
);

[
  "contextmenu",
  "copy",
  "paste",
  "cut",
  "selectstart",
  "dragstart",
  "drop",
].forEach((evt) => {
  window.addEventListener(evt, (e) => {
    if (!keylock) return;

    e.preventDefault();
    warningSound.currentTime = 0;
    warningSound.play();
    cheatCount++;
    if (!cheatDisplay) cheatDisplay = document.getElementById("cheat-count");
    if (cheatDisplay)
      cheatDisplay.textContent = `Cheating Attempts: ${cheatCount} / ${totalCheatCount}`;

    showCheatWarning();
    reportCheating("Pressed undesired keys!");

    setTimeout(() => {
      warningSound.pause();
      warningSound.currentTime = 0;
    }, 3000);

    if (cheatCount >= totalCheatCount) {
      alert("Cheating limit reached. Auto-submitting your quiz.");
      autoSubmit(`Cheated ${totalCheatCount} times`);
    }
  });
});

function setupAntiCheat() {
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && !isLocked && !submit) {
      cheatCount++;
      if (!cheatDisplay) cheatDisplay = document.getElementById("cheat-count");
      if (cheatDisplay)
        cheatDisplay.textContent = `Cheating Attempts: ${cheatCount} / ${totalCheatCount}`;

      showCheatWarning();
      reportCheating("Exited fullscreen");

      if (cheatCount >= totalCheatCount) {
        alert("Cheating limit reached. Auto-submitting.");
        autoSubmit(`Exited fullscreen ${totalCheatCount} times`);
      } else {
        const overlay = document.getElementById("fs-exit-overlay");
        if (overlay) overlay.style.display = "flex";
      }
    }
  });

  window.addEventListener("copy", (e) => e.preventDefault());
  window.addEventListener("paste", (e) => e.preventDefault());
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

let extraSecond = 0;
function perQuestionTimer() {
  if (!perQuestionDuration) return;
  const label = document.getElementById("timer-text");
  if (!label) return;
  clearInterval(timer);
  // perQuestionDuration is in seconds, not minutes
  timeLeft = perQuestionDuration + extraSecond;
  timer = setInterval(() => {
    timeLeft--;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    label.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer); // crucial for timer to work properly

      if (index === questions.length - 1) {
        autoSubmit("Time's up on last question");
      } else {
        // Store current answer before moving to next question
        const selectedOptions = document.querySelectorAll(
          `input[name="q${index}"]:checked`
        );
        const userAnswers = Array.from(selectedOptions).map((opt) => opt.value);
        userAnswersArray[index] = userAnswers;

        // Check if answer is correct
        const correctAnswers = questions[index].correct;
        const isCorrect =
          userAnswers.length === correctAnswers.length &&
          userAnswers.every((val) => correctAnswers.includes(val));

        if (isCorrect) {
          globalScore++;
        }

        extraSecond++;
        index++;
        showQuestion();
        perQuestionTimer(); // Restart timer for next question
      }
    }
  }, 1000);
}
function overallTimer() {
  const label = document.getElementById("timer-text");
  if (!label) return;
  clearInterval(timer); // crutial for timer to work properly
  timeLeft = testDuration * 60 + extraSecond; // convert minutes to seconds
  timer = setInterval(() => {
    timeLeft--;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    label.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer); // crutial for timer to work propely
      autoSubmit("Time's up");
    }
  }, 1000);
}

function submitForm(auto = false) {
  if (submit) return; // Prevent multiple submissions
  submit = true;
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.disabled = true;

  // Process the current question if not already processed
  if (!auto) {
    const selectedOptions = document.querySelectorAll(
      `input[name="q${index}"]:checked`
    );
    const userAnswers = Array.from(selectedOptions).map((opt) => opt.value);
    const correctAnswers = questions[index].correct;

    const isCorrect =
      userAnswers.length === correctAnswers.length &&
      userAnswers.every((val) => correctAnswers.includes(val));

    if (isCorrect) {
      globalScore++;
    }
  }

  window.location.href = "/thankyou.html";

  fetch(submitURL, {
    method: "POST",
    body: JSON.stringify({
      name: document.getElementById("name").value,
      branch: document.getElementById("branch").value,
      year: document.getElementById("year").value,
      email: document.getElementById("email").value,
      cheatCount: cheatCount,
      score: globalScore,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then(() => {
      if (!auto) alert("Submitted!");
      document.removeEventListener("visibilitychange", setupAntiCheat);
      document.removeEventListener("fullscreenchange", setupAntiCheat);
      clearInterval(timer);
      isLocked = true;
    })
    .catch((err) => console.log(`ERROR: ${err}`));
}

// document.getElementById("submitBtn").addEventListener('click', submitForm());

window.nextQuestion = () => {
  console.log("Next question clicked", typeof questions);
  
  // Store current question's answer
  const selectedOptions = document.querySelectorAll(
    `input[name="q${index}"]:checked`
  );
  const userAnswers = Array.from(selectedOptions).map((opt) => opt.value);
  userAnswersArray[index] = userAnswers;

  const correctAnswers = questions[index].correct;

  // Compare both arrays (ignoring order)
  const isCorrect =
    userAnswers.length === correctAnswers.length &&
    userAnswers.every((val) => correctAnswers.includes(val));

  if (isCorrect) {
    console.log("Correct answer!");
    globalScore++;
  }
  timeFlag++;
  // currentQuestion++;
  index++;

  if (index >= questions.length) {
    autoSubmit("Finished all questions");
    return;
  }
  if (index === questions.length - 1) {
    document.getElementById("submitBtn").classList.remove("hide");
  }

  // showQuestion(currentQuestion);
  showQuestion();

  // crutial for timer to work propely
  if(perQuestionDuration && !isNaN(perQuestionDuration)) {
    clearInterval(timer);
  perQuestionTimer();
  }

};
// Add this function after window.nextQuestion
window.prevQuestion = () => {
  if (index <= 0) return;
  
  // Store current answer before going back
  const selectedOptions = document.querySelectorAll(
    `input[name="q${index}"]:checked`
  );
  const userAnswers = Array.from(selectedOptions).map((opt) => opt.value);
  userAnswersArray[index] = userAnswers;
  
  index--;
  showQuestion();
  
  // Restore previous answers if they exist
  if (userAnswersArray[index] && userAnswersArray[index].length > 0) {
    userAnswersArray[index].forEach(answer => {
      const input = document.querySelector(`input[name="q${index}"][value="${answer}"]`);
      if (input) input.checked = true;
    });
  }
  
  // Restart per-question timer if in per-question mode
  if (perQuestionDuration && !isNaN(perQuestionDuration)) {
    clearInterval(timer);
    perQuestionTimer();
  }
};


const btn = document.getElementById("submitBtn");
if (btn) {
  btn.addEventListener("click", submitForm);
}

const btn2 = document.getElementById("re-enter");
if (btn2) {
  btn2.addEventListener("click", forceFullscreen);
}

// dynamic questions showing

// function for preventing window loading
function blockOnload() {
  localStorage.setItem("blockOnload", "true");
  console.log("Next time, window.onload will be blocked!");
}
