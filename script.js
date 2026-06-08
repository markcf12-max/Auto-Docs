/* ==========================================================================
   INDEXEDDB (DEXIE.JS) LOCAL-FIRST RESILIENCE LAYER
   ========================================================================== */
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.4/+esm';

// Create a local, firewall-immune transactional database inside the browser
const db = new Dexie('AutoDocsLocalDB');
db.version(2).stores({
  session_backup: 'id',          // Keeps current form state safe from sudden PC reboots
  shift_history: '++local_id, id', // Backs up copied logs locally
  sync_queue: 'case_number'       // Option 3: Track cases that failed to sync due to CORS/Firewall
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
let isResetting = false;     // Flag to prevent event listeners from firing during a form reset
let isCloudAvailable = true; // Runtime network flag to minimize console spam on CORS/Firewall drops
let saveTimeout = null;      // Option 1: Handle debouncing timers globally

/**
 * Option 2: Updates a UI connection indicator if it exists on your page layout
 */
function updateSyncStatusUI(status) {
  const badge = $('syncStatus');
  if (!badge) return;

  badge.className = ""; // Wipe existing classes
  
  switch(status) {
    case 'online':
      badge.textContent = "● Cloud Connected";
      badge.style.color = "#10b981"; // Emerald Green
      break;
    case 'offline':
      badge.textContent = "● Local Offline Mode (Dexie Protected)";
      badge.style.color = "#fbbf24"; // Amber Yellow
      break;
    case 'syncing':
      badge.textContent = "⟳ Syncing Queue Data...";
      badge.style.color = "#60a5fa"; // Sky Blue
      break;
  }
}

/**
 * Option 3: Network Heartbeat & Manual Trigger Sync Queue Recovery Engine
 */
async function syncOfflineQueue() {
  const agentId = localStorage.getItem("auto_docs_agent_id");
  if (!agentId) return;

  try {
    const queuedItems = await db.sync_queue.toArray();
    if (queuedItems.length === 0) return;

    updateSyncStatusUI('syncing');

    for (const item of queuedItems) {
      const { error } = await supabaseClient
        .from('case_logs')
        .upsert([
          { 
            agent_id: agentId, 
            case_number: item.case_number, 
            form_data: item.form_data 
          }
        ], { onConflict: 'agent_id, case_number' });

      if (error) throw error; 
      await db.sync_queue.delete(item.case_number);
    }

    isCloudAvailable = true;
    updateSyncStatusUI('online');
    showToast(`Successfully synced ${queuedItems.length} offline case logs to the cloud database!`);
  } catch (e) {
    console.warn("⚠️ Sync queue attempt failed. Infrastructure remaining in isolated Dexie state.");
    updateSyncStatusUI('offline');
  }
}

/**
 * Validates the typed ID against the master database list.
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
        updateSyncStatusUI('online');
        alert(`✅ Welcome authenticated agent: ${id}`);
      } else {
        alert("❌ Access Denied: That Employee ID is not registered in our system. Please check for typos.");
      }
    } catch (err) {
      console.warn("⚠️ Network Firewall/CORS blocked cloud authentication. Switching to local offline mode.");
      isCloudAvailable = false; 
      updateSyncStatusUI('offline');
      
      id = inputId;
      localStorage.setItem("auto_docs_agent_id", id);
      alert(`⚠️ Offline Local Session Activated via Dexie Layer for Agent ID: ${id}`);
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
  if (isResetting) return; 

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    const data = {};
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.id) data[el.id] = el.value;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    try {
      await db.session_backup.put({ id: 'current_workspace_state', data: data, updatedAt: Date.now() });
    } catch (indexedDbErr) {
      console.error("IndexedDB transactional write failure:", indexedDbErr);
    }

    const caseNum = $("case")?.value.trim() || "DRAFT";
    const agentId = localStorage.getItem("auto_docs_agent_id"); 

    if (!agentId) return;

    if (!isCloudAvailable) {
      await db.sync_queue.put({ case_number: caseNum, form_data: data, timestamp: Date.now() });
      updateSyncStatusUI('offline');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('case_logs')
        .upsert([
          { 
            agent_id: agentId, 
            case_number: caseNum, 
            form_data: data 
          }
        ], { onConflict: 'agent_id, case_number' });

      if (error) throw error;
      updateSyncStatusUI('online');
    } catch (error) {
      console.warn("Cloud connection drop or CORS block captured. Queuing data locally...");
      isCloudAvailable = false; 
      updateSyncStatusUI('offline');
      await db.sync_queue.put({ case_number: caseNum, form_data: data, timestamp: Date.now() });
    }
  }, 500);
}

async function loadData() {
  try {
    const localDbState = await db.session_backup.get('current_workspace_state');
    const saved = localDbState ? localDbState.data : JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    
    Object.keys(saved).forEach(id => {
      const el = $(id);
      if (el && id !== "voc") el.value = saved[id];
    });
  } catch(e) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.keys(saved).forEach(id => {
      const el = $(id);
      if (el && id !== "voc") el.value = saved[id];
    });
  }
}

/**
 * Recovers crashed inputs smoothly from either cloud repositories or internal Dexie profiles.
 */
async function checkAndRestoreCrashData() {
  const agentId = await verifyAndGetAgentId();
  let lastSavedCase = "";
  let savedFormState = null;
  let source = "local hard drive backup"; 

  if (isCloudAvailable) {
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
        source = "cloud";
      }
    } catch (e) {
      console.warn("Cloud hydration blocked by CORS/firewall. Switching context to internal browser database...");
      isCloudAvailable = false;
      updateSyncStatusUI('offline');
    }
  }

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

  let history = [];
  try {
    history = await db.shift_history.reverse().toArray();
  } catch(e) {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }

  if (history.length > 0 && history[0].text === textContent) return;

  const newLog = { id: displayId, time: timestamp, text: textContent };
  
  try {
    await db.shift_history.add(newLog);
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
        <button type="button" id="recopy-${index}" style="background: transparent; color: #60a5fa; border: 1px solid rgba(96,165,250,0.4); padding: 2px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; transition: 0.2s;">
          Recopy
        </button>
        <button type="button" id="delete-hist-${index}" title="Delete Entry" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 3px; font-size: 11px; cursor: pointer; transition: 0.2s;">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `).join("");

  // Attach history button event listeners cleanly without using inline event properties
  history.forEach((item, index) => {
    $(`recopy-${index}`)?.addEventListener('click', () => loadHistoryItem(index));
    $(`delete-hist-${index}`)?.addEventListener('click', (e) => deleteHistoryItem(index, e));
  });
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
      await db.sync_queue.clear(); 
    } catch(e) { console.error(e); }
    localStorage.setItem(HISTORY_KEY, "[]");
    localStorage.setItem(DOWNLOADED_STATE_KEY, "false");
    await renderHistoryView();
    updateFloatingBanner();
    showToast("Shift summary history logs entirely flushed.");
  }
}

