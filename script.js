/* ==========================================================================
   INDEXEDDB (DEXIE.JS) LOCAL-FIRST RESILIENCE LAYER
   ========================================================================== */
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.4/+esm';

// Create a local, firewall-immune transactional database inside the browser
const db = new Dexie('AutoDocsLocalDB');
db.version(1).stores({
  session_backup: 'id',          // Keeps current form state safe from sudden PC reboots
  shift_history: '++local_id, id' // Backs up copied logs locally
});

function $(id) {
  return document.getElementById(id);
}

/* ==========================================================================
   SUPABASE CLOUD DATABASE CONFIGURATION (AUTHENTICATED)
   ========================================================================== */
const SUPABASE_URL = "https://xgawbrwzdpqcbpwnrybe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnYXdicnd6ZHBxY2Jwd25yeWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Mzc0MzAsImV4cCI6MjA5NjIxMzQzMH0.l1bXiP7LDzIyIn3IzPKDKIFHCHp2KbHnjTbWOKyardI";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEY = "auto_docs_v5";
const THEME_KEY = "auto_docs_theme";
const HISTORY_KEY = "auto_docs_history"; 
const DOWNLOADED_STATE_KEY = "auto_docs_downloaded_status";

let bannerTimeout = null; 

/**
 * Validates the typed ID against the master database list.
 * Safely falls back if network is entirely firewall blocked.
 */
async function verifyAndGetAgentId() {
  let id = localStorage.getItem("auto_docs_agent_id");
  
  while (!id) {
    let inputId = prompt("🔒 Access Protected.\nPlease enter your official Employee ID to configure session tracking:");
    
    if (!inputId || !inputId.trim()) {
      alert("Employee ID is strictly required to use this workbench.");
      continue;
    }
    
    inputId = inputId.trim();

    try {
      const { data, error } = await supabaseClient
        .from('employees')
        .select('employee_id')
        .eq('employee_id', inputId);

      if (error) throw error;

      if (data && data.length > 0) {
        id = inputId;
        localStorage.setItem("auto_docs_agent_id", id);
        alert(`✅ Welcome authenticated agent: ${id}`);
      } else {
        alert("❌ Access Denied: That Employee ID is not registered in our system. Please check for typos.");
      }
    } catch (err) {
      console.warn("⚠️ Firewall/Network blocked database validation. Applying local offline override flag.");
      // If firewall blocks access, allow the agent in locally using their submitted ID
      id = inputId;
      localStorage.setItem("auto_docs_agent_id", id);
      alert(`⚠️ Offline Local Session Activated for Agent ID: ${id}`);
    }
  }
  return id;
}

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
   DATA STORAGE & BACKUPS REGISTRY ENGINE (FIREWALL-PROOF INDEXEDDB ADAPTER)
   ========================================================================== */
async function saveData() {
  const data = {};
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.id) data[el.id] = el.value;
  });
  
  // Tier 1 Backup: Traditional LocalStorage fallback
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Tier 2 Backup: Robust Database Fallback to user's local hard disk (Survives cache purges)
  try {
    await db.session_backup.put({ id: 'current_workspace_state', data: data, updatedAt: Date.now() });
  } catch (indexedDbErr) {
    console.error("IndexedDB transactional write failure:", indexedDbErr);
  }

  const caseNum = $("case")?.value.trim() || "DRAFT";
  const agentId = await verifyAndGetAgentId();

  // Tier 3 Cloud Sync: Discards errors gracefully if the network is firewall blocked
  try {
    await supabaseClient
      .from('case_logs')
      .upsert([
        { 
          agent_id: agentId, 
          case_number: caseNum, 
          form_data: data 
        }
      ], { onConflict: 'agent_id, case_number' });
  } catch (error) {
    console.warn("Cloud connection drops detected. Workspace operational state maintained via IndexedDB.", error);
  }
}

async function loadData() {
  try {
    // Attempt loading from hard disk database structure first
    const localDbState = await db.session_backup.get('current_workspace_state');
    const saved = localDbState ? localDbState.data : JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    
    Object.keys(saved).forEach(id => {
      const el = $(id);
      if (el && id !== "voc") el.value = saved[id];
    });
  } catch(e) {
    // Final fallback if local browser storage has exceptions
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.keys(saved).forEach(id => {
      const el = $(id);
      if (el && id !== "voc") el.value = saved[id];
    });
  }
}

/**
 * Recovers crashed inputs from either cloud repositories or local IndexedDB profiles.
 */
