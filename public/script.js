const BASE_URL = window.location.origin;
const submitURL = `${BASE_URL}/submit`;
const cheatURL = `${BASE_URL}/cheat`;
let score = 0;
let cheatCount = 0;
let timer;
let timeLeft = 120;
const totalTime = timeLeft;
let isLocked = false;
let cheatDisplay;

let submit = false;

let keyBlock = false;

const form = document.getElementById("user-form");
const quizSection = document.getElementById("quiz-section");
const questions = document.querySelectorAll(".question");

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
        showQuestion(currentQuestion);
        setupAntiCheat();
        startTimer();
      })
      .catch(() => {
        alert("Please enter full screen to continue. ");
      });
  });
}
function showQuestion(index) {
  questions.forEach((q, i) => {
    document;
    q.classList.remove("active", "hide");
    q.classList.add(i === index ? "active" : "hide");
  });
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
    // Prevent all keyboard input
    if (e.key === "Escape") {
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

      if (cheatCount >= 3) {
        alert("Cheating limit reached. Auto-submitting your quiz.");
        autoSubmit("Cheated 3 times");
      } else {
        currentQuestion = Math.min(currentQuestion + 1, questions.length - 1);
        showQuestion(currentQuestion);
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

function startTimer() {
  const label = document.getElementById("timer-text");
  if (!label) return;

  timer = setInterval(() => {
    timeLeft--;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    label.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoSubmit("Time expired");
    }
  }, 1000);
}
if (!submit) {
  function submitForm(auto = false) {
    const answers = {
      q1: document.querySelector('input[name="q1"]:checked')?.value,
      q2: document.querySelector('input[name="q2"]:checked')?.value,
      q3: document.querySelector('input[name="q3"]:checked')?.value,
      q4: document.querySelector('input[name="q4"]:checked')?.value,
      q5: document.querySelector('input[name="q5"]:checked')?.value,
    };
    console.log(score);

    fetch(submitURL, {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("name").value,
        branch: document.getElementById("branch").value,
        year: document.getElementById("year").value,
        email: document.getElementById("email").value,
        answers: [
          answers.q1 || "",
          answers.q2 || "",
          answers.q3 || "",
          answers.q4 || "",
          answers.q5 || "",
        ],
        cheatCount: cheatCount,
        score: score,
        timeTaken: totalTime - timeLeft,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then(() => {
        if (!auto) alert("Submitted!");
        submit = true;
        document.removeEventListener("visibilitychange", setupAntiCheat);
        document.removeEventListener("fullscreenchange", setupAntiCheat);
        clearInterval(timer);
        isLocked = true;
        window.location.href = "/thankyou.html";
      })
      .catch((err) => console.log(`ERROR: ${err}`));
  }
}

const correctAnswers = ["a", "b", "c", "a", "b"];

window.nextQuestion = () => {
  if (!isLocked && currentQuestion < questions.length - 1) {
    const selected = document
      .querySelector(`input[name="q${currentQuestion + 1}"]:checked`)
      ?.value?.toLowerCase();

    if (selected && selected === correctAnswers[currentQuestion]) {
      score++;
    }

    currentQuestion++;
    showQuestion(currentQuestion);
  }
};

window.checkQuestion = (index, answer) => {
  if (index < 0 || index >= questions.length) return;
  const question = questions[index];
  const correctAnswer = question.getAttribute("data-answer");
  const answerDisplay = question.querySelector(".answer-display");
  if (answer === correctAnswer) {
    answerDisplay.textContent = "Correct!";
    answerDisplay.style.color = "green";
  } else {
    answerDisplay.textContent = `Incorrect! The correct answer was: ${correctAnswer}`;
    answerDisplay.style.color = "red";
  }
};

window.prevQuestion = () => {
  if (!isLocked && currentQuestion > 0) {
    currentQuestion--;
    showQuestion(currentQuestion);
  }
};
