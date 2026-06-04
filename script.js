function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FTECH360%5FSPS%5FGUIDE%5FVOICE%2Epdf",
  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FTECH360%5FSPS%5FGUIDE%5FSMS%2Epdf",
  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING%5FSPACE%5FDATA%5FCONNECTIVITY%2Epdf",
  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx",
  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx"
};

/* =========================
   TECH PROCEDURES
========================= */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [
    "Check and validate account.",
    "Verify voice services.",
    "Check provisioning issues.",
    "Proceed with SR if needed."
  ],
  "SMS CONNECTIVITY": [
    "Check SMS services.",
    "Verify provisioning.",
    "Proceed with troubleshooting."
  ],
  "DATA CONNECTIVITY": [
    "Check data services.",
    "Verify network status.",
    "Escalate if needed."
  ],
  "ROAMING CONNECTIVITY": [
    "Check roaming activation.",
    "Verify eligibility.",
    "Provide roaming support channel."
  ],
  "COVERAGE CONNECTIVITY": [
    "Check coverage status.",
    "Validate service area.",
    "Escalate if needed."
  ]
};

/* =========================
   AFTERSALES PROCEDURES
========================= */
const AFTERSALES_PROCEDURES = {
  ACCOUNT: ["Validate ownership", "Check account status", "Proceed accordingly"],
  DEVICE: ["Check device status", "Verify warranty", "Process request"],
  PLAN: ["Check plan eligibility", "Validate contract", "Apply changes"],
  BILLING: ["Review billing", "Check discrepancies", "Escalate if needed"],
  BULK: ["Validate bulk request", "Check scope", "Execute process"],
  SPECIAL: ["Follow SOP", "Coordinate team", "Ensure compliance"]
};

/* =========================
   AFTERSALES MAPPING
========================= */
function getAftersalesCategory(voc) {
  const v = (voc || "").toUpperCase();

  if (v.includes("DEVICE") || v.includes("SIM")) return "DEVICE";
  if (v.includes("PLAN") || v.includes("UPGRADE")) return "PLAN";
  if (v.includes("BILL")) return "BILLING";
  if (v.includes("BULK")) return "BULK";
  if (v.includes("OWNERSHIP")) return "ACCOUNT";

  return "SPECIAL";
}

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
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");
  const current = voc.value;

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select Connectivity</option>
      <option>VOICE CONNECTIVITY</option>
      <option>SMS CONNECTIVITY</option>
      <option>DATA CONNECTIVITY</option>
      <option>ROAMING CONNECTIVITY</option>
      <option>COVERAGE CONNECTIVITY</option>
    `;
  }

  else if (concern === "Aftersales") {
    voc.innerHTML = `
      <option value="">Select Aftersales Type</option>
      <option>DEVICE UNLOCKING</option>
      <option>PLAN UPGRADE</option>
      <option>BILLING ISSUE</option>
      <option>BULK PROCESS</option>
      <option>CHANGE OWNERSHIP</option>
    `;
  }

  else {
    voc.innerHTML = `
      <option value="">Select VOC</option>
      <option>Positive</option>
      <option>Neutral</option>
      <option>Negative</option>
    `;
  }

  voc.value = current;
}

/* =========================
   SUGGESTIONS
========================= */
function updateSuggestions() {
  const concern = $("concernType").value;
  const voc = $("voc").value;

  let list = [];

  /* TECH */
  if (concern === "Technical") {
    const steps = TECH_PROCEDURES[voc] || [];
    const link = TECH_LINKS[voc] || "#";

    list = [
      `CONNECTIVITY: ${voc}`,
      ...steps,
      "",
      `Open Guide: ${link}`
    ];
  }

  /* AFTERSALES */
  else if (concern === "Aftersales") {
    const cat = getAftersalesCategory(voc);
    const steps = AFTERSALES_PROCEDURES[cat] || [];

    list = [`AFTERSALES: ${voc}`, ...steps];
  }

  /* INQUIRY */
  else if (concern === "Inquiry") {
    list = [
      "Check account details",
      "Verify request",
      "Provide resolution or escalate"
    ];
  }

  /* DEFAULT VOC */
  if (voc === "Negative") list.push("Apologize & escalate");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard handling");

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
   EVENTS
========================= */
function init() {
  loadData();
  updateVocOptions();
  updateOutput();
  updateSuggestions();

  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => {
      saveData();
      updateOutput();
      updateSuggestions();
    });

    el.addEventListener("change", () => {
      if (el.id === "concernType") updateVocOptions();
      saveData();
      updateOutput();
      updateSuggestions();
    });
  });
}

window.addEventListener("DOMContentLoaded", init);
