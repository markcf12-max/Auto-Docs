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
   TECH DATA WITH LINKS ✅
========================= */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [
    { text: "Check voice service", link: "#" },
    { text: "Validate account", link: "#" }
  ],
  "SMS CONNECTIVITY": [
    { text: "Check SMS provisioning", link: "#" }
  ],
  "DATA CONNECTIVITY": [
    { text: "Check data session", link: "#" }
  ],
  "ROAMING CONNECTIVITY": [
    { text: "Verify roaming status", link: "#" }
  ],
  "COVERAGE CONNECTIVITY": [
    { text: "Check signal coverage", link: "#" }
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
   ✅ UPDATED SUGGESTIONS (WITH LINKS)
========================= */
function updateSuggestions() {

  const concern = $("concernType").value;
  const voc = $("voc").value;

  let html = "";

  if (concern === "Technical") {

    const procedures = TECH_PROCEDURES[voc] || [];

    html = procedures.length
      ? procedures.map(p =>
          `• ${p.text} ${p.link ? `<a href="${p.link}" target="_blank">[Open Guide]</a>` : ""}`
        ).join("<br>")
      : "• Select technical type";

  }

  else if (concern === "Aftersales") {

    const cat = getAftersalesCategory(voc);
    const list = AFTERSALES[cat] || [];

    html = list.map(i => `• ${i}`).join("<br>");

  }

  else if (concern === "Inquiry") {

    html = ["Check details", "Verify account", "Respond accordingly"]
      .map(i => `• ${i}`).join("<br>");

  }

  else if (concern === "Complaint") {

    html = ["Acknowledge issue", "Investigate", "Escalate if needed"]
      .map(i => `• ${i}`).join("<br>");

  }

  else {
    html = "• Select Concern Type";
  }

  $("suggestions").innerHTML = html;
}

/* =========================
   VOC SWITCH
========================= */
function updateVocOptions() {

  const concern = $("concernType").value;
  const voc = $("voc");

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select</option>
      <option>VOICE CONNECTIVITY</option>
      <option>SMS CONNECTIVITY</option>
      <option>DATA CONNECTIVITY</option>
      <option>ROAMING CONNECTIVITY</option>
      <option>COVERAGE CONNECTIVITY</option>
    `;
  }

  else if (concern === "Aftersales") {
    voc.innerHTML = `
      <option value="">Select</option>
      <option>INCREASE CREDIT LIMIT</option>
      <option>DEVICE UNLOCKING</option>
      <option>PLAN UPGRADE</option>
      <option>BILLING ISSUE</option>
    `;
  }

  else {
    voc.innerHTML = `
      <option value="">Select</option>
      <option>Positive</option>
      <option>Neutral</option>
      <option>Negative</option>
    `;
  }

  updateSuggestions();
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
    });

    el.addEventListener("change", () => {
      if (el.id === "concernType") updateVocOptions();
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

  updateOutput();
  updateSuggestions();
}

/* =========================
   GLOBAL EXPORT
========================= */
window.copyDoc = copyDoc;
window.downloadTxt = downloadTxt;
window.resetForm = resetForm;

/* =========================
   START
========================= */
window.addEventListener("DOMContentLoaded", init);
