/* ==========================================================================
   INDEXEDDB (DEXIE.JS) LOCAL-FIRST RESILIENCE LAYER
   ========================================================================== */
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.4/+esm';

const db = new Dexie('AutoDocsLocalDB');
db.version(2).stores({
  session_backup: 'id',          
  shift_history: '++local_id, id', 
  sync_queue: 'case_number'       
});

function $(id) {
  return document.getElementById(id);
}

/* ==========================================================================
   FIREBASE CONFIGURATION & MODULE INTEGRATION (SYNCHRONIZED V12.14.0)
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getFirestore, doc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyC3I-o7HZQ_UfvlxHOXBWYxPNtCx9Os63I",
  authDomain: "auto-docs-4ad35.firebaseapp.com",
  projectId: "auto-docs-4ad35",
  storageBucket: "auto-docs-4ad35.firebasestorage.app",
  messagingSenderId: "443489031474",
  appId: "1:443489031474:web:403654fc3253841219b32b"
};

// Initialize Firebase Core Engines
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);
const firebaseAuth = getAuth(app);

const STORAGE_KEY = "auto_docs_v5";
const THEME_KEY = "auto_docs_theme";
const HISTORY_KEY = "auto_docs_history"; 
const DOWNLOADED_STATE_KEY = "auto_docs_downloaded_status";

let bannerTimeout = null; 
let isResetting = false;     
let isCloudAvailable = true; 
let saveTimeout = null;      
let currentAuthMode = "LOGIN"; // Tracks UI Mode state: "LOGIN" or "REGISTER"

/* ==========================================================================
   UI STATUS AND THEME INDICATORS
   ========================================================================== */
function updateSyncStatusUI(status) {
  const badge = $('syncStatus');
  if (!badge) return;

  badge.className = ""; 
  
  switch(status) {
    case 'online':
      badge.textContent = "● Cloud Connected (Firebase)";
      badge.style.color = "#10b981"; 
      break;
    case 'offline':
      badge.textContent = "● Local Offline Mode (Dexie Protected)";
      badge.style.color = "#fbbf24"; 
      break;
    case 'syncing':
      badge.textContent = "⟳ Syncing Queue Data...";
      badge.style.color = "#60a5fa"; 
      break;
  }
}

/* ==========================================================================
   FIREBASE AUTHENTICATION FLOWS
   ========================================================================== */
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  
  if (currentAuthMode === "LOGIN") {
    currentAuthMode = "REGISTER";
    $('authTitle').textContent = "Register Agent Profile";
    $('authSubtitle').textContent = "Configure secure localized database access keys";
    $('authSubmitBtn').textContent = "Provision Account";
    $('authToggleAnchor').textContent = "Already have an assigned profile? Log In";
  } else {
    currentAuthMode = "LOGIN";
    $('authTitle').textContent = "Agent Workbench Sign In";
    $('authSubtitle').textContent = "Enter your credentials to clear network gateway";
    $('authSubmitBtn').textContent = "Authorize Session";
    $('authToggleAnchor').textContent = "Need a new operational profile? Register here";
  }
}

async function handleAuthSubmission(e) {
  e.preventDefault();
  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;

  try {
    if (currentAuthMode === "LOGIN") {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      showToast("Identity verified. Session clear!");
    } else {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
      showToast("Account provisioned and authenticated successfully!");
    }
  } catch (error) {
    console.error("Auth validation error:", error.code);
    let readableError = error.message;
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
      readableError = "Invalid Email or Password formatting configuration.";
    } else if (error.code === "auth/email-already-in-use") {
      readableError = "This profile identity is already registered to a workspace.";
    } else if (error.code === "auth/weak-password") {
      readableError = "Security parameters failed. Password must be 6+ characters.";
    }
    alert(`❌ Authorization Failure:\n${readableError}`);
  }
}

function listenToSessionState() {
  onAuthStateChanged(firebaseAuth, async (user) => {
    if (user) {
      localStorage.setItem("auto_docs_agent_id", user.uid);
      $('authModal').style.display = "none";
      updateSyncStatusUI('online');
      isCloudAvailable = true;
      
      // Fire core data-hydration loops seamlessly
      await loadData();
      updateVocOptions(true);
      await renderHistoryView();
      updateOutput();
      updateSuggestions();
      updateFloatingBanner();
      
      await checkAndRestoreCrashData();
      await syncOfflineQueue();
    } else {
      localStorage.removeItem("auto_docs_agent_id");
      $('authModal').style.display = "flex";
      updateSyncStatusUI('offline');
    }
  });
}

async function terminateAgentSession() {
  if (confirm("Log out of current workbench session? Any unsynced data will remain local in Dexie.")) {
    try {
      await signOut(firebaseAuth);
    } catch (err) {
      console.error("Firebase Signout processing error:", err);
    }
  }
}

/* ==========================================================================
   NETWORK HEARTBEAT & BACKUP RECOVERY CLOUD SYNC
   ========================================================================== */
