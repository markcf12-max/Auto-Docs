function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx",
  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx",
  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx",
  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx",
  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx"
};

/* =========================
   VOC UPDATE
========================= */
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");

  voc.innerHTML = "";

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select Connectivity Type</option>
      <option value="VOICE CONNECTIVITY">VOICE CONNECTIVITY</option>
      <option value="SMS CONNECTIVITY">SMS CONNECTIVITY</option>
      <option value="DATA CONNECTIVITY">DATA CONNECTIVITY</option>
      <option value="ROAMING CONNECTIVITY">ROAMING CONNECTIVITY</option>
      <option value="COVERAGE CONNECTIVITY">COVERAGE CONNECTIVITY</option>
    `;
  } else {
    voc.innerHTML = `
      <option value="">Select</option>
      <option value="Positive">Positive</option>
      <option value="Neutral">Neutral</option>
      <option value="Negative">Negative</option>
    `;
  }

  voc.value = "";
  updateSuggestions();
}

/* =========================
   OUTPUT
========================= */
function updateOutput() {
  const output =
`CASE: ${$("case").value}
CONCERN TYPE: ${$("concernType").value}
VOC: ${$("voc").value}

DETAILS:
${$("details").value}

NAME: ${$("name").value}
MIN: ${$("min").value}
COMPANY: ${$("company").value}
EMAIL: ${$("email").value}
THREAD: ${$("thread").value}
DATE/TIME: ${$("datetime").value}

ACTION:
${$("action").value}

WOCAS:
${$("wocas").value}`;

  $("output").textContent = output;
}

/* =========================
   SUGGESTIONS
========================= */
function updateSuggestions() {
  const concern = $("concernType").value;
  const voc = $("voc").value;

  if (concern === "Technical") {
    if (!voc) {
      $("suggestions").textContent = "Select Connectivity Type";
      return;
    }

    const link = TECH_LINKS[voc];

    if (!link) {
      $("suggestions").textContent = "No guide available";
      return;
    }

    $("suggestions").innerHTML = `
      <strong>${voc}</strong>
      <a href="${link}" target="_blank">Open Procedure Guide</a>
    `;
    return;
  }

  let list = [];

  if (concern === "Inquiry") list.push("Check account details");
  if (concern === "Complaint") list.push("Escalate issue");
  if (concern === "Aftersales") list.push("Validate transaction");
  if (concern === "Other") list.push("Review manually");

  if (voc === "Negative") list.push("Apologize & escalate");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard processing");

  $("suggestions").innerHTML = list.length
    ? list.join("<br>")
    : "Select Concern & VOC";
}

/* =========================
   SAVE / LOAD
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
    if ($(id)) $(id).value = saved[id];
  });
}

/* =========================
   HANDLER
========================= */
function handleInput() {
  saveData();
  updateOutput();
  updateSuggestions();
}

/* =========================
   COPY
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent);
  alert("Copied!");
}

/* =========================
   DOWNLOAD
========================= */
function downloadTxt() {
  const blob = new Blob([$("output").textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "auto-docs.txt";
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
  updateVocOptions();
  updateOutput();
  updateSuggestions();

  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", handleInput);
    el.addEventListener("change", () => {
      if (el.id === "concernType") updateVocOptions();
      handleInput();
    });
  });

});
