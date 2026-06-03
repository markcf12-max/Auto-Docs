let generatedText = "";

/* =========================
   FIELD LIST
========================= */
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
    if (!el) return;
    el.value = data[id] || "";
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
   GENERATE DOC
========================= */
window.generateDoc = function () {

  const get = (id) =>
    document.getElementById(id)?.value.trim() || "";

  const caseNum = get("case");

  if (!caseNum) {
    alert("Please enter CASE number");
    return;
  }

  generatedText = `
CASE: ${caseNum}
DETAILS OF THE CONCERN: ${get("details")}
NAME: ${get("name")}
MIN: ${get("min")}
COMPANY NAME: ${get("company")}
EMAIL ADDRESS: ${get("email")}
THREAD CASE NUMBER: ${get("thread")}
DATE & TIME EMAIL RECEIVED: ${get("datetime")}
ACTION TAKEN: ${get("action")}
WOCAS: ${get("wocas")}
`.trim();

  document.getElementById("output").textContent = generatedText;
};

/* =========================
   COPY
========================= */
window.copyDoc = function () {
  const output = document.getElementById("output").textContent;
  if (!output) return;

  navigator.clipboard.writeText(output);
};

/* =========================
   DOWNLOAD
========================= */
window.downloadTxt = function () {
  const output = document.getElementById("output").textContent;
  if (!output) return;

  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "AutoDoc.txt";
  a.click();

  URL.revokeObjectURL(url);
};

/* =========================
   RESET
========================= */
window.resetForm = function () {

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById("output").textContent = "";
  localStorage.removeItem("auto_docs");

  generatedText = "";
};

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  initAutoSave();
});
