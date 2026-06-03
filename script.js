
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
   AFTERSALES PROCEDURES
========================= */

const AFTERSALES_PROCEDURES = {

  ACCOUNT: [
    "Validate account ownership and authentication.",
    "Check account status and eligibility.",
    "Confirm request details and supporting documents.",
    "Proceed based on policy guidelines.",
    "Escalate if approval is required."
  ],

  DEVICE: [
    "Verify device/SIM details in the account.",
    "Check eligibility for unlocking or replacement.",
    "Confirm warranty or contract status.",
    "Proceed with approved device action.",
    "Escalate if restrictions apply."
  ],

  PLAN: [
    "Check current plan and contract status.",
    "Validate eligibility for upgrade/downgrade/retention.",
    "Confirm customer request impact.",
    "Process plan change accordingly.",
    "Set expectations for billing changes."
  ],

  BILLING: [
    "Review billing account details.",
    "Validate billing address or transfer request.",
    "Check for discrepancies or disputes.",
    "Process correction or escalation if needed.",
    "Provide explanation to customer."
  ],

  BULK: [
    "Verify bulk request authorization.",
    "Check affected accounts and scope.",
    "Validate system readiness for bulk processing.",
    "Execute bulk operation based on SOP.",
    "Confirm completion."
  ],

  SPECIAL: [
    "Identify system or regulatory requirement.",
    "Check applicable process or advisory.",
    "Follow official procedure.",
    "Coordinate with support teams if needed.",
    "Ensure compliance with updated guidelines."
  ]
};

/* =========================
   AFTERSALES CATEGORY MAPPING
========================= */

function getAftersalesCategory(voc) {

  if (!voc) return null;

  const v = voc.toUpperCase();

  if (
    v.includes("CREDIT") ||
    v.includes("OWNERSHIP") ||
    v.includes("REPRESENTATIVE") ||
    v.includes("ASSIGNEE")
  ) return "ACCOUNT";

  if (
    v.includes("DEVICE") ||
    v.includes("UNLOCKING") ||
    v.includes("SIM") ||
    v.includes("HANDSET") ||
    v.includes("REPLACEMENT")
  ) return "DEVICE";

  if (
    v.includes("PLAN") ||
    v.includes("RENEWAL") ||
    v.includes("RETENTION") ||
    v.includes("DOWNGRADE") ||
    v.includes("UPGRADE")
  ) return "PLAN";

  if (
    v.includes("BILL") ||
    v.includes("BILLING") ||
    v.includes("ADDRESS")
  ) return "BILLING";

  if (v.includes("BULK")) return "BULK";

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

  } 
  
  else if (concern === "Aftersales") {

    voc.innerHTML = `
      <option value="">Select Aftersales Type</option>
      <option>INCREASE/DECREASE IN CREDIT LIMIT</option>
      <option>FEATURE DEACTIVATION</option>
      <option>FEATURE ACTIVATION</option>
      <option>DEVICE UNLOCKING</option>
      <option>CONTRACT RENEWAL/RETENTION</option>
      <option>CHANGE PLAN: DOWNGRADE AND UPGRADE</option>
      <option>CHANGE OF OWNERSHIP FROM ENTERPRISE TO CONSUMER WITH NPOT ROLLBACK</option>
      <option>CHANGE OF OWNERSHIP FROM ENTERPRISE TO CONSUMER</option>
      <option>CHANGE OF AUTHORIZED REPRESENTATIVE</option>
      <option>CHANGE MOBILE NUMBER (MIN)</option>
      <option>CHANGE CPE/HANDSET/DEVICE REPLACEMENT</option>
      <option>CHANGE BILLING ADDRESS</option>
      <option>CHANGE ASSIGNEE</option>
      <option>BULK VOLUNTARY TEMPORARY DISCONNECTION</option>
      <option>BULK VOLUNTARY PERMANENT DISCONNECTION</option>
      <option>BULK SIM ACTIVATION</option>
      <option>BULK FEATURE DEACTIVATION</option>
      <option>BULK FEATURE ACTIVATION</option>
      <option>BULK CHANGE ASSIGNEE</option>
      <option>BILLING ACCOUNT TRANSFER</option>
      <option>A2P AFTERSALES TRANSACTIONS VIA SOPRANO HELP CENTER</option>
      <option>3G SUNSET SPARE SIM PROCESS OF CSP-BORN ACCOUNTS (SMART ONLY)</option>
      <option>3G SUNSET SIM REPLACEMENT PROCESS OF SFDC-BORN ACCOUNTS</option>
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

  // preserve selection if needed
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

  /* =========================
     TECHNICAL
  ========================= */
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

  /* =========================
     AFTERSALES (NEW LOGIC)
  ========================= */
  if (concern === "Aftersales") {

    if (!voc) {
      $("suggestions").textContent = "Select Aftersales Type";
      return;
    }

    const category = getAftersalesCategory(voc);
    const steps = AFTERSALES_PROCEDURES[category] || [];

    $("suggestions").innerHTML = `
      <strong>${voc}</strong>

      <div style="margin-top:10px; line-height:1.6;">
        ${steps.map(step => "• " + step).join("<br>")}
      </div>

      <br>

      <em>Please check on our updated empowerment matrix for reference.</em>
    `;

    return;
  }

  /* =========================
     DEFAULT (INQUIRY ETC.)
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
