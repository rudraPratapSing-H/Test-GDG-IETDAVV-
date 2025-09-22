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

    // Validate required fields
    if (!name) {
      alert("Please enter a test name.");
      return;
    }

    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    // Validate file
    if (!file) {
      alert("Please select a file (PDF or JSON).");
      return;
    }

    const validTypes = ['application/pdf', 'application/json', 'text/json'];
    const validExtensions = ['.pdf', '.json'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      alert("Please select a valid PDF or JSON file.");
      return;
    }

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

    // Validate timer inputs
    if (timerType === "overall" && (!overallDuration || overallDuration <= 0)) {
      alert("Please enter a valid overall duration.");
      return;
    }
    if (timerType === "per-question" && (!perQuestionDuration || perQuestionDuration <= 0)) {
      alert("Please enter a valid per-question duration.");
      return;
    }

    const rules = form
      .querySelector("textarea[placeholder*='special rules']")
      .value.trim();
    const cheatCount = parseInt(
      form.querySelector('input[name="cheat-count"]').value
    );

    // Validate cheat count
    if (isNaN(cheatCount) || cheatCount < 0) {
      alert("Please enter a valid cheat count (0 or higher).");
      return;
    }

    const allowKeyboard = form.querySelector(".form-select").value === "yes";
    
    // Validate keyboard selection
    if (form.querySelector(".form-select").value === "") {
      alert("Please select whether to allow keyboard during test.");
      return;
    }

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
      await fetch("/api/uploadTest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Username: username,
        },

        body: uploadData,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Success:", data);
          window.location.href = "/dashboard.html";
        })
        .catch((err) => {
          console.error("Upload error:", err);
          alert("Error uploading! Try again.");
        });
    }
    
    // fetchExam();
  });
});

