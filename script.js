function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FTECH360%5FSPS%5FGUIDE%5FVOICE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE/",
  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FTECH360%5FSPS%5FGUIDE%5FSMS%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE/",
  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FDATA%5FCONNECTIVITY%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE/",
  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FTECH360%5FSPS%5FGUIDE%5FROAMING%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE/",
  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FTECH360%5FSPS%5FGUIDE%5FCOVERAGE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE/"
};

/* =========================
   OUTPUT (LIVE)
========================= */
function updateOutput() {
  $("output").textContent = `
CASE: ${$("case").value}
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
${$("wocas").value}
`.trim();
}

/* =========================
   VOC SWITCH (FIXED)
========================= */
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");

  const previous = voc.value;

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

  // always reset properly (prevents stale mismatch bug)
  voc.value = "";

  updateSuggestions();
  updateOutput();
}

/* =========================
   SUGGESTIONS (FIXED)
========================= */
function updateSuggestions() {
  const concern = $("concernType").value;
  const voc = $("voc").value;

  if (!concern) {
    $("suggestions").textContent = "Select Concern & VOC";
    return;
  }

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

const label = voc
  .toLowerCase()
  .replace(" connectivity", "")
  .replace(/\b\w/g, c => c.toUpperCase());

$("suggestions").innerHTML = `
  <strong>${voc}</strong>
  <br><br>
  <a href="${link}" target="_blank">
    Open ${label} Connectivity
  </a>
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

  $("suggestions").innerHTML = list.join("<br>");
}

/* =========================
   SAVE
========================= */
function saveData() {
  const data = {};
  document.querySelectorAll("input, textarea, select").forEach(el => {
    data[el.id] = el.value;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =========================
   LOAD
========================= */
function loadData() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  Object.keys(saved).forEach(id => {
    const el = $(id);
    if (el) el.value = saved[id];
  });
}

/* =========================
   MASTER UPDATE
========================= */
function handleInput() {
  saveData();
  updateOutput();
  updateSuggestions();
}

/* =========================
   COPY (FIXED - NO ALERT)
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent);

  // small non-blocking feedback instead of alert
  const btn = event.target;
  const original = btn.textContent;

  btn.textContent = "Copied!";
  setTimeout(() => btn.textContent = original, 1200);
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
   INIT (FIXED PROPERLY)
========================= */
window.addEventListener("DOMContentLoaded", () => {

  loadData();

  updateOutput();
  updateSuggestions();

  const fields = document.querySelectorAll("input, textarea, select");

  fields.forEach(el => {

    el.addEventListener("input", handleInput);

    el.addEventListener("change", () => {

      if (el.id === "concernType") {
        updateVocOptions();
      }

      handleInput();
    });

  });

});
