/* ==========================================================================
   FIREBASE CONFIGURATION & MODULE INTEGRATION (V12.14.0)
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';
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

const THEME_KEY = "auto_docs_theme";
let bannerTimeout = null; 
let isResetting = false;     
let saveTimeout = null;      
let currentAuthMode = "LOGIN"; 
let globalShiftHistory = []; // In-memory reference for the active cloud session layout

function $(id) {
  return document.getElementById(id);
}

/* ==========================================================================
   UI STATUS INDICATORS
   ========================================================================== */
function updateSyncStatusUI(status) {
  const badge = $('syncStatus');
  if (!badge) return;

  switch(status) {
    case 'online':
      badge.textContent = "● Cloud Connected (Firebase Realtime)";
      badge.style.color = "#10b981"; 
      break;
    case 'saving':
      badge.textContent = "⟳ Syncing Workspace...";
      badge.style.color = "#60a5fa"; 
      break;
    case 'error':
      badge.textContent = "❌ Sync Interrupted";
      badge.style.color = "#ef4444"; 
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
    $('authSubtitle').textContent = "Configure secure cloud database access keys";
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
    // Clear display inputs on layout transition
    document.querySelectorAll("input, textarea").forEach(el => {
      el.value = "";
      el.classList.remove('val-green', 'val-amber', 'val-crimson');
    });
    const select = $("concernType");
    if (select) select.selectedIndex = 0;
    updateVocOptions(false);
    globalShiftHistory = [];

    if (user) {
      $('authModal').style.display = "none";
      updateSyncStatusUI('online');
      
      updateOutput();
      updateSuggestions();
      
      // Directly pull live workspace data from the cloud database
      await pullLiveWorkspace();
    } else {
      $('authModal').style.display = "flex";
      if ($("output")) {
        $("output").textContent = `CASE/SR VALUE: N/A\nCONCERN TYPE: \nVOC: \n\nSUBJ: \n\nNAME: \nMIN: \nCOMPANY: \nEMAIL: \nTHREAD: \nDATE/TIME: \n\nACTION:\n\n\nWOCAS:\n`;
      }
      if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
      await renderHistoryView();
    }
  });
}

/* ==========================================================================
   SOLE SOURCE OF TRUTH: CLOUD DATA ENGINE
   ========================================================================== */
async function saveData(forceInstant = false) {
  if (isResetting) return; 
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  updateSyncStatusUI('saving');

  const executeSave = async () => {
    const data = {};
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.id) data[el.id] = el.value;
    });

    const caseNum = $("case")?.value.trim() || "DRAFT";
    const agentId = currentUser.uid;
    const agentEmail = currentUser.email; 

    try {
      const docRef = doc(firestoreDb, "case_logs", agentId);
      await setDoc(docRef, {
        agent_id: agentId,
        agent_email: agentEmail,          
        case_number: caseNum,
        form_data: data,
        shift_manifest: globalShiftHistory,
        updated_at: Date.now()
      }, { merge: true });
      updateSyncStatusUI('online');
    } catch (error) {
      console.error("Firebase synchronization cloud drop:", error);
      updateSyncStatusUI('error');
    }
  };

  if (forceInstant) {
    await executeSave();
  } else {
    saveTimeout = setTimeout(executeSave, 400);
  }
}

async function pullLiveWorkspace() {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  const agentId = currentUser.uid;

  try {
    const docRef = doc(firestoreDb, "case_logs", agentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const docData = docSnap.data();
      const savedFormState = docData.form_data;
      const lastSavedCase = docData.case_number || "Active Session Workspace";
      
      globalShiftHistory = docData.shift_manifest || [];

      if (savedFormState) {
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
        
        showToast(`Workspace synced live from cloud: [${lastSavedCase}]`);
      }
    }
    
    await renderHistoryView();
    updateFloatingBanner();
  } catch (e) {
    console.error("Critical Cloud Fetch Failure:", e);
    updateSyncStatusUI('error');
  }
}

/* ==========================================================================
   REAL-TIME OPERATIONAL BROADCAST BANNER ENGINE (OPTION 4)
   ========================================================================== */
function listenToOperationalBroadcasts() {
  const banner = $('adminBroadcastBanner');
  const textContainer = $('broadcastMessageText');
  
  if (!banner || !textContainer) return;

  const broadcastRef = doc(firestoreDb, "system_management", "broadcast_alerts");

  onSnapshot(broadcastRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (data.active === true && data.message && data.message.trim() !== "") {
        textContainer.textContent = `SYSTEM ALERT: ${data.message.toUpperCase()}`;
        banner.style.display = "flex"; 
      } else {
        banner.style.display = "none";  
      }
    } else {
      banner.style.display = "none";
    }
  }, (error) => {
    console.warn("Broadcast listener network drop or document parameters missing:", error);
  });
}

/* ==========================================================================
   CLOUD-BACKED SHIFT HISTORY LOGS MANIFEST SYSTEM
   ========================================================================== */
