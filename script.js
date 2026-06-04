function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v5";
const THEME_KEY = "auto_docs_theme";

/* ==========================================================================
   REAL-TIME REGULAR EXPRESSION VALIDATORS
   ========================================================================== */
function validateCaseField(el) {
  const val = el.value.trim();
  el.classList.remove('val-amber', 'val-green', 'val-crimson');
  
  if (val.length === 0) return; 
  
  if (val.length === 8 || val.length === 10) {
    el.classList.add('val-green');
  } else if (val.length > 10) {
    el.classList.add('val-crimson');
  } else {
    el.classList.add('val-amber');
  }
}

function validateMinField(el) {
  const val = el.value.trim();
  el.classList.remove('val-amber', 'val-green', 'val-crimson');

  if (val.length === 0) return;

  if (val.startsWith('09')) {
    if (val.length === 11) el.classList.add('val-green');
    else if (val.length > 11) el.classList.add('val-crimson');
    else el.classList.add('val-amber');
  } 
  else if (val.startsWith('63')) {
    if (val.length === 12) el.classList.add('val-green');
    else if (val.length > 12) el.classList.add('val-crimson');
    else el.classList.add('val-amber');
  } 
  else if (val.startsWith('9')) {
    if (val.length === 10) el.classList.add('val-green');
    else if (val.length > 10) el.classList.add('val-crimson');
    else el.classList.add('val-amber');
  } 
  else {
    el.classList.add('val-crimson'); 
  }
}

/* ==========================================================================
   OPTION B DRAWER STRUCTURAL VIEWPORT CONTROLLER
   ========================================================================== */
function toggleDrawer(e) {
  if(e) e.stopPropagation();
  const drawer = $('playbookPanel');
  if(!drawer) return;
  
  drawer.classList.toggle('drawer-open');
  
  const btnText = $('drawerToggle').querySelector('span');
  const btnIcon = $('drawerToggle').querySelector('i');
  
  if(drawer.classList.contains('drawer-open')) {
    btnText.textContent = "Close Playbooks";
    btnIcon.className = "fas fa-times";
  } else {
    btnText.textContent = "View Playbooks";
    btnIcon.className = "fas fa-book-open";
  }
}

document.addEventListener('click', (e) => {
  const drawer = $('playbookPanel');
  if (drawer && drawer.classList.contains('drawer-open') && !drawer.contains(e.target) && !$('drawerToggle').contains(e.target)) {
    drawer.classList.remove('drawer-open');
    $('drawerToggle').querySelector('span').textContent = "View Playbooks";
    $('drawerToggle').querySelector('i').className = "fas fa-book-open";
  }
});

function showToast(msg) {
  const toast = $('toast');
  if(!toast) return;
  $('toastMessage').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 2200);
}

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
   DARK MODE SYSTEM 🌙
========================= */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true);
  } else {
    document.body.classList.remove("dark-mode");
    updateThemeIcon(false);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const icon = document.querySelector("#themeToggle i");
  if (!icon) return;
  icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

/* =========================
   VOC PROCEDURES MAPPING CONFIG DATA
========================= */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [
    { text: "Check voice service status", link: "https://yourguide-link.com/voice" },
    { text: "Validate network profile", link: "https://yourguide-link.com/network" }
  ],
  "SMS CONNECTIVITY": [{ text: "Check SMS provisioning", link: "https://yourguide-link.com/sms" }],
  "DATA CONNECTIVITY": [{ text: "Check data session profiles", link: "https://yourguide-link.com/data" }],
  "ROAMING CONNECTIVITY": [{ text: "Verify roaming routing flags", link: "https://yourguide-link.com/roaming" }],
  "COVERAGE CONNECTIVITY": [{ text: "Check physical coverage index maps", link: "https://yourguide-link.com/coverage" }]
};

const AFTERSALES_PROCEDURES = {
  "Device Unlocking": [
    { text: "Verify IMEI lock status in database", link: "https://yourguide-link.com/unlock" },
    { text: "Check tenure eligibility metrics", link: "#" }
  ],
  "Change Plan: Downgrade and Upgrade": [{ text: "Review active contract matrix lock-ins", link: "https://yourguide-link.com/plans" }],
  "Bulk SIM Activation": [{ text: "Download excel batch provisioning manifest sheet", link: "https://yourguide-link.com/bulk-sim" }]
};

const INQUIRY_PROCEDURES = {
  "SIM REGISTRATION": [{ text: "Open official consumer registration validation console", link: "https://yourguide-link.com/sim-reg" }],
  "BALANCE:CLARIFICATION ON BILLED CHARGES": [{ text: "Pull ledger micro-transactions record sheet", link: "https://yourguide-link.com/ledger" }],
  "PUK/PIN": [{ text: "Access secure HLR encryption key distribution network", link: "https://yourguide-link.com/puk" }]
};

