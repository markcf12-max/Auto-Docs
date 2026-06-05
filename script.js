function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v5";
const THEME_KEY = "auto_docs_theme";
const HISTORY_KEY = "auto_docs_history"; 
const DOWNLOADED_STATE_KEY = "auto_docs_downloaded_status";

let bannerTimeout = null; 

/* ==========================================================================
   REAL-TIME REGULAR EXPRESSION VALIDATORS
   ========================================================================= */
function validateCaseField(el) {
  const val = el.value.trim().toUpperCase();
  el.classList.remove('val-amber', 'val-green', 'val-crimson');
  
  if (val.length === 0) return; 
  
  if (val === "NA" || val === "N/A") {
    el.classList.add('val-green');
    return;
  }
  
  if (val.length === 8 || val.length === 10) {
    el.classList.add('val-green');
  } else if (val.length > 10) {
    el.classList.add('val-crimson');
  } else {
    el.classList.add('val-amber');
  }
}

function validateMinField(el) {
  el.classList.remove('val-amber', 'val-crimson');
  if (el.value.trim().length > 0) {
    el.classList.add('val-green');
  } else {
    el.classList.remove('val-green');
  }
}

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

function showToast(msg, isError = false) {
  const toast = $('toast');
  if(!toast) return;
  
  if(isError) {
    toast.style.background = "#ef4444";
    toast.style.color = "#ffffff";
    toast.style.borderLeft = "5px solid #b91c1c";
  } else {
    toast.style.background = "#10b981";
    toast.style.color = "#ffffff";
    toast.style.borderLeft = "5px solid #047857";
  }
  
  $('toastMessage').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

/* ==========================================================================
   DATA STORAGE & HISTORY BACKUPS SYSTEM
   ========================================================================== */
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

function pushToHistory(caseNumber, textContent) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = caseNumber ? caseNumber.trim().toUpperCase() : "N/A";

  if (history.length > 0 && history[0].text === textContent) return;

  history.unshift({ id: displayId, time: timestamp, text: textContent });
  if (history.length > 50) history.pop(); 
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  localStorage.setItem(DOWNLOADED_STATE_KEY, "false");
  
  renderHistoryView();
  updateFloatingBanner();
}

function deleteHistoryItem(index, e) {
  if(e) e.stopPropagation();
  
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  
  renderHistoryView();
  updateFloatingBanner();
  showToast("Selected log deleted from shift summary.");
}

function renderHistoryView() {
  const container = $('historyContainer');
  if (!container) return;

  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  if (history.length === 0) {
    container.innerHTML = `<i style="color: #94a3b8; font-size: 13px;">No copied entries yet...</i>`;
    return;
  }

  container.innerHTML = history.map((item, index) => `
    <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; margin-bottom: 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.08);">
      <span style="font-size: 13px; font-weight: 500; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 65%;">
        <span style="color: #60a5fa;">[${item.time}]</span> ID: <strong>${item.id}</strong>
      </span>
      <div style="display: flex; gap: 4px;">
        <button type="button" onclick="loadHistoryItem(${index})" style="background: transparent; color: #60a5fa; border: 1px solid rgba(96,165,250,0.4); padding: 2px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; transition: 0.2s;">
          Recopy
        </button>
        <button type="button" onclick="deleteHistoryItem(${index}, event)" title="Delete Entry" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 3px; font-size: 11px; cursor: pointer; transition: 0.2s;">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function loadHistoryItem(index) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  if (!history[index]) return;
  
  navigator.clipboard.writeText(history[index].text);
  showToast(`Recopied Case ID: ${history[index].id} from History!`);
}

function updateFloatingBanner() {
  const banner = $('floatingShiftBanner');
  if (!banner) return;

  const isDownloaded = localStorage.getItem(DOWNLOADED_STATE_KEY) === "true";
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  
  if (isDownloaded && history.length > 0) {
    banner.style.background = "#10b981"; 
    banner.style.color = "#ffffff";
    banner.innerHTML = `<i class="fas fa-check-circle"></i> HISTORY LOGS ALREADY DOWNLOADED & SAVED FOR THIS SHIFT (${history.length})`;
    
    if(bannerTimeout) clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => {
      localStorage.setItem(DOWNLOADED_STATE_KEY, "false");
      updateFloatingBanner();
    }, 10000);

  } else {
    banner.style.background = "#fbbf24"; 
    banner.style.color = "#1e293b";
    banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> PLEASE DONT FORGET TO SAVE THE CASE END OF SHIFT`;
  }
}