async function checkAndRestoreCrashData() {
  const agentId = await verifyAndGetAgentId();
  let lastSavedCase = "";
  let savedFormState = null;
  let source = "cloud";

  try {
    const { data, error } = await supabaseClient
      .from('case_logs')
      .select('form_data, case_number')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      lastSavedCase = data[0].case_number;
      savedFormState = data[0].form_data;
    }
  } catch (e) {
    console.warn("Cloud hydration blocked by firewall. Inspecting internal browser database store...");
  }

  // If cloud fails or is blocked by firewall, pull the local storage database instance state
  if (!savedFormState) {
    try {
      const backupState = await db.session_backup.get('current_workspace_state');
      if (backupState && backupState.data) {
        savedFormState = backupState.data;
        lastSavedCase = savedFormState['case'] || "Unsaved Workspace Data";
        source = "local hard drive backup";
      }
    } catch(err) {
      console.error("Local database cluster recovery state unreadable:", err);
    }
  }

  if (!savedFormState) return;

  const hasActiveInput = $("case")?.value || $("action")?.value || $("subj")?.value;
  if (hasActiveInput) return;

  const confirmRestore = confirm(`🔄 Auto Docs Session Recovery Engine:\n\nWe detected an interrupted session (${source}) for Case [${lastSavedCase}]. Would you like to restore your progress?`);
  
  if (confirmRestore) {
    Object.keys(savedFormState).forEach(id => {
      const el = $(id);
      if (el && id !== "voc") el.value = savedFormState[id];
    });

    if ($("concernType")?.value) updateVocOptions(true);
    if (savedFormState["voc"]) $("voc").value = savedFormState["voc"];

    updateOutput();
    updateSuggestions();
    if($('case')) validateCaseField($('case'));
    if($('min')) validateMinField($('min'));
    showToast(`Progress successfully recovered from ${source}!`);
  }
}

async function pushToHistory(caseNumber, textContent) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = caseNumber ? caseNumber.trim().toUpperCase() : "N/A";

  // Check the robust local storage matrix array
  let history = [];
  try {
    history = await db.shift_history.reverse().toArray();
  } catch(e) {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }

  if (history.length > 0 && history[0].text === textContent) return;

  const newLog = { id: displayId, time: timestamp, text: textContent };
  
  // Update both systems synchronously 
  try {
    await db.shift_history.add(newLog);
    // Limit store capacity rules
    const count = await db.shift_history.count();
    if (count > 50) {
      const oldest = await db.shift_history.orderBy('local_id').first();
      if(oldest) await db.shift_history.delete(oldest.local_id);
    }
  } catch(e) { console.error(e); }

  let lsHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  lsHistory.unshift(newLog);
  if (lsHistory.length > 50) lsHistory.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(lsHistory));
  
  localStorage.setItem(DOWNLOADED_STATE_KEY, "false");
  
  await renderHistoryView();
  updateFloatingBanner();
}

async function deleteHistoryItem(index, e) {
  if(e) e.stopPropagation();
  
  try {
    const items = await db.shift_history.toArray();
    if(items[index]) {
      await db.shift_history.delete(items[index].local_id);
    }
  } catch(err) { console.error(err); }
  
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  
  await renderHistoryView();
  updateFloatingBanner();
  showToast("Selected log deleted from shift summary.");
}

async function renderHistoryView() {
  const container = $('historyContainer');
  if (!container) return;

  let history = [];
  try {
    // Read directly from IndexedDB
    history = await db.shift_history.toArray();
  } catch(e) {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }

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
        <button type="button" onclick="window.loadHistoryItem(${index})" style="background: transparent; color: #60a5fa; border: 1px solid rgba(96,165,250,0.4); padding: 2px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; transition: 0.2s;">
          Recopy
        </button>
        <button type="button" onclick="window.deleteHistoryItem(${index}, event)" title="Delete Entry" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 3px; font-size: 11px; cursor: pointer; transition: 0.2s;">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `).join("");
}

async function loadHistoryItem(index) {
  let history = [];
  try {
    history = await db.shift_history.toArray();
  } catch(e) {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }
  if (!history[index]) return;
  
  navigator.clipboard.writeText(history[index].text);
  showToast(`Recopied Case ID: ${history[index].id} from History!`);
}

