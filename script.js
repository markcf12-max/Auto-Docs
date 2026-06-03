let generatedText = "";

const fields = [
  "case",
  "details",
  "name",
  "min",
  "company",
  "email",
  "thread",
  "datetime",
  "action",
  "wocas",
  "compactMode"
];

/* =========================
   SAVE DATA (SAFE)
========================= */
function saveData() {
  const data = {};

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    data[id] = el.type === "checkbox" ? el.checked : el.value;
  });

  localStorage.setItem("auto_docs", JSON.stringify(data));
}

/* =========================
   LOAD DATA (SAFE)
========================= */
function loadData() {
  const saved = localStorage.getItem("auto_docs");
  if (!saved) return;

  const data = JSON.parse(saved);

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el || data[id] === undefined) return;

    if (el.type === "checkbox") {
      el.checked = data[id];
    } else {
      el.value = data[id];
    }
  });
}

/* =========================
   AUTO SAVE LISTENERS
========================= */
function initAutoSave() {
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", saveData);
    el.addEventListener("change", saveData);
  });
}

/* =========================
   AUTO DOCS SCRIPT
========================= */

function generateDoc() {
  const caseNum = document.getElementById("case").value.trim();
  const details = document.getElementById("details").value.trim();
  const name = document.getElementById("name").value.trim();
  const min = document.getElementById("min").value.trim();
  const company = document.getElementById("company").value.trim();
  const email = document.getElementById("email").value.trim();
  const thread = document.getElementById("thread").value.trim();
  const datetime = document.getElementById("datetime").value.trim();
  const action = document.getElementById("action").value.trim();
  const wocas = document.getElementById("wocas").value.trim();

  if (!caseNum) {
    alert("Please enter CASE number");
    return;
  }

  const output = 
`CASE: ${caseNum}
DETAILS OF THE CONCERN: ${details}
NAME: ${name}
MIN: ${min}
COMPANY NAME: ${company}
EMAIL ADDRESS: ${email}
THREAD CASE NUMBER: ${thread}
DATE & TIME EMAIL RECEIVED: ${datetime}
ACTION TAKEN: ${action}
WOCAS: ${wocas}`;

  document.getElementById("output").textContent = output;

  // Save to localStorage so it won't be lost on refresh
  localStorage.setItem("autoDocsData", JSON.stringify({
    caseNum, details, name, min, company, email, thread, datetime, action, wocas
  }));
}

function copyDoc() {
  const output = document.getElementById("output").textContent;
  if (!output) return;
  navigator.clipboard.writeText(output)
    .then(() => alert("Copied to clipboard!"));
}

function downloadTxt() {
  const output = document.getElementById("output").textContent;
  if (!output) return;
  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AutoDoc_${new Date().toISOString()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetForm() {
  document.querySelectorAll("input, textarea").forEach(el => el.value = "");
  document.getElementById("output").textContent = "";
  localStorage.removeItem("autoDocsData");
}

// =========================
// Load saved data on page refresh
// =========================
window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("autoDocsData"));
  if (!saved) return;

  document.getElementById("case").value = saved.caseNum || "";
  document.getElementById("details").value = saved.details || "";
  document.getElementById("name").value = saved.name || "";
  document.getElementById("min").value = saved.min || "";
  document.getElementById("company").value = saved.company || "";
  document.getElementById("email").value = saved.email || "";
  document.getElementById("thread").value = saved.thread || "";
  document.getElementById("datetime").value = saved.datetime || "";
  document.getElementById("action").value = saved.action || "";
  document.getElementById("wocas").value = saved.wocas || "";
  
  generateDoc(); // regenerate output automatically
});

/* =========================
   CLEAR
========================= */
window.clearForm = function () {
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === "checkbox") {
      el.checked = false;
    } else {
      el.value = "";
    }
  });

  localStorage.removeItem("auto_docs");
  document.getElementById("output").textContent = "";
  generatedText = "";
};

/* =========================
   RESET BUTTON
========================= */

window.resetForm = function () {

  document.getElementById("case").value = "";
  document.getElementById("details").value = "";
  document.getElementById("name").value = "";
  document.getElementById("min").value = "";
  document.getElementById("company").value = "";
  document.getElementById("email").value = "";
  document.getElementById("thread").value = "";
  document.getElementById("datetime").value = "";
  document.getElementById("action").value = "";
  document.getElementById("wocas").value = "";

  document.getElementById("output").textContent = "";
};

/* =========================
   INIT (IMPORTANT ORDER)
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  initAutoSave();
});