async function syncOfflineQueue() {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser || !isCloudAvailable) return;

  const agentId = currentUser.uid;
  const agentEmail = currentUser.email;
  const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

  try {
    const queuedItems = await db.sync_queue.toArray();
    if (queuedItems.length === 0) return;

    updateSyncStatusUI('syncing');

    for (const item of queuedItems) {
      const docRef = doc(firestoreDb, "case_logs", `${agentId}_${item.case_number}`);
      await setDoc(docRef, {
        agent_id: agentId,
        agent_email: agentEmail,
        log_date: localDate,
        case_number: item.case_number,
        form_data: item.form_data,
        updated_at: Date.now()
      }, { merge: true });

      await db.sync_queue.delete(item.case_number);
    }

    isCloudAvailable = true;
    updateSyncStatusUI('online');
    showToast(`Synced ${queuedItems.length} offline case logs to Firebase Firestore!`);
  } catch (e) {
    console.warn("⚠️ Sync queue attempt failed. Infrastructure remaining in isolated Dexie state.", e);
    updateSyncStatusUI('offline');
    isCloudAvailable = false;
  }
}

/* ==========================================================================
   DATA STORAGE & BACKUPS REGISTRY ENGINE (DEXIE + FIRESTORE HYBRID)
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
    
    // Safety verification check on current authentication session
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return;

    const agentId = currentUser.uid;
    const agentEmail = currentUser.email; 
    const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); 

    if (!isCloudAvailable) {
      await db.sync_queue.put({ case_number: caseNum, form_data: data, timestamp: Date.now() });
      updateSyncStatusUI('offline');
      return;
    }

    try {
      const docRef = doc(firestoreDb, "case_logs", `${agentId}_${caseNum}`);
      await setDoc(docRef, {
        agent_id: agentId,
        agent_email: agentEmail,   
        log_date: localDate,       
        case_number: caseNum,
        form_data: data,
        updated_at: Date.now()
      }, { merge: true });

      updateSyncStatusUI('online');
    } catch (error) {
      console.warn("Firebase drop or rule validation block captured. Queuing data locally...", error);
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
      if (el) el.value = saved[id];
    });
  } catch(e) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.keys(saved).forEach(id => {
      const el = $(id);
      if (el) el.value = saved[id];
    });
  }
}

async function checkAndRestoreCrashData() {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  const agentId = currentUser.uid;
  let lastSavedCase = "";
  let savedFormState = null;
  let source = "local hard drive backup"; 

  if (isCloudAvailable) {
    try {
      const caseLogsRef = collection(firestoreDb, "case_logs");
      const q = query(
        caseLogsRef, 
        where("agent_id", "==", agentId), 
        orderBy("updated_at", "desc"), 
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        lastSavedCase = docData.case_number;
        savedFormState = docData.form_data;
        source = "Firebase Cloud";
      }
    } catch (e) {
      console.warn("Cloud hydration query failed. Falling back to local index layer...", e);
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
      if (el) el.value = savedFormState[id];
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
  
  const btnText = $('drawerToggle')?.querySelector('span');
  const btnIcon = $('drawerToggle')?.querySelector('i');
  
  if(drawer.classList.contains('drawer-open')) {
    if (btnText) btnText.textContent = "Close Playbooks";
    if (btnIcon) btnIcon.className = "fas fa-times";
  } else {
    if (btnText) btnText.textContent = "View Playbooks";
    if (btnIcon) btnIcon.className = "fas fa-book-open";
  }
}

document.addEventListener('click', (e) => {
  const drawer = $('playbookPanel');
  if (drawer && drawer.classList.contains('drawer-open') && !drawer.contains(e.target) && !$('drawerToggle')?.contains(e.target) && !$('drawerCloseBtn')?.contains(e.target)) {
    drawer.classList.remove('drawer-open');
    const toggleBtn = $('drawerToggle');
    if (toggleBtn) {
      if (toggleBtn.querySelector('span')) toggleBtn.querySelector('span').textContent = "View Playbooks";
      if (toggleBtn.querySelector('i')) toggleBtn.querySelector('i').className = "fas fa-book-open";
    }
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
   SHIFT MANAGEMENT HISTORY STACKS
   ========================================================================== */
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
   OUTPUT GENERATOR & SUGGESTIONS MATRIX
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
   INITIALIZATION ENGINE & EVENT MOUNT LOOPS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  // Bind Authentication Form Event Streaming Watchers
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  $('logoutBtn')?.addEventListener('click', terminateAgentSession);

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true);
  }

  const trackingFields = ["case", "concernType", "voc", "subj", "name", "min", "company", "email", "thread", "datetime", "action", "wocas"];
  trackingFields.forEach(id => {
    const el = $(id);
    if (!el) return;
    
    el.addEventListener("input", () => { updateOutput(); saveData(); });
    el.addEventListener("change", () => { updateOutput(); saveData(); });
  });

  $("case")?.addEventListener("input", (e) => validateCaseField(e.target));
  $("min")?.addEventListener("input", (e) => validateMinField(e.target));

  $("concernType")?.addEventListener("change", () => {
    updateVocOptions(false);
    updateSuggestions();
  });
  $("voc")?.addEventListener("change", () => {
    updateSuggestions();
  });

  $("copyBtn")?.addEventListener("click", copyDoc);
  $("dockCopyBtn")?.addEventListener("click", copyDoc);
  $("resetBtn")?.addEventListener("click", resetForm);
  $("dockResetBtn")?.addEventListener("click", resetForm);
  $("drawerToggle")?.addEventListener("click", toggleDrawer);
  $("drawerCloseBtn")?.addEventListener("click", toggleDrawer);
  $("themeToggle")?.addEventListener("click", toggleTheme);
  $("manualSyncBtn")?.addEventListener("click", syncOfflineQueue);
  $("downloadHistoryBtn")?.addEventListener("click", downloadHistoryLog);
  $("clearHistoryBtn")?.addEventListener("click", clearShiftHistory);

  // Initial Security Session Token Status Check Routine
  listenToSessionState();
});
