/* ==========================================================================
   FIREBASE CONFIGURATION & MODULE INTEGRATION (V12.14.0)
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC3I-o7HZQ_UfvlxHOXBWYxPNtCx9Os63I",
  authDomain: "auto-docs-4ad35.firebaseapp.com",
  projectId: "auto-docs-4ad35",
  storageBucket: "auto-docs-4ad35.firebasestorage.app",
  messagingSenderId: "443489031474",
  appId: "1:443489031474:web:403654fc3253841219b32b"
};

// Initialize Firebase Core Firestore Database Engine
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

const THEME_KEY = "auto_docs_theme";
let bannerTimeout = null; 
let isResetting = false;      
let saveTimeout = null;      
let currentAuthMode = "LOGIN"; 
let globalShiftHistory = []; // In-memory reference for the active cloud session layout

// Session Management State variables for Numeric Database Routing
let currentAgentId = null; 
let currentAgentName = "Unknown Agent"; // Global variable to store active agent's name

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
   PURE NUMERIC CUSTOM SECURITY AUTHENTICATION FLOW
   ========================================================================== */
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  
  if (currentAuthMode === "LOGIN") {
    currentAuthMode = "REGISTER";
    $('authTitle').textContent = "Register Agent Profile";
    $('authSubtitle').textContent = "Configure secure numeric credential tokens";
    $('authSubmitBtn').textContent = "Provision Account";
    $('authToggleAnchor').textContent = "Already have an assigned profile? Log In";
    
    // Dynamically display our new Full Name element container
    if ($('authNameContainer')) {
      $('authNameContainer').style.display = "flex";
      $('authName').required = true;
    }
  } else {
    currentAuthMode = "LOGIN";
    $('authTitle').textContent = "Agent Workbench Sign In";
    $('authSubtitle').textContent = "Enter your credentials to clear network gateway";
    $('authSubmitBtn').textContent = "Authorize Session";
    $('authToggleAnchor').textContent = "Need a new operational profile? Register here";
    
    // Dynamically drop structural visibility of registration elements
    if ($('authNameContainer')) {
      $('authNameContainer').style.display = "none";
      $('authName').required = false;
    }
  }
}

async function handleAuthSubmission(e) {
  e.preventDefault();
  const agentId = $('authEmail').value.trim();
  const password = $('authPassword').value.trim();
  const fullName = $('authName')?.value.trim().toUpperCase() || "";

  if (!/^\d+$/.test(agentId)) {
    showSystemAlert("Format Error", "Agent ID must contain numeric values only!");
    $('authEmail').value = ""; // Empty the ID field on format error
    $('authEmail').focus();
    return;
  }

  try {
    const agentRef = doc(firestoreDb, "agent_profiles", agentId);
    const agentSnap = await getDoc(agentRef);

    if (currentAuthMode === "LOGIN") {
      if (agentSnap.exists()) {
        if (agentSnap.data().password === password) {
          currentAgentId = agentId;
          currentAgentName = agentSnap.data().full_name || "Agent " + agentId;
          localStorage.setItem("active_agent_session_id", agentId);
          
          await updateDoc(agentRef, { last_active_at: Date.now() }).catch(async () => {
            await setDoc(agentRef, { last_active_at: Date.now() }, { merge: true });
          });

          handleSessionLoginTransition();
          showToast("Identity verified. Session clear!");
        } else {
          // 1. WRONG PASSWORD: Clear password box and focus it
          showSystemAlert("Authorization Failure", "Incorrect password entered for this security gateway.");
          $('authPassword').value = ""; 
          $('authPassword').focus();
        }
      } else {
        // 2. WRONG AGENT ID / NO ACCOUNT EXISTS: Clear ID box and focus it
        showSystemAlert("Authorization Failure", "This Agent ID does not have an active profile registered.");
        $('authEmail').value = "";
        $('authEmail').focus();
      }
    } else {
      if (agentSnap.exists()) {
        // 3. ACCOUNT ALREADY EXISTS: Wipes the ID input to prevent duplicate setups
        showSystemAlert("Profile Error", "This numeric Agent ID is already registered to an active workspace.");
        $('authEmail').value = "";
        $('authEmail').focus();
        return;
      }
      
      const rosterRef = doc(firestoreDb, "registered_agents", agentId);
      const rosterSnap = await getDoc(rosterRef);

      if (!rosterSnap.exists()) {
        showSystemAlert("Security Warning", `Agent ID / WinID [${agentId}] is not authorized in the employee database roster.`);
        $('authEmail').value = "";
        $('authEmail').focus();
        return;
      }

      const registeredName = rosterSnap.data().name.trim().toUpperCase();
      if (registeredName !== fullName) {
        // 4. WRONG NAME MATCH: Wipes only the name input so they can retry spellings
        showSystemAlert(
          "Validation Error", 
          `The name provided does not match the official records registered for ID ${agentId}.\n\nPlease ensure spelling matches your workplace portal exactly.`
        );
        $('authName').value = "";
        $('authName').focus();
        return;
      }
      
      await setDoc(agentRef, {
        agent_id: agentId,
        full_name: fullName,
        password: password,
        created_at: Date.now(),
        last_active_at: Date.now()
      });
      
      showToast("Registration successful! Account provisioned.");
      currentAuthMode = "REGISTER"; 
      toggleAuthMode();
      
      $('authEmail').value = agentId;
      $('authPassword').value = "";
      $('authPassword').focus(); 
    }
  } catch (error) {
    console.error("Auth validation error:", error);
    showSystemAlert("Security Exception", "Database verification pipeline rejected interaction.");
  }
}

