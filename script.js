function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v5";

/* =========================
   DATA SETS (TECH)
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/06JUNE/VOICE.pdf",
  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/06JUNE/SMS.pdf",
  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/06JUNE/DATA.pdf",
  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/06JUNE/ROAMING.pdf",
  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/06JUNE/COVERAGE.pdf"
};

const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [
    "Check voice provisioning status",
    "Validate account configuration",
    "Run network diagnostics",
    "Confirm service activation"
  ],
  "SMS CONNECTIVITY": [
    "Check SMS gateway status",
    "Validate messaging provisioning",
    "Test send/receive capability",
    "Escalate if system issue persists"
  ],
  "DATA CONNECTIVITY": [
    "Check APN settings",
    "Validate data provisioning",
    "Test connectivity",
    "Confirm network registration"
  ],
  "ROAMING CONNECTIVITY": [
    "Verify roaming activation",
    "Check partner network availability",
    "Validate SIM eligibility",
    "Provide roaming guidelines"
  ],
  "COVERAGE CONNECTIVITY": [
    "Check coverage map",
    "Validate network signal",
    "Confirm location issue",
    "Escalate if outage detected"
  ]
};

/* =========================
   AFTERSALES PROCEDURES
========================= */
const AFTERSALES = {
  ACCOUNT: ["Verify ownership", "Check account status", "Validate request", "Escalate if needed"],
  DEVICE: ["Check device status", "Verify warranty", "Validate eligibility", "Proceed with action"],
  PLAN: ["Check current plan", "Validate eligibility", "Process change", "Confirm billing impact"],
  BILLING: ["Review billing details", "Check discrepancies", "Validate charges", "Resolve or escalate"],
  BULK: ["Verify bulk request", "Validate scope", "Process batch", "Confirm completion"],
  SPECIAL: ["Review manually", "Check policy", "Coordinate support", "Escalate if needed"]
};

function getAftersalesCategory(voc) {
  const v = (voc || "").toUpperCase();

  if (v.includes("DEVICE") || v.includes("SIM")) return "DEVICE";
  if (v.includes("PLAN") || v.includes("UPGRADE") || v.includes("DOWNGRADE")) return "PLAN";
  if (v.includes("BILL")) return "BILLING";
  if (v.includes("BULK")) return "BULK";
  if (v.includes("ACCOUNT")) return "ACCOUNT";

  return "SPECIAL";
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
   SUGGESTIONS ENGINE (FULL UPGRADED)
========================= */
function updateSuggestions() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  let list = [];

  /* ================= TECH ================= */
  if (concern === "Technical") {

    const steps = TECH_PROCEDURES[voc] || [];
    const link = TECH_LINKS[voc] || "";

    $("suggestions").innerHTML = `
      <strong>${voc || "Select Technical Type"}</strong><br><br>
      ${steps.map(s => "• " + s).join("<br>")}<br><br>
      ${link ? `<a href="${link}" target="_blank">Open Reference Guide</a>` : ""}
    `;
    return;
  }

  /* ================= AFTERSALES ================= */
  if (concern === "Aftersales") {

    const category = getAftersalesCategory(voc);
    const steps = AFTERSALES[category] || [];

    $("suggestions").innerHTML = `
      <strong>${voc || "Select Aftersales Type"}</strong><br><br>
      ${steps.map(s => "• " + s).join("<br>")}
    `;
    return;
  }

  /* ================= INQUIRY ================= */
  if (concern === "Inquiry") {

    const INQUIRY = {
      "APP RELATED": ["Check app status", "Verify login access"],
      "ACTIVATION": ["Validate activation status", "Check provisioning"],
      "BALANCE": ["Verify balance records", "Check billing sync"],
      "GENERAL": ["Review inquiry", "Validate account", "Respond accurately"]
    };

    const steps = INQUIRY[voc] || ["Review inquiry manually"];

    list = steps;
  }

  /* ================= DEFAULT ================= */
  if (concern === "Complaint") list = ["Acknowledge issue", "Investigate", "Escalate if needed"];
  if (concern === "Other") list = ["Review manually"];

  if (voc === "Negative") list.push("⚠ Escalate + Apologize");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard handling");

  $("suggestions").innerHTML = list.join("<br>");
}

/* =========================
   EVENTS
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
   COPY / DOWNLOAD / RESET
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent || "");
}

function downloadTxt() {
  const blob = new Blob([$("output").textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "AutoDoc.txt";
  a.click();

  URL.revokeObjectURL(url);
}

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

/* EXPORTS */
window.copyDoc = copyDoc;
window.downloadTxt = downloadTxt;
window.resetForm = resetForm;
window.updateSuggestions = updateSuggestions;