const VOC_OPTIONS = {
  "Technical": ["VOICE CONNECTIVITY", "SMS CONNECTIVITY", "DATA CONNECTIVITY", "ROAMING CONNECTIVITY", "COVERAGE CONNECTIVITY"],
  "Aftersales": [
    "Increase/Decrease in Credit Limit", "Feature Deactivation", "Feature Activation", "Device Unlocking",
    "Contract Renewal/Retention", "Change Plan: Downgrade and Upgrade", "Change of Ownership from Enterprise to Consumer with NPOT Rollback",
    "Change of Ownership from Enterprise to Consumer", "Change of Authorized Representative", "Change Mobile Number (MIN)",
    "Change CPE/Handset/Device Replacement", "Change Billing Address", "Change Assignee", "Bulk Voluntary Temporary Disconnection",
    "Bulk Voluntary Permanent Disconnection", "Bulk SIM Activation", "Bulk Feature Deactivation", "Bulk Feature Activation",
    "Bulk Change Assignee", "Billing Account Transfer", "A2P Aftersales Transactions via Soprano Help Center",
    "3G Sunset Spare SIM Process of CSP-Born Accounts (Smart only)", "3G Sunset SIM Replacement Process of SFDC-Born Accounts"
  ],
  "Inquiry": [
    "APP RELATED", "ACTIVATION", "ADA ENROLLMENT", "APPLICATION REQUIREMENTS", "APPLICATION STATUS", "AVAILMENT OF ADD-ONS",
    "BALANCE TRANSFER", "BALANCE:ACCOUNT RECONCILIATION", "BALANCE:CLARIFICATION ON BILLED CHARGES", "BALANCE:COLLECTION REMINDER",
    "BALANCE:NON-RECEIPT OF BILL", "BALANCE:POSTING OF PAYMENT", "BALANCE:PRO-RATA", "BALANCE:REMAINING ALLOCATION", "BALANCE:TOP UP",
    "BALANCE:UNBILLED", "BAN", "BAR SMS", "BARRING:DATA", "BARRING:LOSS", "BILL DETAILS:DUE DATE/CUTOFF", "BIN ABUSE", "BIN FRAUD",
    "CHANGE IN BILLING ADDRESS", "CHANGE IN CREDIT LIMIT", "E-SIM", "CHANGE IN CUSTOMER INFORMATION", "CHANGE OF OWNERSHIP",
    "COVERAGE", "DATA CONNECTIVITY:INTERMITTENT CONNECTION", "DATA CONNECTIVITY:NO CONNECTION", "DATA CONNECTIVITY:SPECIFIC WEBSITE/APPLICATION",
    "DATA CONNECTIVITY:SLOW CONNECTION", "DEACTIVATION OF FLEXIBUNDLES", "DISCONNECTION", "DISPUTE: MSF CHARGES", "DISPUTE: CALL CHARGES",
    "DISPUTE:DATA CHARGES", "DISPUTE:SMS CHARGES", "DISPUTE: PCC", "DISPUTE:VAS CHARGES", "FAIR USE POLICY", "FAST DEPLETION",
    "FLP RESENDING of LOAD", "HANDSET UNLOCKING", "HOAX CALL/SMS", "HOME PREPAID WIFI", "INABILITY TO CALL THE HOTLINE/SPECIAL NUMBER",
    "INTERNATIONAL ROAMING- STATUS", "INABILITY TO REGISTER", "LIFTING:DATA", "LIFTING:INCOMING/OUTGOING/DATA", "LIFTING:REDIRECTION",
    "MENU UPDATE", "MOBILE APPLICATION", "OTHER PROCEDURAL CONCERN", "PASALOAD", "PAYMENT ARRANGEMENT", "PAYMENT CHANNEL",
    "PLAN DOWNGRADE/UPGRADE", "PLAN INCLUSION", "PRODUCT/PROMO INQUIRY", "PROMO MECHANICS", "PROMO RATES/INCLUSION", "PUK/PIN",
    "REFUND", "REGISTRATION PROCEDURE", "RELOADING PROCEDURE", "RELOADING:DELAYED CONFIRMATION MESSAGE", "RELOADING:INABILITY TO RELOAD",
    "RELOADING:MULTIPLE DEDUCTION", "RELOADING:NO CONFIRMATION MESSAGE", "RELOADING:UNCREDITED LOAD", "REPLACEMENT:DEVICE",
    "REPLACEMENT:SIM", "RETAILER INCENTIVE", "RETENTION", "REWARDS", "SELF CARE CHANNEL", "SERVICE CONTRACT", "SERVICE DOWNTIME:CALL",
    "SERVICE DOWNTIME:DATA", "SERVICE DOWNTIME:LOADING", "SERVICE DOWNTIME:REGISTRATION", "SERVICE DOWNTIME:SMS", "SERVICE DOWNTIME:VAS",
    "SIM UPGRADE", "SMS CONNECTIVITY:INCOMING", "SMS CONNECTIVITY:MULTIPLE", "SMS CONNECTIVITY:DELAYED", "SMS CONNECTIVITY:OUTGOING",
    "SMS CONNECTIVITY:PREMIUM SMS", "SOA:BILL REPRINT", "SOA:E-STATEMENT", "STATUS: ACCOUNT", "SOA:NON RECEIPT/DELAYED",
    "SUBSCRIBER TAG STATUS:NO SERVICE", "UNBLOCKING OF DEALER/RETAILER SIM", "VAS CANCELLATION", "VAS TECH:VAS CANCELLATION",
    "VAS TECH:UNABLE TO REGISTER", "VOICE CONNECTIVITY: INCOMING", "VOICE CONNECTIVITY: OUTGOING", "VOICE QUALITY", "BALANCE: AMOUNT TO SETTLE",
    "DISSATISFACTION", "MNP INQUIRY", "SUCCESSFUL MNP INTERPORT-IN (TO POSTPAID)", "SUCCESSFUL MNP INTERPORT-IN (TO PREPAID)",
    "SUCCESSFUL MNP INTERPORT-OUT", "SUCCESSFUL MNP INTRAPORT (TO POSTPAID)", "SUCCESSFUL MNP INTRAPORT (TO PREPAID)", "MNP SIM ACTIVATION",
    "MNP SIM/DEVICE DELIVERY", "UNSUCCESSFUL MNP (POSTPAID)-BILL ISSUES", "UNSUCCESSFUL MNP (PREPAID)-BILL ISSUES",
    "UNSUCCESSFUL MNP (POSTPAID)–CHANGE OF MIND", "UNSUCCESSFUL MNP (PREPAID)–CHANGE OF MIND", "UNSUCCESSFUL MNP (POSTPAID)-FINANCIAL REASON",
    "UNSUCCESSFUL MNP (PREPAID)-FINANCIAL REASON", "UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PLAN OFFER", "UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PROMO OFFER",
    "UNSUCCESSFUL MNP (PREPAID)-UNACCEPTABLE PROMO OFFER", "UNSUCCESSFUL MNP (POSTPAID)-TOOLS ISSUE", "UNSUCCESSFUL MNP (PREPAID)-TOOLS ISSUE",
    "UNSUCCESSFUL MNP (POSTPAID)–UNDECIDED", "UNSUCCESSFUL MNP (PREPAID)–UNDECIDED", "DISPUTE: DEVICE AMORTIZATION", "VOLTE/VOWIFI ISSUE",
    "GENERAL INQUIRY", "INTERNATIONAL ROAMING- ACTIVATION", "INTERNATIONAL ROAMING- DEACTIVATION", "SIM REGISTRATION",
    "SIM REG: SIM VALIDITY EXTENSION", "SIM REG: EXERCISE OF RIGHTS", "SIM REG: BARRING DUE TO LOST/STOLEN SIM", "SIM REG: LIFTING DUE TO FOUND SIM",
    "SIM REG: BARRING DUE TO DEATH OF OWNER", "SIM REG: TRANSFER OF OWNERSHIP", "SIM REG: DEACTIVATION DUE TO DEATH of OWNER",
    "SIM REG: PERMANENT DEACTIVATION", "SIM REG: UPDATE NAME", "SIM REG: UPDATE ADDRESS", "SIM REG: UPDATE BIRTHDATE", "SIM REG: UPDATE ID",
    "SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP", "SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT", "SIM REG: REGULATORY TEMPO DISCON",
    "SIM REG: RECONNECTION FROM TEMPO DISCON", "DATA CONNECTIVITY- 5G ENHANCEMENT RELATED", "Reconnection from Voluntary TD",
    "Involuntary TD", "VPD due to Deceased", "Waiver of Reconnection Fee", "Case Management – Billing Dispute",
    "Customer Account Adjustment", "DISPUTE ON MONETARY", "DISPUTE ON NON MONETARY", "DEFECTIVE SIM", "3G SUNSET/NETWORK ENHANCEMENT", "GENERIC"
  ],
  "Complaint": ["Positive", "Neutral", "Negative"]
};

