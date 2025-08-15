const BASE_URL = window.location.origin;
const submitURL = `${BASE_URL}/submit`;
const cheatURL = `${BASE_URL}/cheat`;
const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", (e) => {
    console.log("working");
    e.preventDefault(); // prevent default form submission

    const name = form.querySelector('[name="test-name"]').value.trim();
    const description = form
      .querySelector('[name="test-description"]')
      .value.trim();

    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    const sheetUrl = form.querySelector('input[name="sheetUrl"]').value.trim();
    localStorage.setItem("sheetUrl", sheetUrl);
    const timerType = form.querySelector(
      'input[name="timer-type"]:checked'
    ).value;

    const overallDurationInput = form.querySelector("#overall-timer-input");
    const perQuestionDurationInput = form.querySelector(
      "#per-question-timer-input"
    );

    const overallDuration =
      timerType === "overall" ? parseInt(overallDurationInput.value) : null;
    const perQuestionDuration =
      timerType === "per-question"
        ? parseInt(perQuestionDurationInput.value)
        : null;

    const rules = form
      .querySelector("textarea[placeholder*='special rules']")
      .value.trim();
    const cheatCount = parseInt(
      form.querySelector('input[name="cheat-count"]').value
    );

    const allowKeyboard = form.querySelector(".form-select").value === "yes";
    let formData;
    async function collectFormData() {
      formData = {
        username: localStorage.getItem("username") || "defaultUser",
        name,
        description,
        date: new Date(),
        file,
        overallDuration,
        perQuestionDuration,
        Rules: rules,
        cheatCount,
        sheetUrl,
        AllowingKeyboard: allowKeyboard,
      };
    }
    collectFormData()
      .then(() => {
        console.log("Collected Form Data:", formData);
      })
      .then(() => {
        uploadTest();
      })
      .catch((err) => console.error("Error collecting form data:", err));

    // ✅ If you want to upload to server:
    const uploadData = new FormData();
    uploadData.append("name", name);
    uploadData.append("description", description);
    uploadData.append("date", formData.date.toISOString());
    uploadData.append("json", file);
    if (overallDuration !== null)
      uploadData.append("overallDuration", overallDuration);
    if (perQuestionDuration !== null)
      uploadData.append("perQuestionDuration", perQuestionDuration);
    uploadData.append("Rules", rules);
    uploadData.append("AllowingKeyboard", allowKeyboard);

    // Example: Send to backend
    async function uploadTest() {
      let url = localStorage.getItem("sheetUrl");
      await fetch("/api/uploadTest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Username: username,
          sheetUrl: url,
        },

        body: uploadData,
      })
        .then((res) => res.json())
        .then((data) => {console.log("Success:", data) })
        .then(() => {
          window.location.href = "/dashboard.html";
        })

        .catch((err) => alert("error uploading! Try again.`"));
    }
    // uploadTest();

    // fetchExam();
  });
});

