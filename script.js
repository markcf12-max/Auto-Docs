
function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_VOICE.pdf",
  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_SMS.pdf",
  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_DATA_CONNECTIVITY.pdf",
  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_ROAMING.pdf",
  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_COVERAGE.pdf"
};

/* =========================
   TECH PROCEDURES
========================= */
const TECH_PROCEDURES = {

  "VOICE CONNECTIVITY": [
    "Check and validate account.",
    "Verify that all voice services are active.",
    "Check for account misalignment or provisioning issues.",
    "If all services are active and no misalignment is found, proceed with gathering details for SR Ticket Creation.",
    "If required details are not available, request the information from the customer."
  ],

  "SMS CONNECTIVITY": [
    "Check and validate account.",
    "Verify that all SMS services are active.",
    "Check for account misalignment or provisioning issues.",
    "If all services are active and no misalignment is found, proceed with gathering details for SR Ticket Creation.",
    "If required details are not available, request the information from the customer."
  ],

  "DATA CONNECTIVITY": [
    "Check and validate account.",
    "Verify that all data services are active.",
    "Check for account misalignment or provisioning issues.",
    "If all services are active and no misalignment is found, proceed with gathering details for SR Ticket Creation.",
    "If required details are not available, request the information from the customer."
  ],

  "ROAMING CONNECTIVITY": [
    "Check and validate account.",
    "Verify roaming activation and eligibility.",
    "Check for account misalignment or provisioning issues.",
    "If all services are active and no misalignment is found, proceed with gathering details for SR Ticket Creation.",
    "If required details are not available, request the information from the customer.",
    "Provide One Roaming channel.",
    "Reminder: roaming website gigaroamin.smart.com.ph"
  ],

  "COVERAGE CONNECTIVITY": [
    "Check and validate account.",
    "Verify that all services are active.",
    "Check for account misalignment or provisioning issues.",
    "If all services are active and no misalignment is found, proceed with gathering details for SR Ticket Creation.",
    "If required details are not available, request the information from the customer."
  ]
};

/* =========================
   LIVE OUTPUT
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
   VOC SWITCH
========================= */
function updateVocOptions(keepValue = false) {

  const concern = $("concernType").value;
  const voc = $("voc");

  const currentValue = voc.value;

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

  voc.value = keepValue ? currentValue : "";

  updateSuggestions();
  updateOutput();
}

/* =========================
   SUGGESTIONS
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
    const procedures = TECH_PROCEDURES[voc] || [];

    const label = voc.replace(" CONNECTIVITY", "");

    $("suggestions").innerHTML = `
      <strong>${voc}</strong>

      <div style="margin-top:10px; line-height:1.6;">
        ${procedures.map(p => "• " + p).join("<br>")}
      </div>

      <br>

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
    const el = $(id);
    if (el) el.value = saved[id];
  });
}

/* =========================
   INPUT HANDLER
========================= */
function handleInput() {
  saveData();
  updateOutput();
  updateSuggestions();
}

/* =========================
   COPY
========================= */
function copyDoc(button) {
  navigator.clipboard.writeText($("output").textContent);

  const original = button.textContent;
  button.textContent = "Copied!";

  setTimeout(() => button.textContent = original, 1200);
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

  updateVocOptions(true);

  updateOutput();
  updateSuggestions();

  document.querySelectorAll("input, textarea, select").forEach(el => {

    el.addEventListener("input", handleInput);

    el.addEventListener("change", () => {

      if (el.id === "concernType") {
        updateVocOptions();
      }

      handleInput();
    });

  });

});
