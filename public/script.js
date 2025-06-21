import { questions } from "./data.js";

const BASE_URL = window.location.origin;
const submitURL = `${BASE_URL}/submit`;
const cheatURL = `${BASE_URL}/cheat`;
let score = 0;
let cheatCount = 0;
let timer;
let timeLeft = 30;
const totalTime = timeLeft;
let isLocked = false;
let cheatDisplay;

let timeFlag = 0;

let submit = false;

let keyBlock = false;
// question showing credentials
let globalScore = 0;
let questionSpace = document.querySelector(".question");
let index = 0;

const form = document.getElementById("user-form");
const quizSection = document.getElementById("quiz-section");

const warningSound = new Audio(
  "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
);

function forceFullscreen() {
  requestFullscreen()
    .then(() => {
      document.getElementById("fs-exit-overlay").style.display = "none";
      cheatCount++;

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

let currentQuestion = 0;
if (!submit) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const emailPattern = /^[0-2][0-9][a-z]{3}[0-9]{3}@ietdavv\.edu\.in$/;

    if (!emailPattern.test(email)) {
      alert("Invalid email! Use your IET-DAVV email.");
      return;
    }

    keyBlock = true;
    requestFullscreen()
      .then(() => {
        form.style.display = "none";
        quizSection.style.display = "block";
        cheatDisplay = document.getElementById("cheat-count");
        // showQuestion(currentQuestion);
        // to show question
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

        setupAntiCheat();
        startTimer();
      })
      .catch(() => {
        alert("Please enter full screen to continue. ");
      });
  });
}  
    let type = "radio"; 
    let category = "mcq";
function showQuestion() {
   if(questions[index].correct.length === 1){
    type = "radio";
    category = "MCQ";
   }
   else if(questions[index].correct.length > 1){
    type = "checkbox";
    category = "MSQ";
   }

  questionSpace.innerHTML = `
  <p>Q${index + 1}: ${questions[index].question} type:-${category} </p>
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

  if (index === questions.length - 1) {
    document.querySelector(".nav-buttons").style.display = "none";
  }
}

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
    warning.innerText = `⚠️ Don't try to switch tab or escape the full screen. You already switched ${
      cheatCount + 1
    } time(s). It will auto-submit after 3 attempts.`;
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

//block all keys

window.addEventListener(
  "keydown",
  function (e) {
    // List of all function keys and common hotkeys
    const blockedKeys = [
      "Escape",
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
    ];

    // Prevent Ctrl/Alt/Meta combinations (hotkeys)
    if (e.ctrlKey || e.altKey || e.metaKey || blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
  },
  true
);

function setupAntiCheat() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      cheatCount++;
      if (!cheatDisplay) cheatDisplay = document.getElementById("cheat-count");
      if (cheatDisplay)
        cheatDisplay.textContent = `Cheating Attempts: ${cheatCount} / 3`;
      showCheatWarning();
      reportCheating("Tab switched");

      if (cheatCount > 3) {
        alert("Cheating limit reached. Auto-submitting your quiz.");
        autoSubmit("Cheated 3 times");
      } else {
        // currentQuestion = Math.min(currentQuestion + 1, questions.length - 1);
        index = Math.min(index + 1, questions.length - 1);
        // showQuestion(currentQuestion);
        showQuestion();
      }
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && !isLocked && !submit) {
      // Show overlay or message
      showCheatWarning();
      const overlay = document.getElementById("fs-exit-overlay");
      overlay.style.display = "flex"; // or "block"
    }
  });

  // function to force full do full screen

  window.addEventListener("copy", (e) => e.preventDefault());
  window.addEventListener("paste", (e) => e.preventDefault());
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

let extraSecond = 0;
function startTimer() {
  const label = document.getElementById("timer-text");
  if (!label) return;
  clearInterval(timer); // crutial for timer to work properly
  timeLeft = 30;
  timer = setInterval(() => {
    timeLeft--;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    label.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer); // crutial for timer to work propely

      if (currentQuestion === questions.length - 1) {
        autoSubmit("Time's up on last question");
      } else {
        extraSecond++;
        nextQuestion();
      }
    }
  }, 1000);
}

function submitForm(auto = false) {
  if (submit) return; // Prevent multiple submissions
  submit = true;
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.disabled = true;

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
      window.location.href = "/thankyou.html";
    })
    .catch((err) => console.log(`ERROR: ${err}`));
}

window.nextQuestion = () => {
  const selectedOptions = document.querySelectorAll(
    `input[name="q${index}"]:checked`
  );
  const userAnswers = Array.from(selectedOptions).map((opt) => opt.value);

  const correctAnswers = questions[index].correct; // should be an array like ["a", "c"]

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
  clearInterval(timer);
  startTimer();
};

// document.getElementById("submitBtn").addEventListener('click', submitForm());

const btn = document.getElementById("submitBtn");
if (btn) {
  btn.addEventListener("click", submitForm);
}

const btn2 = document.getElementById("re-enter");
if (btn2) {
  btn2.addEventListener("click", forceFullscreen);
}

// dynamic questions showing