async function resetForm(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  isResetting = true; 

  try {
    localStorage.removeItem(STORAGE_KEY);
    await db.session_backup.delete('current_workspace_state');

    document.querySelectorAll("input, textarea").forEach(el => {
      el.value = "";
      el.classList.remove('val-green', 'val-amber', 'val-crimson');
    });

    const select = $("concernType");
    if (select) select.selectedIndex = 0;
    
    updateVocOptions(false);
    
    if ($("output")) {
      $("output").textContent = 
`CASE/SR VALUE: N/A
CONCERN TYPE: 
VOC: 

SUBJ: 

NAME: 
MIN: 
COMPANY: 
EMAIL: 
THREAD: 
DATE/TIME: 

ACTION:


WOCAS:
`;
    }
    
    if ($("suggestions")) {
      $("suggestions").innerHTML = "Select Concern & VOC";
    }
    
    showToast("Form fields reset successfully.");
  } catch(e) {
    console.error("Local database reset exception:", e);
    showToast("Error while clearing background data profiles.", true);
  } finally {
    isResetting = false; 
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
   VOC PROCEDURES MAPPING CONFIG DATA (CATEGORIZED & CONDENSED)
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
  "Device Unlocking / Handset Issues": [
    { text: "Verify IMEI lock status in database", link: "https://yourguide-link.com/unlock" },
    { text: "Check tenure eligibility metrics", link: "#" }
  ],
  "Plan Changes & Tier Modifications": [{ text: "Review active contract matrix lock-ins", link: "https://yourguide-link.com/plans" }],
  "SIM Related Concerns / SIM Registration": [
    { text: "Open official consumer registration validation console", link: "https://yourguide-link.com/sim-reg" },
    { text: "Download excel batch provisioning manifest sheet", link: "https://yourguide-link.com/bulk-sim" }
  ],
  "Billing Ledger, Clarifications & Adjustments": [{ text: "Pull ledger micro-transactions record sheet", link: "https://yourguide-link.com/ledger" }],
  "PUK/PIN Management": [{ text: "Access secure HLR encryption key distribution network", link: "https://yourguide-link.com/puk" }]
};

const VOC_OPTIONS = {
  "Technical": [
    "VOICE CONNECTIVITY", 
    "SMS CONNECTIVITY", 
    "DATA CONNECTIVITY", 
    "ROAMING CONNECTIVITY", 
    "COVERAGE CONNECTIVITY"
  ],
  "Aftersales": [
    "Activations & Deactivations (Single/Bulk Features/VAS)",
    "SIM Related Concerns / SIM Registration",
    "Plan Changes & Tier Modifications",
    "Ownership & Authorized Representative Changes",
    "Billing Ledger, Clarifications & Adjustments",
    "Disputes (MSF, Call, Data, SMS, VAS, Device Amortization)",
    "Device Unlocking / Handset Issues",
    "Temporary / Permanent Disconnections & Reconnections",
    "Mobile Number Portability (MNP) Transactions",
    "Reloading & Balance Allocations",
    "Application Status & Requirements",
    "PUK/PIN Management",
    "Credit Limit & Account Adjustments",
    "Network Enhancements & 3G Sunset Processes",
    "General Inquiries & Customer Feedback",
    "GENERIC"
  ],
  "Inquiry": [], 
  "Complaint": []
};

VOC_OPTIONS["Inquiry"] = VOC_OPTIONS["Aftersales"];
VOC_OPTIONS["Complaint"] = VOC_OPTIONS["Aftersales"];

/**
 * Updates the secondary VOC dropdown values list dynamically when the main category shifts
 */
function updateVocOptions(preserveValue = false) {
  const mainCategory = $("concernType")?.value;
  const vocSelect = $("voc");
  if (!vocSelect) return;

  const currentVocValue = vocSelect.value;
  vocSelect.innerHTML = '<option value="">Select VOC Option</option>';

  if (mainCategory && VOC_OPTIONS[mainCategory]) {
    VOC_OPTIONS[mainCategory].forEach(option => {
      const optEl = document.createElement("option");
      optEl.value = option;
      optEl.textContent = option;
      vocSelect.appendChild(optEl);
    });
  }

  if (preserveValue && currentVocValue) {
    vocSelect.value = currentVocValue;
  }
}

/* ==========================================================================
   OUTPUT GENERATOR
========================================================================== */
function updateOutput() {
  if (!$("output") || isResetting) return;
  
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
  if (!$("suggestions") || isResetting) return;
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
    let lookupKey = voc;
    if (voc.includes("SIM")) lookupKey = "SIM Related Concerns / SIM Registration";
    if (voc.includes("Plan")) lookupKey = "Plan Changes & Tier Modifications";
    if (voc.includes("Billing") || voc.includes("Dispute")) lookupKey = "Billing Ledger, Clarifications & Adjustments";
    if (voc.includes("Unlocking")) lookupKey = "Device Unlocking / Handset Issues";
    if (voc.includes("PUK")) lookupKey = "PUK/PIN Management";

    const procedures = AFTERSALES_PROCEDURES[lookupKey] || [];
    html += procedures.length ? procedures.map(p => `• ${p.text} ${p.link && p.link !== "#" ? `<a href="${p.link}" target="_blank" style="color: #60a5fa; text-decoration: underline;">[Open Guide]</a>` : ""}`).join("<br>") : "• Review internal playbook document structures for this tracking item.";
  }

  $("suggestions").innerHTML = html;
}

