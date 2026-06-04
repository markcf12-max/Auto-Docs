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
   TECH DATA PROCEDURES & LINKS ✅
========================= */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [
    { text: "Check voice service status", link: "https://yourguide-link.com/voice" },
    { text: "Validate network profile", link: "https://yourguide-link.com/network" }
  ],
  "SMS CONNECTIVITY": [
    { text: "Check SMS provisioning", link: "https://yourguide-link.com/sms" }
  ],
  "DATA CONNECTIVITY": [
    { text: "Check data session profiles", link: "https://yourguide-link.com/data" }
  ],
  "ROAMING CONNECTIVITY": [
    { text: "Verify roaming routing flags", link: "https://yourguide-link.com/roaming" }
  ],
  "COVERAGE CONNECTIVITY": [
    { text: "Check physical coverage index maps", link: "https://yourguide-link.com/coverage" }
  ]
};

/* =========================
   AFTERSALES DETAILED PROCEDURES ✅
========================= */
const AFTERSALES_PROCEDURES = {
  "Device Unlocking": [
    { text: "Verify IMEI lock status in database", link: "https://yourguide-link.com/unlock" },
    { text: "Check tenure eligibility metrics", link: "#" }
  ],
  "Change Plan: Downgrade and Upgrade": [
    { text: "Review active contract matrix lock-ins", link: "https://yourguide-link.com/plans" },
    { text: "Calculate pro-rated dynamic billing shifts", link: "#" }
  ],
  "Bulk SIM Activation": [
    { text: "Download excel batch provisioning manifest sheet", link: "https://yourguide-link.com/bulk-sim" }
  ]
};