async function handleSessionLoginTransition() {
  $('authModal').style.display = "none";
  updateSyncStatusUI('online');
  
  updateOutput();
  updateSuggestions();
  
  // Directly pull live workspace data from the cloud database
  await pullLiveWorkspace();
}

function listenToSessionState() {
  const cachedId = localStorage.getItem("active_agent_session_id");
  
  document.querySelectorAll("input, textarea").forEach(el => {
    el.value = "";
    el.classList.remove('val-green', 'val-amber', 'val-crimson');
  });
  const select = $("concernType");
  if (select) select.selectedIndex = 0;
  updateVocOptions(false);
  globalShiftHistory = [];

  if (cachedId) {
    currentAgentId = cachedId;
    getDoc(doc(firestoreDb, "agent_profiles", cachedId)).then(snap => {
      if(snap.exists()) currentAgentName = snap.data().full_name || "Agent " + cachedId;
    });
    handleSessionLoginTransition();
  } else {
    currentAgentId = null;
    currentAgentName = "Unknown Agent";
    $('authModal').style.display = "flex";
    if ($("output")) {
      $("output").textContent = `CASE/SR VALUE: N/A\nCONCERN TYPE: \nVOC: \n\nSUBJ: \n\nNAME: \nMIN: \nCOMPANY: \nEMAIL: \nTHREAD: \nDATE/TIME: \n\nACTION:\n\n\nWOCAS:\n`;
    }
    if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
    renderHistoryView();
  }
}

/* ==========================================================================
   SOLE SOURCE OF TRUTH: CLOUD DATA ENGINE
   ========================================================================== */
