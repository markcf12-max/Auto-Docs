function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v3";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_VOICE.pdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE",

  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_SMS.pdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE",

  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_DATA_CONNECTIVITY.pdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE",

  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_ROAMING.pdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE",

  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_COVERAGE.pdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE"
};

/* =========================
   SAVE
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
   LOAD
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

ACTION TAKEN:
${$("action").value}

WOCAS:
${$("wocas").value}`.trim();

  $("output").textContent = output;
}

/* =========================
   SUGGESTIONS
========================= */
function updateSuggestions() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  let list = [];

  /* =========================
     TECHNICAL
  ========================= */
  if (concern === "Technical") {

    const techItems = Object.keys(TECH_LINKS);

    $("suggestions").innerHTML = techItems
      .map(item => `• <a href="${TECH_LINKS[item]}" target="_blank">${item}</a>`)
      .join("");

    return;
  }

  /* =========================
     OTHER CONCERNS
  ========================= */
  if (concern === "Inquiry") {
    list.push({ text: "Check account details", link: "https://example.com" });
    list.push({ text: "Verify request", link: "https://example.com" });
  }

  if (concern === "Complaint") {
    list.push({ text: "Acknowledge issue", link: "https://example.com" });
    list.push({ text: "Escalate case", link: "https://example.com" });
  }

  if (concern === "Aftersales") {
    list.push({ text: "Validate transaction", link: "https://example.com" });
  }

  if (concern === "Other") {
    list.push({ text: "Review manually", link: "https://example.com" });
  }

  /* =========================
     VOC
  ========================= */
  if (voc === "Negative") {
    list.push({ text: "Apologize and escalate", link: "https://example.com" });
  }

  if (voc === "Positive") {
    list.push({ text: "Confirm resolution", link: "https://example.com" });
  }

  if (voc === "Neutral") {
    list.push({ text: "Standard processing", link: "https://example.com" });
  }

  if (!list.length) {
    $("suggestions").textContent = "Select Concern & VOC";
    return;
  }

  $("suggestions").innerHTML = list
    .map(i => `• <a href="${i.link}" target="_blank">${i.text}</a>`)
    .join("<br>");
}

/* =========================
   INPUT HANDLER
========================= */
function handleInput() {
  saveData();
  updateOutput();
}

/* =========================
   COPY
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent);
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
      updateSuggestions();
    });
  });
});