/* =========================
   INQUIRY DETAILED PROCEDURES ✅
========================= */
const INQUIRY_PROCEDURES = {
  "SIM REGISTRATION": [
    { text: "Open official consumer registration validation console", link: "https://yourguide-link.com/sim-reg" }
  ],
  "BALANCE:CLARIFICATION ON BILLED CHARGES": [
    { text: "Pull ledger micro-transactions record sheet", link: "https://yourguide-link.com/ledger" }
  ],
  "PUK/PIN": [
    { text: "Access secure HLR encryption key distribution network", link: "https://yourguide-link.com/puk" }
  ]
};

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
      ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #0066cc; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>")
      : "• Select technical type (VOC)";
  } 
  else if (concern === "Aftersales") {
    const procedures = AFTERSALES_PROCEDURES[voc] || [];
    html = procedures.length
      ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #0066cc; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>")
      : "• Review account status<br>• Validate identity authentication checks<br>• Process system updates via guidelines";
  } 
  else if (concern === "Inquiry") {
    const procedures = INQUIRY_PROCEDURES[voc] || [];
    html = procedures.length
      ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #0066cc; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>")
      : "• Search knowledge base resources<br>• Address billing, profile or activation rules<br>• Respond clearly to customer request";
  } 
  else if (concern === "Complaint") {
    html = ["Acknowledge issue", "Investigate details closely", "Escalate if operational limits reached"].map(i => `• ${i}`).join("<br>");
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
  
  const previousValue = voc.value;

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select</option>
      <option value="VOICE CONNECTIVITY">VOICE CONNECTIVITY</option>
      <option value="SMS CONNECTIVITY">SMS CONNECTIVITY</option>
      <option value="DATA CONNECTIVITY">DATA CONNECTIVITY</option>
      <option value="ROAMING CONNECTIVITY">ROAMING CONNECTIVITY</option>
      <option value="COVERAGE CONNECTIVITY">COVERAGE CONNECTIVITY</option>
    `;
  } 
  else if (concern === "Aftersales") {
    voc.innerHTML = `
      <option value="">Select</option>
      <option value="Increase/Decrease in Credit Limit">Increase/Decrease in Credit Limit</option>
      <option value="Feature Deactivation">Feature Deactivation</option>
      <option value="Feature Activation">Feature Activation</option>
      <option value="Device Unlocking">Device Unlocking</option>
      <option value="Contract Renewal/Retention">Contract Renewal/Retention</option>
      <option value="Change Plan: Downgrade and Upgrade">Change Plan: Downgrade and Upgrade</option>
      <option value="Change of Ownership from Enterprise to Consumer with NPOT Rollback">Change of Ownership from Enterprise to Consumer with NPOT Rollback</option>
      <option value="Change of Ownership from Enterprise to Consumer">Change of Ownership from Enterprise to Consumer</option>
      <option value="Change of Authorized Representative">Change of Authorized Representative</option>
      <option value="Change Mobile Number (MIN)">Change Mobile Number (MIN)</option>
      <option value="Change CPE/Handset/Device Replacement">Change CPE/Handset/Device Replacement</option>
      <option value="Change Billing Address">Change Billing Address</option>
      <option value="Change Assignee">Change Assignee</option>
      <option value="Bulk Voluntary Temporary Disconnection">Bulk Voluntary Temporary Disconnection</option>
      <option value="Bulk Voluntary Permanent Disconnection">Bulk Voluntary Permanent Disconnection</option>
      <option value="Bulk SIM Activation">Bulk SIM Activation</option>
      <option value="Bulk Feature Deactivation">Bulk Feature Deactivation</option>
      <option value="Bulk Feature Activation">Bulk Feature Activation</option>
      <option value="Bulk Change Assignee">Bulk Change Assignee</option>
      <option value="Billing Account Transfer">Billing Account Transfer</option>
      <option value="A2P Aftersales Transactions via Soprano Help Center">A2P Aftersales Transactions via Soprano Help Center</option>
      <option value="3G Sunset Spare SIM Process of CSP-Born Accounts (Smart only)">3G Sunset Spare SIM Process of CSP-Born Accounts (Smart only)</option>
      <option value="3G Sunset SIM Replacement Process of SFDC-Born Accounts">3G Sunset SIM Replacement Process of SFDC-Born Accounts</option>
    `;
  } 
  else if (concern === "Inquiry") {
    voc.innerHTML = `
      <option value="">Select</option>
      <option value="APP RELATED">APP RELATED</option>
      <option value="ACTIVATION">ACTIVATION</option>
      <option value="ADA ENROLLMENT">ADA ENROLLMENT</option>
      <option value="APPLICATION REQUIREMENTS">APPLICATION REQUIREMENTS</option>
      <option value="APPLICATION STATUS">APPLICATION STATUS</option>
      <option value="AVAILMENT OF ADD-ONS">AVAILMENT OF ADD-ONS</option>
      <option value="BALANCE TRANSFER">BALANCE TRANSFER</option>
      <option value="BALANCE:ACCOUNT RECONCILIATION">BALANCE:ACCOUNT RECONCILIATION</option>
      <option value="BALANCE:CLARIFICATION ON BILLED CHARGES">BALANCE:CLARIFICATION ON BILLED CHARGES</option>
      <option value="BALANCE:COLLECTION REMINDER">BALANCE:COLLECTION REMINDER</option>
      <option value="BALANCE:NON-RECEIPT OF BILL">BALANCE:NON-RECEIPT OF BILL</option>
      <option value="BALANCE:POSTING OF PAYMENT">BALANCE:POSTING OF PAYMENT</option>
      <option value="BALANCE:PRO-RATA">BALANCE:PRO-RATA</option>
      <option value="BALANCE:REMAINING ALLOCATION">BALANCE:REMAINING ALLOCATION</option>
      <option value="BALANCE:TOP UP">BALANCE:TOP UP</option>
      <option value="BALANCE:UNBILLED">BALANCE:UNBILLED</option>
      <option value="BAN">BAN</option>
      <option value="BAR SMS">BAR SMS</option>
      <option value="BARRING:DATA">BARRING:DATA</option>
      <option value="BARRING:LOSS">BARRING:LOSS</option>
      <option value="BILL DETAILS:DUE DATE/CUTOFF">BILL DETAILS:DUE DATE/CUTOFF</option>
      <option value="BIN ABUSE">BIN ABUSE</option>
      <option value="BIN FRAUD">BIN FRAUD</option>
      <option value="CHANGE IN BILLING ADDRESS">CHANGE IN BILLING ADDRESS</option>
      <option value="CHANGE IN CREDIT LIMIT">CHANGE IN CREDIT LIMIT</option>
      <option value="E-SIM">E-SIM</option>
      <option value="CHANGE IN CUSTOMER INFORMATION">CHANGE IN CUSTOMER INFORMATION</option>
      <option value="CHANGE OF OWNERSHIP">CHANGE OF OWNERSHIP</option>
      <option value="COVERAGE">COVERAGE</option>
      <option value="DATA CONNECTIVITY:INTERMITTENT CONNECTION">DATA CONNECTIVITY:INTERMITTENT CONNECTION</option>
      <option value="DATA CONNECTIVITY:NO CONNECTION">DATA CONNECTIVITY:NO CONNECTION</option>
      <option value="DATA CONNECTIVITY:SPECIFIC WEBSITE/APPLICATION">DATA CONNECTIVITY:SPECIFIC WEBSITE/APPLICATION</option>
      <option value="DATA CONNECTIVITY:SLOW CONNECTION">DATA CONNECTIVITY:SLOW CONNECTION</option>
      <option value="DEACTIVATION OF FLEXIBUNDLES">DEACTIVATION OF FLEXIBUNDLES</option>
      <option value="DISCONNECTION">DISCONNECTION</option>
      <option value="DISPUTE: MSF CHARGES">DISPUTE: MSF CHARGES</option>
      <option value="DISPUTE: CALL CHARGES">DISPUTE: CALL CHARGES</option>
      <option value="DISPUTE:DATA CHARGES">DISPUTE:DATA CHARGES</option>
      <option value="DISPUTE:SMS CHARGES">DISPUTE:SMS CHARGES</option>
      <option value="DISPUTE: PCC">DISPUTE: PCC</option>
      <option value="DISPUTE:VAS CHARGES">DISPUTE:VAS CHARGES</option>
      <option value="FAIR USE POLICY">FAIR USE POLICY</option>
      <option value="FAST DEPLETION">FAST DEPLETION</option>
      <option value="FLP RESENDING OF LOAD">FLP RESENDING OF LOAD</option>
      <option value="HANDSET UNLOCKING">HANDSET UNLOCKING</option>
      <option value="HOAX CALL/SMS">HOAX CALL/SMS</option>
      <option value="HOME PREPAID WIFI">HOME PREPAID WIFI</option>
      <option value="INABILITY TO CALL THE HOTLINE/SPECIAL NUMBER">INABILITY TO CALL THE HOTLINE/SPECIAL NUMBER</option>
      <option value="INTERNATIONAL ROAMING- STATUS">INTERNATIONAL ROAMING- STATUS</option>
      <option value="INABILITY TO REGISTER">INABILITY TO REGISTER</option>
      <option value="LIFTING:DATA">LIFTING:DATA</option>
      <option value="LIFTING:INCOMING/OUTGOING/DATA">LIFTING:INCOMING/OUTGOING/DATA</option>
      <option value="LIFTING:REDIRECTION">LIFTING:REDIRECTION</option>
      <option value="MENU UPDATE">MENU UPDATE</option>
      <option value="MOBILE APPLICATION">MOBILE APPLICATION</option>
      <option value="OTHER PROCEDURAL CONCERN">OTHER PROCEDURAL CONCERN</option>
      <option value="PASALOAD">PASALOAD</option>
      <option value="PAYMENT ARRANGEMENT">PAYMENT ARRANGEMENT</option>
      <option value="PAYMENT CHANNEL">PAYMENT CHANNEL</option>
      <option value="PLAN DOWNGRADE/UPGRADE">PLAN DOWNGRADE/UPGRADE</option>
      <option value="PLAN INCLUSION">PLAN INCLUSION</option>
      <option value="PRODUCT/PROMO INQUIRY">PRODUCT/PROMO INQUIRY</option>
      <option value="PROMO MECHANICS">PROMO MECHANICS</option>
      <option value="PROMO RATES/INCLUSION">PROMO RATES/INCLUSION</option>
      <option value="PUK/PIN">PUK/PIN</option>
      <option value="REFUND">REFUND</option>
      <option value="REGISTRATION PROCEDURE">REGISTRATION PROCEDURE</option>
      <option value="RELOADING PROCEDURE">RELOADING PROCEDURE</option>
      <option value="RELOADING:DELAYED CONFIRMATION MESSAGE">RELOADING:DELAYED CONFIRMATION MESSAGE</option>
      <option value="RELOADING:INABILITY TO RELOAD">RELOADING:INABILITY TO RELOAD</option>
      <option value="RELOADING:MULTIPLE DEDUCTION">RELOADING:MULTIPLE DEDUCTION</option>
      <option value="RELOADING:NO CONFIRMATION MESSAGE">RELOADING:NO CONFIRMATION MESSAGE</option>
      <option value="RELOADING:UNCREDITED LOAD">RELOADING:UNCREDITED LOAD</option>
      <option value="REPLACEMENT:DEVICE">REPLACEMENT:DEVICE</option>
      <option value="REPLACEMENT:SIM">REPLACEMENT:SIM</option>
      <option value="RETAILER INCENTIVE">RETAILER INCENTIVE</option>
      <option value="RETENTION">RETENTION</option>
      <option value="REWARDS">REWARDS</option>
      <option value="SELF CARE CHANNEL">SELF CARE CHANNEL</option>
      <option value="SERVICE CONTRACT">SERVICE CONTRACT</option>
      <option value="SERVICE DOWNTIME:CALL">SERVICE DOWNTIME:CALL</option>
      <option value="SERVICE DOWNTIME:DATA">SERVICE DOWNTIME:DATA</option>
      <option value="SERVICE DOWNTIME:LOADING">SERVICE DOWNTIME:LOADING</option>
      <option value="SERVICE DOWNTIME:REGISTRATION">SERVICE DOWNTIME:REGISTRATION</option>
      <option value="SERVICE DOWNTIME:SMS">SERVICE DOWNTIME:SMS</option>
      <option value="SERVICE DOWNTIME:VAS">SERVICE DOWNTIME:VAS</option>
      <option value="SIM UPGRADE">SIM UPGRADE</option>
      <option value="SMS CONNECTIVITY:INCOMING">SMS CONNECTIVITY:INCOMING</option>
      <option value="SMS CONNECTIVITY:MULTIPLE">SMS CONNECTIVITY:MULTIPLE</option>
      <option value="SMS CONNECTIVITY:DELAYED">SMS CONNECTIVITY:DELAYED</option>
      <option value="SMS CONNECTIVITY:OUTGOING">SMS CONNECTIVITY:OUTGOING</option>
      <option value="SMS CONNECTIVITY:PREMIUM SMS">SMS CONNECTIVITY:PREMIUM SMS</option>
      <option value="SOA:BILL REPRINT">SOA:BILL REPRINT</option>
      <option value="SOA:E-STATEMENT">SOA:E-STATEMENT</option>
      <option value="STATUS: ACCOUNT">STATUS: ACCOUNT</option>
      <option value="SOA:NON RECEIPT/DELAYED">SOA:NON RECEIPT/DELAYED</option>
      <option value="SUBSCRIBER TAG STATUS:NO SERVICE">SUBSCRIBER TAG STATUS:NO SERVICE</option>
      <option value="UNBLOCKING OF DEALER/RETAILER SIM">UNBLOCKING OF DEALER/RETAILER SIM</option>
      <option value="VAS CANCELLATION">VAS CANCELLATION</option>
      <option value="VAS TECH:VAS CANCELLATION">VAS TECH:VAS CANCELLATION</option>
      <option value="VAS TECH:UNABLE TO REGISTER">VAS TECH:UNABLE TO REGISTER</option>
      <option value="VOICE CONNECTIVITY: INCOMING">VOICE CONNECTIVITY: INCOMING</option>
      <option value="VOICE CONNECTIVITY: OUTGOING">VOICE CONNECTIVITY: OUTGOING</option>
      <option value="VOICE QUALITY">VOICE QUALITY</option>
      <option value="BALANCE: AMOUNT TO SETTLE">BALANCE: AMOUNT TO SETTLE</option>
      <option value="DISSATISFACTION">DISSATISFACTION</option>
      <option value="MNP INQUIRY">MNP INQUIRY</option>
      <option value="SUCCESSFUL MNP INTERPORT-IN (TO POSTPAID)">SUCCESSFUL MNP INTERPORT-IN (TO POSTPAID)</option>
      <option value="SUCCESSFUL MNP INTERPORT-IN (TO PREPAID)">SUCCESSFUL MNP INTERPORT-IN (TO PREPAID)</option>
      <option value="SUCCESSFUL MNP INTERPORT-OUT">SUCCESSFUL MNP INTERPORT-OUT</option>
      <option value="SUCCESSFUL MNP INTRAPORT (TO POSTPAID)">SUCCESSFUL MNP INTRAPORT (TO POSTPAID)</option>
      <option value="SUCCESSFUL MNP INTRAPORT (TO PREPAID)">SUCCESSFUL MNP INTRAPORT (TO PREPAID)</option>
      <option value="MNP SIM ACTIVATION">MNP SIM ACTIVATION</option>
      <option value="MNP SIM/DEVICE DELIVERY">MNP SIM/DEVICE DELIVERY</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)-BILL ISSUES">UNSUCCESSFUL MNP (POSTPAID)-BILL ISSUES</option>
      <option value="UNSUCCESSFUL MNP (PREPAID)-BILL ISSUES">UNSUCCESSFUL MNP (PREPAID)-BILL ISSUES</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)–CHANGE OF MIND">UNSUCCESSFUL MNP (POSTPAID)–CHANGE OF MIND</option>
      <option value="UNSUCCESSFUL MNP (PREPAID)–CHANGE OF MIND">UNSUCCESSFUL MNP (PREPAID)–CHANGE OF MIND</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)-FINANCIAL REASON">UNSUCCESSFUL MNP (POSTPAID)-FINANCIAL REASON</option>
      <option value="UNSUCCESSFUL MNP (PREPAID)-FINANCIAL REASON">UNSUCCESSFUL MNP (PREPAID)-FINANCIAL REASON</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PLAN OFFER">UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PLAN OFFER</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PROMO OFFER">UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PROMO OFFER</option>
      <option value="UNSUCCESSFUL MNP (PREPAID)-UNACCEPTABLE PROMO OFFER">UNSUCCESSFUL MNP (PREPAID)-UNACCEPTABLE PROMO OFFER</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)-TOOLS ISSUE">UNSUCCESSFUL MNP (POSTPAID)-TOOLS ISSUE</option>
      <option value="UNSUCCESSFUL MNP (PREPAID)-TOOLS ISSUE">UNSUCCESSFUL MNP (PREPAID)-TOOLS ISSUE</option>
      <option value="UNSUCCESSFUL MNP (POSTPAID)–UNDECIDED">UNSUCCESSFUL MNP (POSTPAID)–UNDECIDED</option>
      <option value="UNSUCCESSFUL MNP (PREPAID)–UNDECIDED">UNSUCCESSFUL MNP (PREPAID)–UNDECIDED</option>
      <option value="DISPUTE: DEVICE AMORTIZATION">DISPUTE: DEVICE AMORTIZATION</option>
      <option value="VOLTE/VOWIFI ISSUE">VOLTE/VOWIFI ISSUE</option>
      <option value="GENERAL INQUIRY">GENERAL INQUIRY</option>
      <option value="INTERNATIONAL ROAMING- ACTIVATION">INTERNATIONAL ROAMING- ACTIVATION</option>
      <option value="INTERNATIONAL ROAMING- DEACTIVATION">INTERNATIONAL ROAMING- DEACTIVATION</option>
      <option value="SIM REGISTRATION">SIM REGISTRATION</option>
      <option value="SIM REG: SIM VALIDITY EXTENSION">SIM REG: SIM VALIDITY EXTENSION</option>
      <option value="SIM REG: EXERCISE OF RIGHTS">SIM REG: EXERCISE OF RIGHTS</option>
      <option value="SIM REG: BARRING DUE TO LOST/STOLEN SIM">SIM REG: BARRING DUE TO LOST/STOLEN SIM</option>
      <option value="SIM REG: LIFTING DUE TO FOUND SIM">SIM REG: LIFTING DUE TO FOUND SIM</option>
      <option value="SIM REG: BARRING DUE TO DEATH OF OWNER">SIM REG: BARRING DUE TO DEATH OF OWNER</option>
      <option value="SIM REG: TRANSFER OF OWNERSHIP">SIM REG: TRANSFER OF OWNERSHIP</option>
      <option value="SIM REG: DEACTIVATION DUE TO DEATH OF OWNER">SIM REG: DEACTIVATION DUE TO DEATH OF OWNER</option>
      <option value="SIM REG: PERMANENT DEACTIVATION">SIM REG: PERMANENT DEACTIVATION</option>
      <option value="SIM REG: UPDATE NAME">SIM REG: UPDATE NAME</option>
      <option value="SIM REG: UPDATE ADDRESS">SIM REG: UPDATE ADDRESS</option>
      <option value="SIM REG: UPDATE BIRTHDATE">SIM REG: UPDATE BIRTHDATE</option>
      <option value="SIM REG: UPDATE ID">SIM REG: UPDATE ID</option>
      <option value="SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP">SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP</option>
      <option value="SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT">SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT</option>
      <option value="SIM REG: REGULATORY TEMPO DISCON">SIM REG: REGULATORY TEMPO DISCON</option>
      <option value="SIM REG: RECONNECTION FROM TEMPO DISCON">SIM REG: RECONNECTION FROM TEMPO DISCON</option>
      <option value="DATA CONNECTIVITY- 5G ENHANCEMENT RELATED">DATA CONNECTIVITY- 5G ENHANCEMENT RELATED</option>
      <option value="Reconnection from Voluntary TD">Reconnection from Voluntary TD</option>
      <option value="Reconnection from Involuntary TD">Reconnection from Involuntary TD</option>
      <option value="VPD due to Deceased">VPD due to Deceased</option>
      <option value="Waiver of Reconnection Fee">Waiver of Reconnection Fee</option>
      <option value="Case Management – Billing Dispute">Case Management – Billing Dispute</option>
      <option value="Customer Account Adjustment">Customer Account Adjustment</option>
      <option value="DISPUTE ON MONETARY">DISPUTE ON MONETARY</option>
      <option value="DISPUTE ON NON MONETARY">DISPUTE ON NON MONETARY</option>
      <option value="DEFECTIVE SIM">DEFECTIVE SIM</option>
      <option value="3G SUNSET/NETWORK ENHANCEMENT">3G SUNSET/NETWORK ENHANCEMENT</option>
      <option value="GENERIC">GENERIC</option>
    `;
  } 
  else {
    voc.innerHTML = `
      <option value="">Select</option>
      <option value="Positive">Positive</option>
      <option value="Neutral">Neutral</option>
      <option value="Negative">Negative</option>
    `;
  }

  if (previousValue) {
    voc.value = previousValue;
  }
}

/* =========================
   INITIALIZATION & EVENT BINDING
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
    });

    el.addEventListener("change", () => {
      if (el.id === "concernType") {
        updateVocOptions();
        // Force the VOC field to wipe its suggestion status cleanly when changing parent categories
        $("voc").value = ""; 
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