/* =========================
   OUTPUT GENERATOR
========================= */
function updateOutput() {
  if (!$("output")) return;
  
  const caseVal = $("case")?.value.trim() || "";
  let ticketHeaderTag = "CASE/SR VALUE";
  if (caseVal.length === 8) ticketHeaderTag = "CASE NUMBER";
  if (caseVal.length === 10) ticketHeaderTag = "SR NUMBER";

  $("output").textContent = 
`${ticketHeaderTag}: ${caseVal}
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
}

/* =========================
   PROCEDURE HANDLING
========================= */
function updateSuggestions() {
  if (!$("suggestions")) return;
  const concern = $("concernType")?.value;
  const voc = $("voc")?.value;
  
  const matrixNotice = `<div style="background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; padding: 10px; margin-bottom: 14px; border-radius: 4px; font-weight: bold; color: #f87171;">⚠️ Please check our Aftersales Empowerment Matrix</div>`;

  if (!concern) {
    $("suggestions").innerHTML = "Select Concern & VOC";
    return;
  }

  let html = matrixNotice;

  if (!voc) {
    html += `<i style="color: #94a3b8;">Select a VOC Option to load specific guidelines...</i>`;
    $("suggestions").innerHTML = html;
    return;
  }

  if (concern === "Technical") {
    const procedures = TECH_PROCEDURES[voc] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Type/Select a dynamic Technical field option.";
  } 
  else if (concern === "Aftersales") {
    const procedures = AFTERSALES_PROCEDURES[voc] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Review account status<br>• Process system updates via guidelines";
  } 
  else if (concern === "Inquiry") {
    const procedures = INQUIRY_PROCEDURES[voc] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Search knowledge base resources<br>• Respond clearly to customer request";
  } 
  else if (concern === "Complaint") {
    html += ["Acknowledge issue", "Investigate details closely", "Escalate if needed"].map(i => `• ${i}`).join("<br>");
  }
  $("suggestions").innerHTML = html;
}

function updateVocOptions(keepExistingValue = false) {
  const concern = $("concernType")?.value;
  const datalist = $("vocOptions");
  const vocInput = $("voc");
  if (!datalist || !vocInput) return;

  if (!concern || concern === "") {
    datalist.innerHTML = "";
    vocInput.value = "";
    return;
  }

  const options = VOC_OPTIONS[concern] || [];
  datalist.innerHTML = options.map(opt => `<option value="${opt}"></option>`).join("");

  if (!keepExistingValue) {
    vocInput.value = "";
  }
}

/* =========================
   DOWNLOAD TEXT METHOD
========================= */
function downloadTxt() {
  const blob = new Blob([$("output").textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Log-${$("case")?.value || 'auto-docs'}.txt`; a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   INITIALIZATION
========================= */
function init() {
  initTheme();
  loadData();
  updateVocOptions(true); 
  updateOutput();
  updateSuggestions();

  if($('case')) validateCaseField($('case'));
  if($('min')) validateMinField($('min'));

  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => {
      if(el.id === "case" || el.id === "min") el.value = el.value.replace(/\D/g, '');
      
      if(el.id === "case") validateCaseField(el);
      if(el.id === "min") validateMinField(el);

      saveData();
      updateOutput();
      if (el.id === "voc" || el.id === "concernType") {
        updateSuggestions();
      }
    });

    el.addEventListener("change", () => {
      if (el.id === "concernType") {
        updateVocOptions(false);
      }
      saveData();
      updateSuggestions();
      updateOutput();
    });
  });
}

