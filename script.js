function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v3";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_VOICE.pdf",

  "SMS CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_SMS.pdf",

  "DATA CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_DATA_CONNECTIVITY.pdf",

  "ROAMING CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_ROAMING.pdf",

  "COVERAGE CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_COVERAGE.pdf"
};

/* =========================
   VOC SWITCHING
========================= */
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");

  voc.innerHTML = "";

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select</option>
      <option>VOICE CONNECTIVITY</option>
      <option>SMS CONNECTIVITY</option>
      <option>DATA CONNECTIVITY</option>
      <option>ROAMING CONNECTIVITY</option>
      <option>COVERAGE CONNECTIVITY</option>
    `;
  } else {
    voc.innerHTML = `
      <option value="">Select</option>
      <option>Positive</option>
      <option>Neutral</option>
      <option>Negative</option>
    `;
  }

  $("voc").value = "";
}

/* =========================
   SAVE / LOAD
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

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const data = JSON.parse(saved);

  Object.keys(data).forEach(k => {
    const el = $(k);
    if (el) el.value = data[k];
  });
}

/* =========================
   OUTPUT
========================= */
function updateOutput() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  const output =
`CASE: ${$("case").value}
CONCERN TYPE: ${concern}
VOC: ${formatVoc(concern, voc)}

DETAILS:
${$("details").value}

NAME: ${$("name").value}
MIN: ${$("min").value}
COMPANY NAME: ${$("company").value}
EMAIL ADDRESS: ${$("email").value}
THREAD NUMBER: ${$("thread").value}
DATE/TIME: ${$("datetime").value}

ACTION:
${$("action").value}

WOCAS:
${$("wocas").value}`.trim();

  $("output").textContent = output;
}

/* =========================
   VOC FORMAT FIX
========================= */
function formatVoc(concern, voc) {
  if (!voc) return "Not selected";
  return voc;
}

/* =========================
   SUGGESTIONS
========================= */
function updateSuggestions() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  /* =========================
     TECHNICAL MODE (FIXED)
  ========================= */
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

    $("suggestions").innerHTML =
      `• <a href="${link}" target="_blank">${voc}</a>`;

    return;
  }

  /* =========================
     NORMAL MODE
  ========================= */
  let list = [];

  if (concern === "Inquiry") list.push("Check account details");
  if (concern === "Complaint") list.push("Escalate issue");
  if (concern === "Aftersales") list.push("Validate transaction");
  if (concern === "Other") list.push("Review manually");

  if (voc === "Negative") list.push("Apologize & escalate");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard processing");

  $("suggestions").innerHTML = list.join("<br>");
}

/* =========================
   INPUT HANDLER
========================= */
function handleInput() {
  saveData();
  updateOutput();
}

/* =========================
   COPY / DOWNLOAD
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent);
}

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

  [
    "case","concernType","voc","details","name","min",
    "company","email","thread","datetime","action","wocas"
  ].forEach(id => $(id).value = "");

  $("output").textContent = "";
  $("suggestions").textContent = "Select Concern & VOC";

  localStorage.removeItem(STORAGE_KEY);
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

  loadData();

  if (!$("datetime").value) {
    $("datetime").value = new Date().toLocaleString();
  }

  updateVocOptions();
  updateOutput();
  updateSuggestions();

  const fields = [
    "case","concernType","voc","details","name","min",
    "company","email","thread","datetime","action","wocas"
  ];

  fields.forEach(id => {
    const el = $(id);

    el.addEventListener("input", handleInput);

    el.addEventListener("change", () => {
      handleInput();
      updateVocOptions();
      updateSuggestions();
    });
  });
});