function downloadHistoryLog() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  if (history.length === 0) {
    showToast("No history data to download yet!", true);
    return;
  }

  let fileContent = `==================================================\n`;
  fileContent += `          SHIFT LOGS MANIFEST EXPORT CORNER       \n`;
  fileContent += `==================================================\n\n`;

  history.forEach((item, idx) => {
    fileContent += `--- ENTRY #${idx + 1} | TIMESTAMP: [${item.time}] | REFERENCE ID: ${item.id} ---\n`;
    fileContent += `${item.text}\n`;
    fileContent += `\n==================================================\n\n`;
  });

  const blob = new Blob([fileContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0,10);
  a.href = url; 
  a.download = `ShiftHistory-Logs-${dateStr}.txt`; 
  a.click();
  URL.revokeObjectURL(url);
  
  localStorage.setItem(DOWNLOADED_STATE_KEY, "true");
  
  updateFloatingBanner();
  showToast("Shift history download complete!");
}

/* =========================
   DARK MODE SYSTEM 🌙
========================= */
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

/* ==========================================================================
   VOC PROCEDURES MAPPING CONFIG DATA
   ========================================================================== */
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
  "Bulk SIM Activation": [{ text: "Download excel batch provisioning manifest sheet", link: "https://yourguide-link.com/bulk-sim" }],
  "SIM REGISTRATION": [{ text: "Open official consumer registration validation console", link: "https://yourguide-link.com/sim-reg" }],
  "BALANCE:CLARIFICATION ON BILLED CHARGES": [{ text: "Pull ledger micro-transactions record sheet", link: "https://yourguide-link.com/ledger" }],
  "PUK/PIN": [{ text: "Access secure HLR encryption key distribution network", link: "https://yourguide-link.com/puk" }]
};

const COMPLAINT_PROCEDURES = {
  "Positive": [{ text: "Log feedback profile matrix notes", link: "#" }],
  "Neutral": [{ text: "Note general standard operation logs", link: "#" }],
  "Negative": [{ text: "Flag context parameters directly for prioritization rules", link: "#" }]
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
    "3G Sunset Spare SIM Process of CSP-Born Accounts (Smart only)", "3G Sunset SIM Replacement Process of SFDC-Born Accounts",
    "APP RELATED", "ACTIVATION", "ADA ENROLLMENT", "APPLICATION REQUIREMENTS", "APPLICATION STATUS", "AVAILMENT of ADD-ONS",
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
    "SUBSCRIBER TAG STATUS:NO SERVICE", "UNBLOCKING of DEALER/RETAILER SIM", "VAS CANCELLATION", "VAS TECH:VAS CANCELLATION",
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
    "SIM REG: BARRING DUE TO DEATH of OWNER", "SIM REG: TRANSFER OF OWNERSHIP", "SIM REG: DEACTIVATION DUE TO DEATH of OWNER",
    "SIM REG: PERMANENT DEACTIVATION", "SIM REG: UPDATE NAME", "SIM REG: UPDATE ADDRESS", "SIM REG: UPDATE BIRTHDATE", "SIM REG: UPDATE ID",
    "SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP", "SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT", "SIM REG: REGULATORY TEMPO DISCON",
    "SIM REG: RECONNECTION FROM TEMPO DISCON", "DATA CONNECTIVITY- 5G ENHANCEMENT RELATED", "Reconnection from Voluntary TD",
    "Involuntary TD", "VPD due to Deceased", "Waiver of Reconnection Fee", "Case Management – Billing Dispute",
    "Customer Account Adjustment", "DISPUTE ON MONETARY", "DISPUTE ON NON MONETARY", "DEFECTIVE SIM", "3G SUNSET/NETWORK ENHANCEMENT", "GENERIC"
  ],
  "Inquiry": [], 
  "Complaint": ["Positive", "Neutral", "Negative"]
};

// Direct mirror definition setup for shared list architecture sync
VOC_OPTIONS["Inquiry"] = VOC_OPTIONS["Aftersales"];