/* ==========================================================================
   INITIALIZATION ENGINE & CORE EVENT LOOPS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  // Theme state setup hooks
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true);
  }

  // Hook input nodes directly up to data tracking loop drivers
  const trackingFields = ["case", "concernType", "voc", "subj", "name", "min", "company", "email", "thread", "datetime", "action", "wocas"];
  trackingFields.forEach(id => {
    const el = $(id);
    if (!el) return;
    
    // Bind output updates and automated backend caching triggers
    el.addEventListener("input", () => {
      updateOutput();
      saveData();
    });
    el.addEventListener("change", () => {
      updateOutput();
      saveData();
    });
  });

  // Dedicated validation logic tracking listeners
  $("case")?.addEventListener("input", (e) => validateCaseField(e.target));
  $("min")?.addEventListener("input", (e) => validateMinField(e.target));

  // Category switch configuration listeners
  $("concernType")?.addEventListener("change", () => {
    updateVocOptions(false);
    updateSuggestions();
  });
  $("voc")?.addEventListener("change", () => {
    updateSuggestions();
  });

  // Structural actions interactive control tracking mappings
  $("copyBtn")?.addEventListener("click", copyDoc);
  $("resetBtn")?.addEventListener("click", resetForm);
  $("themeToggle")?.addEventListener("click", toggleTheme);
  $("drawerToggle")?.addEventListener("click", toggleDrawer);
  $("downloadHistoryBtn")?.addEventListener("click", downloadHistoryLog);
  $("clearHistoryBtn")?.addEventListener("click", clearShiftHistory);

  // Synchronize history dashboard renders and offline databases profiles
  await loadData();
  updateVocOptions(true);
  await renderHistoryView();
  updateOutput();
  updateSuggestions();
  updateFloatingBanner();
  
  await checkAndRestoreCrashData();
  await syncOfflineQueue();
});