async function pushToHistory(caseNumber, textContent) {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = caseNumber ? caseNumber.trim().toUpperCase() : "N/A";

  if (globalShiftHistory.length > 0 && globalShiftHistory[0].text === textContent) return;

  const newLog = { id: displayId, time: timestamp, text: textContent };
  
  globalShiftHistory.unshift(newLog);
  if (globalShiftHistory.length > 50) globalShiftHistory.pop(); 

  try {
    const docRef = doc(firestoreDb, "case_logs", currentUser.uid);
    await updateDoc(docRef, {
      shift_manifest: globalShiftHistory
    });
  } catch (err) {
    console.error("Error committing shift log token to cloud storage profiles:", err);
  }

  await renderHistoryView();
  updateFloatingBanner();
}

async function deleteHistoryItem(index, e) {
  if (e) e.stopPropagation();
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  globalShiftHistory.splice(index, 1);

  try {
    const docRef = doc(firestoreDb, "case_logs", currentUser.uid);
    await updateDoc(docRef, {
      shift_manifest: globalShiftHistory
    });
    showToast("Selected log deleted from your cloud history container.");
  } catch(err) {
    console.error(err);
  }

  await renderHistoryView();
  updateFloatingBanner();
}

async function renderHistoryView() {
  const container = $('historyContainer');
  if (!container) return;

  if (globalShiftHistory.length === 0) {
    container.innerHTML = `<i style="color: #94a3b8; font-size: 13px;">No copied entries yet for this shift workbench run...</i>`;
    return;
  }

  container.innerHTML = globalShiftHistory.map((item, index) => `
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

  globalShiftHistory.forEach((item, index) => {
    $(`recopy-${index}`)?.addEventListener('click', () => loadHistoryItem(index));
    $(`delete-hist-${index}`)?.addEventListener('click', (e) => deleteHistoryItem(index, e));
  });
}

function loadHistoryItem(index) {
  if (!globalShiftHistory[index]) return;
  navigator.clipboard.writeText(globalShiftHistory[index].text);
  showToast(`Recopied Case ID: ${globalShiftHistory[index].id} from History Stack!`);
}

function updateFloatingBanner() {
  const banner = $('floatingShiftBanner');
  if (!banner) return;
  const historyCount = globalShiftHistory.length;
  
  banner.style.background = "#fbbf24"; 
  banner.style.color = "#1e293b";
  banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> LIVE OPERATIONS CHANNEL | ACTIVE MANIFEST ITEMS TRACKED IN CLOUD: (${historyCount})`;
}

async function downloadHistoryLog() {
  if (globalShiftHistory.length === 0) {
    showToast("No history data to download yet!", true);
    return;
  }

  let fileContent = `==================================================\n`;
  fileContent += `         SHIFT LOGS MANIFEST EXPORT CORNER       \n`;
  fileContent += `==================================================\n\n`;

  globalShiftHistory.forEach((item, idx) => {
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
  
  showToast("Shift history manifest download completed!");
}

async function clearShiftHistory() {
  if (!confirm("🚨 Warning:\n\nThis will completely wipe your cross-station shift history manifest stack from the cloud. Proceed?")) return;
  
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  globalShiftHistory = [];
  
  try {
    const docRef = doc(firestoreDb, "case_logs", currentUser.uid);
    await updateDoc(docRef, {
      shift_manifest: []
    });
    showToast("Shift summary manifest history flushed completely.");
  } catch (e) {
    console.error(e);
  }

  await renderHistoryView();
  updateFloatingBanner();
}

/* ==========================================================================
   CLEAN LOGOUT AND INSTANT RESET OPERATIONS
   ========================================================================== */
async function terminateAgentSession() {
  if (!confirm("Log out of current workbench session? Your cloud workspace and history states will be preserved.")) {
    return;
  }
  if (saveTimeout) clearTimeout(saveTimeout);
  
  try {
    await signOut(firebaseAuth);
    showToast("Session closed safely. Workspace locked.");
  } catch (err) {
    console.error("Firebase Signout processing error:", err);
  }
}

async function resetForm(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  isResetting = true; 
  const currentUser = firebaseAuth.currentUser;

  try {
    document.querySelectorAll("input, textarea").forEach(el => {
      el.value = "";
      el.classList.remove('val-green', 'val-amber', 'val-crimson');
    });

    const select = $("concernType");
    if (select) select.selectedIndex = 0;
    updateVocOptions(false);
    
    if ($("output")) {
      $("output").textContent = `CASE/SR VALUE: N/A\nCONCERN TYPE: \nVOC: \n\nSUBJ: \n\nNAME: \nMIN: \nCOMPANY: \nEMAIL: \nTHREAD: \nDATE/TIME: \n\nACTION:\n\n\nWOCAS:\n`;
    }
    if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";

    if (currentUser) {
      const docRef = doc(firestoreDb, "case_logs", currentUser.uid);
      await setDoc(docRef, {
        form_data: {}
      }, { merge: true });
    }
    
    showToast("Active workspace cleared.");
  } catch(e) {
    console.error("Cloud database reset exception:", e);
    showToast("Error clearing cloud form properties.", true);
  } finally {
    isResetting = false; 
  }
}

/* ==========================================================================
   REAL-TIME VALIDATORS & REGEX WRAPPERS
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
    toast.style.borderLeft = "5px solid #b91c1c";
  } else {
    toast.style.background = "#10b981";
    toast.style.borderLeft = "5px solid #047857";
  }
  
  $('toastMessage').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function copyDoc() {
  const outputText = $("output")?.textContent;
  if (!outputText || outputText.includes("Generating real-time output preview")) {
    showToast("No documentation content found to copy!", true);
    return;
  }

  navigator.clipboard.writeText(outputText).then(() => {
    showToast("Notes copied to system clipboard!");
    const caseNum = $("case")?.value || "N/A";
    pushToHistory(caseNum, outputText);
  }).catch(err => {
    showToast("Clipboard routine blocked.", true);
  });
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

/* ==========================================================================
   VOC ENGINE REFERENCE MATRICES
   ========================================================================== */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [{ text: "Check voice service status flags", link: "#" }],
  "SMS CONNECTIVITY": [{ text: "Check SMS provisioning status", link: "#" }],
  "DATA CONNECTIVITY": [{ text: "Check active data sessions", link: "#" }],
  "ROAMING CONNECTIVITY": [{ text: "Verify global routing tags", link: "#" }],
  "COVERAGE CONNECTIVITY": [{ text: "Check tower coverage indexes", link: "#" }]
};

const VOC_OPTIONS = {
  "Technical": ["VOICE CONNECTIVITY", "SMS CONNECTIVITY", "DATA CONNECTIVITY", "ROAMING CONNECTIVITY", "COVERAGE CONNECTIVITY"],
  "Aftersales": ["SIM Related Concerns / SIM Registration", "Plan Changes & Tier Modifications", "Device Unlocking / Handset Issues", "PUK/PIN Management", "GENERIC"],
  "Inquiry": ["SIM Related Concerns / SIM Registration", "Plan Changes & Tier Modifications", "Device Unlocking / Handset Issues", "PUK/PIN Management", "GENERIC"],
  "Complaint": ["SIM Related Concerns / SIM Registration", "Plan Changes & Tier Modifications", "Device Unlocking / Handset Issues", "PUK/PIN Management", "GENERIC"]
};

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

function updateOutput() {
  if (!$("output") || isResetting) return;
  
  const caseVal = $("case")?.value.trim() || "";
  let ticketHeaderTag = "CASE/SR VALUE";
  let displayValue = caseVal || "N/A";

  if (caseVal.length === 8) ticketHeaderTag = "CASE NUMBER";
  if (caseVal.length === 10) ticketHeaderTag = "SR NUMBER";

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
  
  if (!concern) {
    $("suggestions").innerHTML = "Select Concern & VOC";
    return;
  }

  let html = `<div style="color: #60a5fa; margin-bottom: 8px;"><strong>Operational Matrix Advice:</strong></div>`;

  if (!voc) {
    html += `<i>Choose sub-VOC string to compile live documentation rules...</i>`;
    $("suggestions").innerHTML = html;
    return;
  }

  if (concern === "Technical" && TECH_PROCEDURES[voc]) {
    html += TECH_PROCEDURES[voc].map(p => `• ${p.text}`).join("<br>");
  } else {
    html += `• Follow standard processing vectors designated for ${voc}.`;
  }

  $("suggestions").innerHTML = html;
}

/* ==========================================================================
   INITIALIZATION ENGINE & EVENT MOUNT LOOPS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  $('logoutBtn')?.addEventListener('click', terminateAgentSession);

  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true);
  }

  const trackingFields = ["case", "concernType", "voc", "subj", "name", "min", "company", "email", "thread", "datetime", "action", "wocas"];
  trackingFields.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => { updateOutput(); saveData(false); });
    el.addEventListener("change", () => { updateOutput(); saveData(true); });
    el.addEventListener("blur", () => { saveData(true); });
  });

  $("case")?.addEventListener("input", (e) => validateCaseField(e.target));
  $("min")?.addEventListener("input", (e) => validateMinField(e.target));

  $("concernType")?.addEventListener("change", () => {
    updateVocOptions(false);
    updateSuggestions();
  });
  $("voc")?.addEventListener("change", updateSuggestions);

  $("copyBtn")?.addEventListener("click", copyDoc);
  $("dockCopyBtn")?.addEventListener("click", copyDoc);
  $("resetBtn")?.addEventListener("click", resetForm);
  $("dockResetBtn")?.addEventListener("click", resetForm);
  
  // FIXED: Explicit targets mapped for both action handlers
  $("drawerToggle")?.addEventListener("click", toggleDrawer);
  $("drawerCloseBtn")?.addEventListener("click", toggleDrawer);
  
  // FIXED: Pointing accurately to functional identifier
  $("themeToggle")?.addEventListener("click", toggleTheme);

  $("downloadHistoryBtn")?.addEventListener("click", downloadHistoryLog);
  $("clearHistoryBtn")?.addEventListener("click", clearShiftHistory);

  // Initialize the real-time operational dashboard broadcast stream
  listenToOperationalBroadcasts();

  listenToSessionState();
});