async function saveData(forceInstant = false) {
  if (isResetting || !currentAgentId) return; 
  if (saveTimeout) clearTimeout(saveTimeout);

  updateSyncStatusUI('saving');

  const executeSave = async () => {
    const data = {};
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.id) data[el.id] = el.value;
    });

    const caseNum = $("case")?.value.trim() || "DRAFT";

    try {
      const docRef = doc(firestoreDb, "case_logs", currentAgentId);
      await setDoc(docRef, {
        agent_id: currentAgentId,
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
  if (!currentAgentId) return;

  try {
    const docRef = doc(firestoreDb, "case_logs", currentAgentId);
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
   REAL-TIME OPERATIONAL BROADCAST BANNER ENGINE
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
    console.warn("Broadcast listener network drop:", error);
  });
}

/* ==========================================================================
   ANALYTICS & OPERATIONAL METRICS COMPILATION ROUTINES
   ========================================================================== */
async function logCaseSubmissionToAnalytics(caseNumber) {
  if (!currentAgentId) return;

  const rightNow = new Date();
  const dateString = rightNow.toISOString().split('T')[0]; 
  const metricDocId = `${currentAgentId}-${Date.now()}`;
  
  const metricRef = doc(firestoreDb, "cases_performance_metrics", metricDocId);

  try {
    await setDoc(metricRef, {
      agent_id: currentAgentId,
      agent_name: currentAgentName,
      case_id: caseNumber || "N/A",
      completed_at: rightNow.toISOString(),
      submission_date: dateString
    });
  } catch(e) {
    console.warn("Performance metric profiling skipped: ", e);
  }
}

/* ==========================================================================
   CLOUD-BACKED SHIFT HISTORY LOGS MANIFEST SYSTEM
   ========================================================================== */
async function pushToHistory(caseNumber, textContent) {
  if (!currentAgentId) return;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = caseNumber ? caseNumber.trim().toUpperCase() : "N/A";

  if (globalShiftHistory.length > 0 && globalShiftHistory[0].text === textContent) return;

  const newLog = { id: displayId, time: timestamp, text: textContent };
  
  globalShiftHistory.unshift(newLog);
  if (globalShiftHistory.length > 50) globalShiftHistory.pop(); 

  try {
    const docRef = doc(firestoreDb, "case_logs", currentAgentId);
    await updateDoc(docRef, {
      shift_manifest: globalShiftHistory
    });

    // Run telemetry collection insertion automatically on copy
    await logCaseSubmissionToAnalytics(displayId);

  } catch (err) {
    console.error("Error committing shift log token:", err);
  }

  await renderHistoryView();
  updateFloatingBanner();
}

async function deleteHistoryItem(index, e) {
  if (e) e.stopPropagation();
  if (!currentAgentId) return;

  globalShiftHistory.splice(index, 1);

  try {
    const docRef = doc(firestoreDb, "case_logs", currentAgentId);
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
  if (!currentAgentId) return;

  // Utilize the custom system alert engine to handle the warning check cleanly
  showSystemAlert(
    "Flush History Confirmation", 
    "This will completely wipe your cross-station shift history manifest stack from the cloud database profile. Proceeding cannot be undone.",
    true
  );

  // Re-routing close button target specifically for structural destruction
  const closeBtn = $('alertModalCloseBtn');
  const structuralOverride = async () => {
    globalShiftHistory = [];
    try {
      const docRef = doc(firestoreDb, "case_logs", currentAgentId);
      await updateDoc(docRef, { shift_manifest: [] });
      showToast("Shift summary manifest history flushed completely.");
    } catch (e) {
      console.error(e);
    }
    await renderHistoryView();
    updateFloatingBanner();
    closeBtn.textContent = "Acknowledge & Dismiss";
    closeBtn.removeEventListener('click', structuralOverride);
  };

  closeBtn.textContent = "Confirm Wipe Manifest Stack";
  closeBtn.addEventListener('click', structuralOverride);
}

/* ==========================================================================
   CLEAN LOGOUT AND INSTANT RESET OPERATIONS (MODERNIZED OVERLAY VIEW)
   ========================================================================== */
function terminateAgentSession() {
  const logoutModal = $('logoutModal');
  const cancelBtn = $('confirmLogoutCancelBtn');
  const confirmBtn = $('confirmLogoutSubmitBtn');

  if (!logoutModal || !cancelBtn || !confirmBtn) {
    executeLogOutRoutine();
    return;
  }

  // 1. Unveil the sleek dark overlay viewport layout
  logoutModal.style.display = "flex";

  // 2. Closure Handler: Clicked "Stay Active" (Aborts logout process safely)
  const closeLogoutModal = () => {
    logoutModal.style.display = "none";
    cancelBtn.removeEventListener('click', closeLogoutModal);
    confirmBtn.removeEventListener('click', confirmAction);
  };

  // 3. Destructor Handler: Clicked "Log Out" (Triggers session cache wipe)
  const confirmAction = () => {
    logoutModal.style.display = "none";
    cancelBtn.removeEventListener('click', closeLogoutModal);
    confirmBtn.removeEventListener('click', confirmAction);
    executeLogOutRoutine();
  };

  // Mount listeners directly to the modal interface layout nodes
  cancelBtn.addEventListener('click', closeLogoutModal);
  confirmBtn.addEventListener('click', confirmAction);
}

function executeLogOutRoutine() {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  localStorage.removeItem("active_agent_session_id");
  listenToSessionState();
  showToast("Session closed safely. Workspace locked.");
}

async function resetForm(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  isResetting = true; 

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

    if (currentAgentId) {
      const docRef = doc(firestoreDb, "case_logs", currentAgentId);
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
   DYNAMIC MODERN SYSTEM OVERLAY DIALOGUE CONTROLLER
   ========================================================================== */
function showSystemAlert(title, message, isWarning = true) {
  const modal = $('alertModal');
  const titleEl = $('alertModalTitle');
  const msgEl = $('alertModalMessage');
  const iconBox = $('alertModalIconContainer');
  const icon = $('alertModalIcon');
  const closeBtn = $('alertModalCloseBtn');

  if (!modal) {
    alert(`${title}\n\n${message}`);
    return;
  }

  // Configure UI highlights based on message type
  if (isWarning) {
    iconBox.style.background = "rgba(239, 68, 68, 0.1)";
    iconBox.style.color = "#ef4444";
    icon.className = "fas fa-exclamation-circle";
    closeBtn.style.background = "#2563eb"; 
  } else {
    iconBox.style.background = "rgba(16, 185, 129, 0.1)";
    iconBox.style.color = "#10b981";
    icon.className = "fas fa-check-circle";
    closeBtn.style.background = "#10b981";
  }

  titleEl.textContent = title;
  msgEl.textContent = message;
  modal.style.display = "flex";

  const closeRoutine = () => {
    modal.style.display = "none";
    closeBtn.removeEventListener('click', closeRoutine);
    // Reset close button text safely back to default status context state
    closeBtn.textContent = "Acknowledge & Dismiss";
  };
  closeBtn.addEventListener('click', closeRoutine);
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
  
  $("drawerToggle")?.addEventListener("click", toggleDrawer);
  $("drawerCloseBtn")?.addEventListener("click", toggleDrawer);
  
  $("themeToggle")?.addEventListener("click", toggleTheme);

  $("downloadHistoryBtn")?.addEventListener("click", downloadHistoryLog);
  $("clearHistoryBtn")?.addEventListener("click", clearShiftHistory);

  // Initialize the real-time operational dashboard broadcast stream
  listenToOperationalBroadcasts();

  listenToSessionState();
});
