function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v5";

/* =========================
   TECH DATA
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/VOICE.pdf",
  "SMS CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/SMS.pdf",
  "DATA CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/DATA.pdf",
  "ROAMING CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/ROAMING.pdf",
  "COVERAGE CONNECTIVITY": "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/COVERAGE.pdf"
};

const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": ["Check voice provisioning", "Validate account", "Run diagnostics"],
  "SMS CONNECTIVITY": ["Check SMS gateway", "Validate provisioning", "Test messaging"],
  "DATA CONNECTIVITY": ["Check APN", "Validate data service", "Test connection"],
  "ROAMING CONNECTIVITY": ["Verify roaming activation", "Check partner network", "Validate SIM"],
  "COVERAGE CONNECTIVITY": ["Check coverage map", "Validate signal", "Confirm location issue"]
};

/* =========================
   AFTERSALES DATA
========================= */
const AFTERSALES = {
  ACCOUNT: ["Verify ownership", "Check account status", "Validate request"],
  DEVICE: ["Check device status", "Verify warranty", "Process eligibility"],
  PLAN: ["Check plan", "Validate upgrade/downgrade", "Confirm billing impact"],
  BILLING: ["Review billing", "Check discrepancies", "Resolve issue"],
  BULK: ["Verify bulk request", "Validate scope", "Process batch"],
  SPECIAL: ["Review manually", "Check policy", "Escalate if needed"]
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
   VOC DROPDOWN FIX (IMPORTANT)
========================= */
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");

  const current = voc.value;

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select Technical Type</option>
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
      <option>DEVICE</option>
      <option>PLAN</option>
      <option>BILLING</option>
      <option>BULK</option>
      <option>ACCOUNT</option>
      <option>SPECIAL</option>
    `;
  }

  else if (concern === "Inquiry") {
    voc.innerHTML = `
      <option value="">Select Inquiry Type</option>
      <option>APP RELATED</option>
      <option>ACTIVATION</option>
      <option>BALANCE</option>
      <option>GENERAL</option>
    `;
  }

  else {
    voc.innerHTML = `<option value="">Select VOC</option>`;
  }

  voc.value = current || "";
}

/* =========================
   OUTPUT (LIVE)
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
   SUGGESTIONS ENGINE
========================= */
function updateSuggestions() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  let list = [];

  if (concern === "Technical") {
    const steps = TECH_PROCEDURES[voc] || [];
    const link = TECH_LINKS[voc] || "";

    $("suggestions").innerHTML =
      `<strong>${voc || "Select Technical Type"}</strong><br><br>` +
      steps.map(s => "• " + s).join("<br>") +
      (link ? `<br><br><a href="${link}" target="_blank">Open Guide</a>` : "");

    return;
  }

  if (concern === "Aftersales") {
    const category = getAftersalesCategory(voc);
    const steps = AFTERSALES[category] || [];

    $("suggestions").innerHTML =
      `<strong>${voc || "Select Aftersales Type"}</strong><br><br>` +
      steps.map(s => "• " + s).join("<br>");

    return;
  }

  if (concern === "Inquiry") {
    const INQUIRY = {
      "APP RELATED": ["Check app issue", "Verify login", "Escalate if needed"],
      "ACTIVATION": ["Validate activation", "Check provisioning"],
      "BALANCE": ["Check balance records", "Verify billing sync"],
      "GENERAL": ["Review inquiry", "Provide standard response"]
    };

    list = INQUIRY[voc] || ["Review inquiry manually"];
  }

  if (concern === "Complaint") list = ["Acknowledge issue", "Investigate", "Escalate"];
  if (concern === "Other") list = ["Review manually"];

  if (voc === "Negative") list.push("⚠ Escalate + Apologize");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard handling");

  $("suggestions").innerHTML = list.join("<br>");
}

/* =========================
   EVENTS (FIXED VOC ISSUE HERE)
========================= */
function initEvents() {

  document.querySelectorAll("input, textarea, select").forEach(el => {

    el.addEventListener("input", () => {
      saveData();
      updateOutput();
    });

    el.addEventListener("change", () => {

      saveData();

      if (el.id === "concernType") {
        updateVocOptions();   // ✅ FIXED VOC ISSUE
        $("voc").value = "";
      }

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
  updateVocOptions();   // ✅ IMPORTANT
  initEvents();
  updateOutput();
  updateSuggestions();
});

/* EXPORT */
window.copyDoc = copyDoc;
window.downloadTxt = downloadTxt;
window.resetForm = resetForm;
window.updateSuggestions = updateSuggestions;
