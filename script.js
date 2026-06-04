function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   DATA
========================= */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": ["Check voice service", "Verify provisioning", "Escalate if needed"],
  "SMS CONNECTIVITY": ["Check SMS service", "Validate routing", "Escalate if needed"],
  "DATA CONNECTIVITY": ["Check data service", "Verify network", "Escalate if needed"],
  "ROAMING CONNECTIVITY": ["Check roaming status", "Verify eligibility", "Provide roaming support"],
  "COVERAGE CONNECTIVITY": ["Check coverage", "Validate area", "Escalate if needed"]
};

const TECH_LINKS = {
  "VOICE CONNECTIVITY": "#",
  "SMS CONNECTIVITY": "#",
  "DATA CONNECTIVITY": "#",
  "ROAMING CONNECTIVITY": "#",
  "COVERAGE CONNECTIVITY": "#"
};

const AFTERSALES = {
  ACCOUNT: ["Validate ownership", "Check account status", "Proceed accordingly"],
  DEVICE: ["Check device status", "Verify warranty", "Process request"],
  PLAN: ["Check plan eligibility", "Apply changes", "Confirm billing impact"],
  BILLING: ["Review billing", "Check discrepancy", "Escalate if needed"],
  BULK: ["Validate bulk request", "Execute process"],
  SPECIAL: ["Follow SOP", "Coordinate team"]
};

/* =========================
   HELPERS
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
   OUTPUT
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
   AFTERSALES CATEGORY
========================= */
function getCategory(voc) {
  const v = (voc || "").toUpperCase();

  if (v.includes("DEVICE")) return "DEVICE";
  if (v.includes("PLAN")) return "PLAN";
  if (v.includes("BILL")) return "BILLING";
  if (v.includes("BULK")) return "BULK";
  if (v.includes("ACCOUNT")) return "ACCOUNT";

  return "SPECIAL";
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
      <option value="">Select Type</option>
      <option>DEVICE</option>
      <option>PLAN</option>
      <option>BILLING</option>
      <option>BULK</option>
      <option>ACCOUNT</option>
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

  if (concern === "Technical") {
    const steps = TECH_PROCEDURES[voc] || [];
    list = [`TECH: ${voc}`, ...steps, "", `Guide: ${TECH_LINKS[voc] || ""}`];
  }

  else if (concern === "Aftersales") {
    const cat = getCategory(voc);
    list = [`AFTERSALES: ${voc}`, ...(AFTERSALES[cat] || [])];
  }

  else if (concern === "Inquiry") {
    list = ["Check account", "Verify request", "Provide resolution"];
  }

  if (voc === "Negative") list.push("Apologize & escalate");
  if (voc === "Positive") list.push("Confirm resolution");
  if (voc === "Neutral") list.push("Standard handling");

  $("suggestions").innerHTML = list.join("<br>");
}

/* =========================
   EVENTS
========================= */
function init() {
  loadData();
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

/* =========================
   BUTTON FUNCTIONS (FIXED GLOBAL)
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

  $("output").textContent = "";
  $("suggestions").textContent = "Select Concern & VOC";

  updateVocOptions();
  updateOutput();
  updateSuggestions();
}
