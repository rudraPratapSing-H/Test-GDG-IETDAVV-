const submitURL = "http://localhost:3000/submit";
const cheatURL = "http://localhost:3000/cheat";






//report tab switching.
let submit = false;
let visibilityHandler;
visibilityHandler = () => {
  if (document.visibilityState === "hidden") {
    reportCheating("Tab switched or minimized");
  }
};

document.addEventListener("visibilitychange", visibilityHandler);

const form = document.getElementById("user-form");
const quizSection = document.getElementById("quiz-section");
const questions = document.querySelectorAll(".question");
let currentQuestion = 0;

// logic for leting a email attempt only once.
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submitBtn");

emailInput.addEventListener("input", async () => {
  const email = emailInput.value;

  if (!email || !email.includes("@")) {
    submitBtn.disabled = true;
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    submitBtn.disabled = data.exists; // disable if exists
  } catch (err) {
    console.error("Error checking email:", err);
    submitBtn.disabled = true;
  }
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const emailPattern = /^[0-9][a-zA-Z0-9]*[0-9]@ietdavv\.edu\.in$/;

  if (!emailPattern.test(email)) {
    alert("Invalid email! write the email provided by IET-DAVV.");
    return;
  }

  form.style.display = "none";
  quizSection.style.display = "block";
  showQuestion(currentQuestion);
});

function showQuestion(index) {
  questions.forEach((q, i) => {
    q.classList.remove("active");
    if (i === index) q.classList.add("active");
  });
}
// to hide the particular question that user tried to cheat on.
function hideQuestion(index) {
  questions.forEach((q, i) => {
    q.classList.remove("active");
    if (i === index) q.classList.add("hide");
  });
}

function nextQuestion() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion(currentQuestion);
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion(currentQuestion);
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
  })
    .then(() => {
      alert(
        "Tab switched or minimized. Therefore you won't be able to attempt this question"
      );
      hideQuestion(currentQuestion);

      if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
      } else if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion(questions);
      }
    })
    .catch((err) => console.log(`ERROR:-${err}`));
}

function submitForm() {
  const answers = {
    q1: document.querySelector('input[name="q1"]:checked')?.value,
    q2: document.querySelector('input[name="q2"]:checked')?.value,
    q3: document.querySelector('input[name="q3"]:checked')?.value,
    q4: document.querySelector('input[name="q4"]:checked')?.value,
    q5: document.querySelector('input[name="q5"]:checked')?.value,
  };
  // object storing all the marked answers

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
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then(() => {
      alert("Submitted!");
      submit = true;

      document.removeEventListener("visibilitychange", visibilityHandler);
      window.location.href = "/thankyou.html"; // optional
    })
    .catch((err) => console.log(`ERROR:-${err}`));
}
