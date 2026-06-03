/* =========================
   HELPERS
========================= */
function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v3";

/* =========================
   SAVE INPUTS
========================= */
function saveData() {
  const data = {
    case: $("case").value,
    concernType: $("concernType").value,
    voc: $("voc").value,
    details: $("details").value,
    name: $("name").value,
    min: $("min").value,
    company: $("company").value,
    email: $("email").value,
    thread: $("thread").value,
    datetime: $("datetime").value,
    action: $("action").value,
    wocas: $("wocas").value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =========================
   LOAD INPUTS
========================= */
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const data = JSON.parse(saved);

  Object.keys(data).forEach(key => {
    const el = $(key);
    if (el) el.value = data[key];
  });
}

/* =========================
   BUILD OUTPUT (LIVE)
========================= */
function updateOutput() {
  const output =
`CASE: ${$("case").value}
CONCERN TYPE: ${$("concernType").value}
VOC: ${$("voc").value}

DETAILS OF THE CONCERN:
${$("details").value}

NAME: ${$("name").value}
MIN: ${$("min").value}
COMPANY NAME: ${$("company").value}
EMAIL ADDRESS: ${$("email").value}
THREAD CASE NUMBER: ${$("thread").value}
DATE & TIME EMAIL RECEIVED: ${$("datetime").value}

ACTION TAKEN:
${$("action").value}

WOCAS:
${$("wocas").value}`.trim();

  $("output").textContent = output;
}

/* =========================
   SUGGESTIONS ENGINE
========================= */
function updateSuggestions() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  let list = [];

  if (concern === "Inquiry") {
    list.push("• Check account details");
    list.push("• Provide standard information response");
    list.push("• Verify customer request");
  }

  if (concern === "Complaint") {
    list.push("• Acknowledge issue immediately");
    list.push("• Investigate system logs / records");
    list.push("• Escalate if SLA breach risk detected");
  }

  if (concern === "Aftersales") {
    list.push("• Validate transaction history");
    list.push("• Check eligibility / warranty");
    list.push("• Coordinate with support team");
  }

  if (concern === "Other") {
    list.push("• Review case manually");
    list.push("• Classify properly before processing");
  }

  if (voc === "Negative") {
    list.push("");
    list.push("⚠ PRIORITY HANDLING");
    list.push("• Apologize and acknowledge frustration");
    list.push("• Escalate if service impact confirmed");
  }

  if (voc === "Positive") {
    list.push("");
    list.push("• Maintain positive engagement tone");
    list.push("• Confirm resolution and close case");
  }

  if (voc === "Neutral") {
    list.push("");
    list.push("• Standard processing applies");
  }

  $("suggestions").textContent =
    list.length ? list.join("\n") : "Select Concern & VOC";
}

/* =========================
   LIVE SYSTEM CORE
========================= */
function handleInput() {
  saveData();
  updateOutput();
}

/* =========================
   COPY OUTPUT
========================= */
function copyDoc() {
  const text = $("output").textContent;

  navigator.clipboard.writeText(text)
    .then(() => alert("Copied to clipboard"))
    .catch(err => console.error("Copy failed:", err));
}

/* =========================
   DOWNLOAD OUTPUT
========================= */
function downloadTxt() {
  const text = $("output").textContent;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "auto-docs.txt";
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
   RESET FORM
========================= */
function resetForm() {

  [
    "case","concernType","voc","details","name","min",
    "company","email","thread","datetime","action","wocas"
  ].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });

  $("output").textContent = "";
  $("suggestions").textContent = "Select Concern & VOC";

  localStorage.removeItem(STORAGE_KEY);
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

  loadData();

  // auto-fill date/time if empty
  if (!$("datetime").value) {
    $("datetime").value = new Date().toLocaleString();
  }

  updateOutput();
  updateSuggestions();

  const fields = [
    "case","concernType","voc","details","name","min",
    "company","email","thread","datetime","action","wocas"
  ];

  fields.forEach(id => {
    const el = $(id);
    if (!el) return;

    el.addEventListener("input", handleInput);
    el.addEventListener("change", () => {
      handleInput();
      updateSuggestions();
    });
  });
});