/* ==========================================================================
   OUTPUT GENERATOR
========================================================================== */
function updateOutput() {
  if (!$("output")) return;
  
  const caseVal = $("case")?.value.trim() || "";
  let ticketHeaderTag = "CASE/SR VALUE";
  let displayValue = caseVal;

  if (caseVal.length === 0) {
    displayValue = "N/A";
  } else if (caseVal.toUpperCase() === "NA" || caseVal.toUpperCase() === "N/A") {
    displayValue = caseVal.toUpperCase();
  } else if (caseVal.length === 8) {
    ticketHeaderTag = "CASE NUMBER";
  } else if (caseVal.length === 10) {
    ticketHeaderTag = "SR NUMBER";
  }

  $("output").textContent = 
`${ticketHeaderTag}: ${displayValue}
CONCERN TYPE: ${$("concernType")?.value || ""}
VOC: ${$("voc")?.value || ""}

SUBJ: ${$("subj")?.value || ""}

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

/* ==========================================================================
   PROCEDURE HANDLING
========================================================================== */
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
  else if (concern === "Aftersales" || concern === "Inquiry") {
    const procedures = AFTERSALES_PROCEDURES[voc] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Review account status<br>• Process system updates via guidelines";
  } 
  else if (concern === "Complaint") {
    const procedures = COMPLAINT_PROCEDURES[voc] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Acknowledge issue<br>• Investigate details closely<br>• Escalate if needed";
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

/* ==========================================================================
   INITIALIZATION
========================================================================== */
/* ==========================================================================
   INITIALIZATION
========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const isDark = savedTheme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  updateThemeIcon(isDark);
}

function init() {
  initTheme(); // Now safely defined right above!
  loadData();
  updateVocOptions(true); 
  updateOutput();
  updateSuggestions();
  renderHistoryView();
  updateFloatingBanner();

  if($('case')) validateCaseField($('case'));
  if($('min')) validateMinField($('min'));

  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => {
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
  let missingFields = [];
  if (!$("case")?.value.trim()) missingFields.push("SR/CASE");
  if (!$("concernType")?.value) missingFields.push("CONCERN TYPE");
  if (!$("voc")?.value.trim()) missingFields.push("VOC");
  if (!$("subj")?.value.trim()) missingFields.push("SUBJ");

  if (missingFields.length > 0) {
    showToast(`Missing required entries: ${missingFields.join(", ")}`, true);
    return; 
  }

  const outputText = $("output").textContent || "";
  navigator.clipboard.writeText(outputText); 
  
  const previewFrame = $('outputPanelFrame');
  if(previewFrame) {
    previewFrame.classList.remove('panel-flash-active');
    void previewFrame.offsetWidth; 
    previewFrame.classList.add('panel-flash-active');
  }

  showToast(`Manifest Logs Copied! (${outputText.length} chars)`);
  pushToHistory($("case")?.value, outputText);
}

function resetForm(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const toast = $('toast');
  if (toast) toast.classList.remove('show');

  localStorage.removeItem(STORAGE_KEY);
  
  document.querySelectorAll("input, textarea").forEach(el => {
    el.value = "";
    el.classList.remove('val-amber', 'val-green', 'val-crimson');
  });
  
  const concernDropdown = $("concernType");
  if (concernDropdown) concernDropdown.selectedIndex = 0;
  
  const vocInput = $("voc");
  if (vocInput) vocInput.value = "";
  
  const datalist = $("vocOptions");
  if (datalist) datalist.innerHTML = "";
  
  if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
  
  updateOutput();
  showToast("Logs cleared!");
}

function clearShiftHistory() {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(DOWNLOADED_STATE_KEY);
  if(bannerTimeout) clearTimeout(bannerTimeout);
  renderHistoryView();
  updateFloatingBanner();
  showToast("Shift History Cleared!");
}

window.copyDoc = copyDoc; 
window.resetForm = resetForm; 
window.toggleTheme = toggleTheme; 
window.toggleDrawer = toggleDrawer; 
window.loadHistoryItem = loadHistoryItem; 
window.downloadHistoryLog = downloadHistoryLog; 
window.clearShiftHistory = clearShiftHistory; 
window.deleteHistoryItem = deleteHistoryItem;

window.addEventListener("DOMContentLoaded", init);
