function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v5";

/* =========================
   DATA STORAGE
========================= */
function saveData() {
  const data = {};
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.id) data[el.id] = el.value;
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
   TECH DATA WITH LINKS ✅
========================= */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [
    { text: "Check voice service", link: "https://yourguide-link.com/voice" },
    { text: "Validate account status", link: "https://yourguide-link.com/account" }
  ],
  "SMS CONNECTIVITY": [
    { text: "Check SMS provisioning", link: "https://yourguide-link.com/sms" }
  ],
  "DATA CONNECTIVITY": [
    { text: "Check data session", link: "https://yourguide-link.com/data" }
  ],
  "ROAMING CONNECTIVITY": [
    { text: "Verify roaming status", link: "https://yourguide-link.com/roaming" }
  ],
  "COVERAGE CONNECTIVITY": [
    { text: "Check signal coverage", link: "https://yourguide-link.com/coverage" }
  ]
};

/* =========================
   AFTERSALES
========================= */
const AFTERSALES = {
  ACCOUNT: ["Validate ownership", "Check eligibility"],
  DEVICE: ["Check device status", "Verify warranty"],
  PLAN: ["Validate plan change rules"],
  BILLING: ["Check billing records"],
  SPECIAL: ["Review manually"]
};

function getAftersalesCategory(voc) {
  const v = voc.toUpperCase();
  if (v.includes("OWNERSHIP") || v.includes("ASSIGNEE")) return "ACCOUNT";
  if (v.includes("DEVICE") || v.includes("SIM")) return "DEVICE";
  if (v.includes("PLAN") || v.includes("UPGRADE")) return "PLAN";
  if (v.includes("BILL")) return "BILLING";
  return "SPECIAL";
}

/* =========================
   OUTPUT (LIVE)
========================= */
function updateOutput() {
  if (!$("output")) return;

  const output =
`CASE: ${$("case")?.value || ""}
CONCERN TYPE: ${$("concernType")?.value || ""}
VOC: ${$("voc")?.value || ""}

DETAILS:
${$("details")?.value || ""}

NAME: ${$("name")?.value || ""}
MIN: ${$("min")?.value || ""}
COMPANY: ${$("company")?.value || ""}
EMAIL: ${$("email")?.value || ""}
THREAD: ${$("thread")?.value || ""}
DATE/TIME: ${$("datetime")?.value || ""}

ACTION:
${$("action")?.value || ""}

WOCAS:
${$("wocas")?.value || ""}`;

  $("output").textContent = output;
}

/* =========================
   SUGGESTIONS GENERATOR (WITH LINKS)
========================= */
function updateSuggestions() {
  if (!$("suggestions")) return;

  const concern = $("concernType")?.value;
  const voc = $("voc")?.value;
  let html = "";

  if (concern === "Technical") {
    const procedures = TECH_PROCEDURES[voc] || [];
    html = procedures.length
      ? procedures.map(p => 
          `• ${p.text} ${p.link ? `<a href="${p.link}" target="_blank" style="color: #0066cc; text-decoration: underline;">[Open Guide]</a>` : ""}`
        ).join("<br>")
      : "• Select technical type (VOC)";
  } 
  else if (concern === "Aftersales") {
    const cat = getAftersalesCategory(voc || "");
    const list = AFTERSALES[cat] || [];
    html = list.length ? list.map(i => `• ${i}`).join("<br>") : "• Select Aftersales type";
  } 
  else if (concern === "Inquiry") {
    html = ["Check details", "Verify account", "Respond accordingly"].map(i => `• ${i}`).join("<br>");
  } 
  else if (concern === "Complaint") {
    html = ["Acknowledge issue", "Investigate", "Escalate if needed"].map(i => `• ${i}`).join("<br>");
  } 
  else {
    html = "• Select Concern Type";
  }

  $("suggestions").innerHTML = html;
}

/* =========================
   DYNAMIC VOC DROPDOWN SWITCH
========================= */
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");
  
  // Keep track of what was selected before resetting options
  const previousValue = voc.value;

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select Technical Type</option>
      <option value="VOICE CONNECTIVITY">VOICE CONNECTIVITY</option>
      <option value="SMS CONNECTIVITY">SMS CONNECTIVITY</option>
      <option value="DATA CONNECTIVITY">DATA CONNECTIVITY</option>
      <option value="ROAMING CONNECTIVITY">ROAMING CONNECTIVITY</option>
      <option value="COVERAGE CONNECTIVITY">COVERAGE CONNECTIVITY</option>
    `;
  } 
  else if (concern === "Aftersales") {
    voc.innerHTML = `
      <option value="">Select Aftersales Type</option>
      <option value="INCREASE CREDIT LIMIT">INCREASE CREDIT LIMIT</option>
      <option value="DEVICE UNLOCKING">DEVICE UNLOCKING</option>
      <option value="PLAN UPGRADE">PLAN UPGRADE</option>
      <option value="BILLING ISSUE">BILLING ISSUE</option>
    `;
  } 
  else {
    voc.innerHTML = `
      <option value="">Select Option</option>
      <option value="Positive">Positive</option>
      <option value="Neutral">Neutral</option>
      <option value="Negative">Negative</option>
    `;
  }

  // Restore previous value if it matches the new options set (crucial for localStorage on page reload)
  if (previousValue) {
    voc.value = previousValue;
  }
}

/* =========================
   INITIALIZATION & EVENT BINDING
========================= */
function init() {
  loadData();
  
  // Build dynamic options based on what was saved
  updateVocOptions(); 
  
  // Refresh UI displays
  updateOutput();
  updateSuggestions();

  // Unified Event Listeners for real-time reactivity
  document.querySelectorAll("input, textarea, select").forEach(el => {
    
    // For instant live preview and auto-saving
    el.addEventListener("input", () => {
      saveData();
      updateOutput();
    });

    // Handle structural UI updates when dropdowns change
    el.addEventListener("change", () => {
      if (el.id === "concernType") {
        updateVocOptions();
      }
      saveData();
      updateSuggestions();
      updateOutput();
    });
  });
}

/* =========================
   BUTTON FUNCTIONS
========================= */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent || "");
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

function resetForm() {
  document.querySelectorAll("input, textarea, select").forEach(el => el.value = "");
  localStorage.removeItem(STORAGE_KEY);
  updateVocOptions();
  updateOutput();
  updateSuggestions();
}

/* =========================
   GLOBAL EXPORT & START
========================= */
window.copyDoc = copyDoc;
window.downloadTxt = downloadTxt;
window.resetForm = resetForm;

window.addEventListener("DOMContentLoaded", init);
