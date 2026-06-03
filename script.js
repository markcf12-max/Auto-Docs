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
  "wocas"
];

/* =========================
   SAVE DATA
========================= */
function saveData() {
  const data = {};

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    data[id] = el.value;
  });

  localStorage.setItem("auto_docs", JSON.stringify(data));
}

/* =========================
   LOAD DATA
========================= */
function loadData() {
  const saved = localStorage.getItem("auto_docs");
  if (!saved) return;

  const data = JSON.parse(saved);

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el || data[id] === undefined) return;

    el.value = data[id];
  });
}

/* =========================
   AUTO SAVE
========================= */
function initAutoSave() {
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", saveData);
  });
}

/* =========================
   GENERATE
========================= */
function generateDoc() {
  const caseNum = document.getElementById("case").value.trim();

  if (!caseNum) {
    alert("Please enter CASE number");
    return;
  }

  const output =
`CASE: ${caseNum}
DETAILS OF THE CONCERN: ${document.getElementById("details").value}
NAME: ${document.getElementById("name").value}
MIN: ${document.getElementById("min").value}
COMPANY NAME: ${document.getElementById("company").value}
EMAIL ADDRESS: ${document.getElementById("email").value}
THREAD CASE NUMBER: ${document.getElementById("thread").value}
DATE & TIME EMAIL RECEIVED: ${document.getElementById("datetime").value}
ACTION TAKEN: ${document.getElementById("action").value}
WOCAS: ${document.getElementById("wocas").value}`;

  document.getElementById("output").textContent = output;

  generatedText = output;
}

/* =========================
   COPY
========================= */
function copyDoc() {
  const output = document.getElementById("output").textContent;
  if (!output) return;

  navigator.clipboard.writeText(output);
}

/* =========================
   DOWNLOAD
========================= */
function downloadTxt() {
  const output = document.getElementById("output").textContent;
  if (!output) return;

  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `AutoDoc_${Date.now()}.txt`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/* =========================
   RESET (FIXED)
========================= */
function resetForm() {

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
  });

  document.getElementById("output").textContent = "";
  generatedText = "";

  localStorage.removeItem("auto_docs");
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  initAutoSave();
});