function copyDoc() { 
  navigator.clipboard.writeText($("output").textContent || ""); 
  
  const previewFrame = $('outputPanelFrame');
  if(previewFrame) {
    previewFrame.classList.remove('panel-flash-active');
    void previewFrame.offsetWidth; 
    previewFrame.classList.add('panel-flash-active');
  }

  showToast(`Manifest Logs Copied! (${$("output").textContent.length} chars)`);

  const copyBtn = document.querySelector("button[onclick='copyDoc()']");
  if (copyBtn) {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied! ✓";
    copyBtn.style.background = "#059669"; 
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = "#2563eb";
    }, 1500);
  }
}

/* ==========================================================================
   BALANCED RESET METHOD
   ========================================================================== */
function resetForm(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const toast = $('toast');
  if (toast) toast.classList.remove('show');

  if(!confirm("Clear all active manifest field logs?")) return;
  localStorage.removeItem(STORAGE_KEY);
  
  document.querySelectorAll("input, textarea").forEach(el => {
    el.value = "";
    el.classList.remove('val-amber', 'val-green', 'val-crimson');
  });
  
  const concernDropdown = $("concernType");
  if (concernDropdown) {
    concernDropdown.selectedIndex = 0;
  }
  
  const vocInput = $("voc");
  if (vocInput) vocInput.value = "";
  
  const datalist = $("vocOptions");
  if (datalist) datalist.innerHTML = "";
  
  if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
  updateOutput();
}

window.copyDoc = copyDoc; window.downloadTxt = downloadTxt; window.resetForm = resetForm; window.toggleTheme = toggleTheme; window.toggleDrawer = toggleDrawer;
window.addEventListener("DOMContentLoaded", init);
