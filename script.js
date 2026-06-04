function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   SAVE + LOAD
========================= */
function saveData() {
  const data = {};

  document.querySelectorAll("input, textarea, select").forEach(el => {
    data[el.id] = el.value;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  Object.keys(saved).forEach(id => {
    const el = $(id);
    if (el) el.value = saved[id];
  });
}

/* =========================
   LIVE OUTPUT
========================= */
function updateOutput() {
  const caseVal = $("case").value.trim();

  $("output").textContent = caseVal
    ? `CASE: ${caseVal}

CONCERN TYPE: ${$("concernType").value}
VOC: ${$("voc").value}

DETAILS:
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
${$("wocas").value}`
    : "Start filling out the form...";
}

/* =========================
   SUGGESTIONS (MINIMAL FIXED)
========================= */
function updateSuggestions() {
  const concern = $("concernType").value;
  const voc = $("voc").value;

  let list = [];

  if (concern === "Inquiry") {
    list = [
      "Check account details",
      "Provide standard response",
      "Verify request"
    ];
  }

  if (concern === "Complaint") {
    list = [
      "Acknowledge issue",
      "Investigate logs",
      "Escalate if needed"
    ];
  }

  if (concern === "Aftersales") {
    list = [
      "Validate transaction",
      "Check eligibility",
      "Coordinate support"
    ];
  }

  if (concern === "Other") {
    list = ["Review manually"];
  }

  if (voc === "Negative") list.push("⚠ Escalate + Apologize");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard processing");

  $("suggestions").textContent =
    list.length ? list.join("\n") : "Select Concern & VOC";
}

/* =========================
   AUTO EVENTS (IMPORTANT FIX)
========================= */
function initEvents() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => {
      saveData();
      updateOutput();
    });

    el.addEventListener("change", () => {
      saveData();
      updateOutput();
      updateSuggestions();
    });
  });
}

/* =========================
   COPY
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent || "");
}

/* =========================
   DOWNLOAD
========================= */
function downloadTxt() {
  const text = $("output").textContent;
  const blob = new Blob([text], { type: "text/plain" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `AutoDoc_${Date.now()}.txt`;
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
   RESET
========================= */
function resetForm() {
  document.querySelectorAll("input, textarea, select").forEach(el => el.value = "");

  localStorage.removeItem(STORAGE_KEY);

  updateOutput();
  updateSuggestions();
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  initEvents();
  updateOutput();
  updateSuggestions();
});

/* expose buttons */
window.copyDoc = copyDoc;
window.downloadTxt = downloadTxt;
window.resetForm = resetForm;
window.updateSuggestions = updateSuggestions;