async function updateFloatingBanner() {
  const banner = $('floatingShiftBanner');
  if (!banner) return;

  const isDownloaded = localStorage.getItem(DOWNLOADED_STATE_KEY) === "true";
  
  let historyCount = 0;
  try {
    historyCount = await db.shift_history.count();
  } catch(e) {
    historyCount = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]").length;
  }
  
  if (isDownloaded && historyCount > 0) {
    banner.style.background = "#10b981"; 
    banner.style.color = "#ffffff";
    banner.innerHTML = `<i class="fas fa-check-circle"></i> HISTORY LOGS ALREADY DOWNLOADED & SAVED FOR THIS SHIFT (${historyCount})`;
    
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

async function downloadHistoryLog() {
  let history = [];
  try {
    history = await db.shift_history.toArray();
  } catch(e) {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }

  if (history.length === 0) {
    showToast("No history data to download yet!", true);
    return;
  }

  let fileContent = `==================================================\n`;
  fileContent += `         SHIFT LOGS MANIFEST EXPORT CORNER       \n`;
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

async function clearShiftHistory() {
  if (confirm("🚨 Warning:\n\nThis will completely wipe your local history data manifest stack for this entire shift. Proceed?")) {
    try {
      await db.shift_history.clear();
    } catch(e) { console.error(e); }
    localStorage.setItem(HISTORY_KEY, "[]");
    localStorage.setItem(DOWNLOADED_STATE_KEY, "false");
    await renderHistoryView();
    updateFloatingBanner();
    showToast("Shift summary history logs entirely flushed.");
  }
}

async function resetForm(event) {
  if (event) event.preventDefault();
  if (confirm("Are you sure you want to clear all interactive configuration inputs?")) {
    document.querySelectorAll("input, textarea").forEach(el => el.value = "");
    const select = $("concernType");
    if (select) select.selectedIndex = 0;
    
    updateVocOptions(false);
    
    // Clear out local cache profiles securely
    localStorage.removeItem(STORAGE_KEY);
    try {
      await db.session_backup.delete('current_workspace_state');
    } catch(e) {}
    
    updateOutput();
    updateSuggestions();
    
    document.querySelectorAll("input").forEach(el => el.classList.remove('val-green', 'val-amber', 'val-crimson'));
    showToast("Form fields reset successfully.");
  }
}

function copyDoc() {
  const outputText = $("output")?.textContent;
  if (!outputText || outputText.includes("Generating real-time output preview")) {
    showToast("No active documentation content found to copy!", true);
    return;
  }

  navigator.clipboard.writeText(outputText).then(() => {
    showToast("Documentation notes successfully copied to system clipboard!");
    const caseNum = $("case")?.value || "N/A";
    pushToHistory(caseNum, outputText);
  }).catch(err => {
    showToast("Clipboard injection routine blocked.", true);
  });
}

/* ==========================================================================
   DARK MODE SYSTEM 🌙
   ========================================================================== */
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
  "Complaint": []
};

VOC_OPTIONS["Inquiry"] = VOC_OPTIONS["Aftersales"];
VOC_OPTIONS["Complaint"] = VOC_OPTIONS["Aftersales"];

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
  else if (concern === "Aftersales" || concern === "Inquiry" || concern === "Complaint") {
    const procedures = AFTERSALES_PROCEDURES[voc] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Review account status<br>• Process system updates via guidelines";
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
   INITIALIZATION LAYERS
========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const isDark = savedTheme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  updateThemeIcon(isDark);
}

async function init() {
  initTheme(); 
  await loadData();
  updateVocOptions(true); 
  updateOutput();
  updateSuggestions();
  await renderHistoryView();
  updateFloatingBanner();

  // Run database gatekeeper verification step immediately on workspace startup
  await verifyAndGetAgentId();
  
  // Clear layout fields or hydrate backup logs safely from cloud database/IndexedDB
  await checkAndRestoreCrashData();

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
  });

  const concernSelect = $("concernType");
  if (concernSelect) {
    concernSelect.addEventListener("change", () => {
      updateVocOptions(false);
      updateSuggestions();
      saveData();
      updateOutput();
    });
  }
}

// Bind methods explicitly to window context to accommodate module isolation scoping
window.toggleTheme = toggleTheme;
window.toggleDrawer = toggleDrawer;
window.copyDoc = copyDoc;
window.resetForm = resetForm;
window.downloadHistoryLog = downloadHistoryLog;
window.clearShiftHistory = clearShiftHistory;
window.loadHistoryItem = loadHistoryItem;
window.deleteHistoryItem = deleteHistoryItem;

// Boot up structural context module
document.addEventListener("DOMContentLoaded", init);
