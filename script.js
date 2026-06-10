/* ==========================================================================
   FIREBASE CONFIGURATION & MODULE INTEGRATION (V12.14.0)
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs, increment } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

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
let globalShiftHistory = []; 

// Session Management State variables for Numeric Database Routing
let currentAgentId = null; 
let currentAgentName = "Unknown Agent"; 
let currentAgentLob = "UNKNOWN";        

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
   PURE NUMERIC CUSTOM SECURITY AUTHENTICATION FLOW WITH TELEMETRY TRACKING
   ========================================================================== */
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  
  if (currentAuthMode === "LOGIN") {
    currentAuthMode = "REGISTER";
    $('authTitle').textContent = "Register Agent Profile";
    $('authSubtitle').textContent = "Configure secure numeric credential tokens";
    $('authSubmitBtn').textContent = "Provision Account";
    $('authToggleAnchor').textContent = "Already have an assigned profile? Log In";
    
    if ($('authNameContainer')) $('authNameContainer').style.display = "flex";
    if ($('authLobContainer')) $('authLobContainer').style.display = "flex";
    $('authName').required = true;
    $('authLob').required = true;
  } else {
    currentAuthMode = "LOGIN";
    $('authTitle').textContent = "Agent Workbench Sign In";
    $('authSubtitle').textContent = "Enter your credentials to clear network gateway";
    $('authSubmitBtn').textContent = "Authorize Session";
    $('authToggleAnchor').textContent = "Need a new operational profile? Register here";
    
    if ($('authNameContainer')) $('authNameContainer').style.display = "none";
    if ($('authLobContainer')) $('authLobContainer').style.display = "none";
    $('authName').required = false;
    $('authLob').required = false;
  }
}

async function handleAuthSubmission(e) {
  e.preventDefault();
  const agentId = $('authEmail').value.trim();
  const password = $('authPassword').value.trim();
  const fullName = $('authName')?.value.trim().toUpperCase() || "";
  const selectedLob = $('authLob')?.value || "";
  
  const rightNow = new Date();
  const todayStr = `${rightNow.getFullYear()}-${String(rightNow.getMonth() + 1).padStart(2, '0')}-${String(rightNow.getDate()).padStart(2, '0')}`;

  // SUPERVISOR PORTAL ENTRY BYPASS
  if (agentId.toLowerCase() === "admin" || agentId.toLowerCase() === "supervisor") {
    if (password === "SuperOps2026!") {
      $('authModal').style.display = "none";
      showSupervisorPanel();
      showToast("Supervisor Matrix Decrypted.");
      return;
    } else {
      showSystemAlert("Access Denied", "Invalid administrative supervisor master token.");
      $('authPassword').value = "";
      $('authPassword').focus();
      return;
    }
  }

  if (!/^\d+$/.test(agentId)) {
    showSystemAlert("Format Error", "Agent ID must contain numeric values only!");
    $('authEmail').value = "";
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
          currentAgentLob = agentSnap.data().lob || "UNKNOWN";
          localStorage.setItem("active_agent_session_id", agentId);
          
          await updateDoc(agentRef, { last_active_at: Date.now() }).catch(async () => {
            await setDoc(agentRef, { last_active_at: Date.now() }, { merge: true });
          });

          const metricDayRef = doc(firestoreDb, "daily_compliance_telemetry", `${agentId}_${todayStr}`);
          await setDoc(metricDayRef, {
            agent_id: agentId,
            agent_name: currentAgentName,
            lob: currentAgentLob,
            date: todayStr,
            login_count: increment(1),
            last_activity_at: Date.now()
          }, { merge: true });

          handleSessionLoginTransition();
          showToast(`Identity verified. ${currentAgentLob} Session Clear!`);
        } else {
          showSystemAlert("Authorization Failure", "Incorrect password entered for this security gateway.");
          $('authPassword').value = ""; 
          $('authPassword').focus();
        }
      } else {
        showSystemAlert("Authorization Failure", "This Agent ID does not have an active profile registered.");
        $('authEmail').value = "";
        $('authEmail').focus();
      }
    } else {
      if (agentSnap.exists()) {
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
        showSystemAlert("Validation Error", `The name provided does not match the official records registered for ID ${agentId}.`);
        $('authName').value = "";
        $('authName').focus();
        return;
      }

      if (!selectedLob) {
        showSystemAlert("Validation Error", "You must assign your designated Line of Business (ES or EBG) profile target.");
        return;
      }
      
      await setDoc(agentRef, {
        agent_id: agentId,
        full_name: fullName,
        password: password,
        lob: selectedLob,
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
  $('logoutBtn').style.display = "block";
  updateSyncStatusUI('online');
  
  updateOutput();
  updateVocOptions(true);
  updateSuggestions();
  
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
      if(snap.exists()) {
        currentAgentName = snap.data().full_name || "Agent " + cachedId;
        currentAgentLob = snap.data().lob || "UNKNOWN";
        handleSessionLoginTransition();
      } else {
        localStorage.removeItem("active_agent_session_id");
        showLoginGateway(false);
      }
    });
  } else {
    currentAgentId = null;
    currentAgentName = "Unknown Agent";
    currentAgentLob = "UNKNOWN";
    showLoginGateway(false);
    if ($("output")) {
      $("output").textContent = `CASE/SR VALUE: N/A\nCONCERN TYPE: \nVOC: \n\nSUBJ: \n\nNAME: \nMIN: \nCOMPANY: \nEMAIL: \nTHREAD: \nDATE/TIME: \n\nACTION:\n\n\nWOCAS:\n`;
    }
    if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
    renderHistoryView();
  }
}

function showLoginGateway(isRegisterMode = false) {
  $('authModal').style.display = "flex";
  $('logoutBtn').style.display = "none";
  if (isRegisterMode) {
    currentAuthMode = "REGISTER";
    $('authTitle').textContent = "Register Agent Profile";
    $('authSubtitle').textContent = "Configure secure numeric credential tokens";
    $('authSubmitBtn').textContent = "Provision Account";
    $('authToggleAnchor').textContent = "Already have an assigned profile? Log In";
    if ($('authNameContainer')) $('authNameContainer').style.display = "flex";
    if ($('authLobContainer')) $('authLobContainer').style.display = "flex";
  } else {
    currentAuthMode = "LOGIN";
    $('authTitle').textContent = "Agent Workbench Sign In";
    $('authSubtitle').textContent = "Enter your credentials to clear network gateway";
    $('authSubmitBtn').textContent = "Authorize Session";
    $('authToggleAnchor').textContent = "Need a new operational profile? Register here";
    if ($('authNameContainer')) $('authNameContainer').style.display = "none";
    if ($('authLobContainer')) $('authLobContainer').style.display = "none";
  }
}

/* ==========================================================================
   CORE CLOUD WORKSPACE ENGINE
   ========================================================================= */
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
  const yyyy = rightNow.getFullYear();
  const mm = String(rightNow.getMonth() + 1).padStart(2, '0');
  const dd = String(rightNow.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;
  
  const metricDocId = `${currentAgentId}-${Date.now()}`;
  const metricRef = doc(firestoreDb, "cases_performance_metrics", metricDocId);

  const getCleanVal = (elementId) => {
    const el = document.getElementById(elementId);
    return el ? el.value.trim() : "";
  };

  const snapshotData = {
    concernType: getCleanVal("concernType"),
    voc:         getCleanVal("voc"),
    subj:        getCleanVal("subj"),
    name:        getCleanVal("name"),
    min:         getCleanVal("min"),
    company:     getCleanVal("company"),
    email:       getCleanVal("email"),
    thread:      getCleanVal("thread"),
    datetime:    getCleanVal("datetime"),
    action:      getCleanVal("action"),
    wocas:       getCleanVal("wocas")
  };

  try {
    await setDoc(metricRef, {
      agent_id: currentAgentId,
      agent_name: currentAgentName,
      lob: currentAgentLob, 
      case_id: caseNumber || "N/A",
      completed_at: rightNow.toISOString(),
      submission_date: dateString,
      snapshot: snapshotData
    });

    const metricDayRef = doc(firestoreDb, "daily_compliance_telemetry", `${currentAgentId}_${dateString}`);
    const isWocas = snapshotData.wocas.length > 0;
    await setDoc(metricDayRef, {
      agent_id: currentAgentId,
      agent_name: currentAgentName,
      lob: currentAgentLob,
      date: dateString,
      cases_logged_count: increment(1),
      wocas_logged_count: isWocas ? increment(1) : increment(0),
      last_activity_at: Date.now()
    }, { merge: true });

  } catch(e) {
    console.warn("Performance metric profiling skipped: ", e);
  }
}

/* ==========================================================================
   SHIFT HISTORY LOGS MANIFEST SYSTEM
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

  let csvContent = "";
  csvContent += "Agent ID\tAgent Name\tLine of Business (LOB)\tTimestamp\tReference Case ID\tDocumentation Raw Text\n";

  globalShiftHistory.forEach((item) => {
    const safeId = item.id.replace(/[\t\n\r]/g, " ").trim();
    const safeTime = item.time.replace(/[\t\n\r]/g, " ").trim();
    const safeText = item.text.replace(/[\t\n\r]/g, " ").trim();
    const safeAgentId = (currentAgentId || 'N/A').trim();
    const safeAgentName = currentAgentName.replace(/[\t\n\r]/g, " ").trim();
    const safeLob = currentAgentLob.trim();

    csvContent += `${safeAgentId}\t${safeAgentName}\t${safeLob}\t${safeTime}\t${safeId}\t${safeText}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/tab-separated-values;charset=utf-8;" });
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0,10);
  
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Agent_Shift_Log_${currentAgentId}_${dateStr}.xls`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  showToast("Shift History workbook generated for Excel!");
}

async function clearShiftHistory() {
  if (!currentAgentId) return;

  showSystemAlert(
    "Flush History Confirmation", 
    "This will completely wipe your cross-station shift history manifest stack from the cloud database profile. Proceeding cannot be undone.",
    true
  );

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
   VOC ENGINE REFERENCE MATRICES (UNIFIED WORKSTATION ARRAYS)
   ========================================================================== */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [{ text: "Check voice service status flags", link: "#" }],
  "SMS CONNECTIVITY": [{ text: "Check SMS provisioning status", link: "#" }],
  "DATA CONNECTIVITY": [{ text: "Check active data sessions", link: "#" }],
  "ROAMING CONNECTIVITY": [{ text: "Verify global routing tags", link: "#" }],
  "COVERAGE CONNECTIVITY": [{ text: "Check tower coverage indexes", link: "#" }]
};

const SHARED_COMMERCIAL_VOC = [
  "APP RELATED", "ACTIVATION", "ADA ENROLLMENT", "APPLICATION REQUIREMENTS", "APPLICATION STATUS", 
  "AVAILMENT OF ADD-ONS", "BALANCE TRANSFER", "BALANCE:ACCOUNT RECONCILIATION", "BALANCE:CLARIFICATION ON BILLED CHARGES", 
  "BALANCE:COLLECTION REMINDER", "BALANCE:NON-RECEIPT OF BILL", "BALANCE:POSTING OF PAYMENT", "BALANCE:PRO-RATA", 
  "BALANCE:REMAINING ALLOCATION", "BALANCE:TOP UP", "BALANCE:UNBILLED", "BAN", "BAR SMS", "BARRING:DATA", 
  "BARRING:LOSS", "BILL DETAILS:DUE DATE/CUTOFF", "BIN ABUSE", "BIN FRAUD", "CHANGE IN BILLING ADDRESS", 
  "CHANGE IN CREDIT LIMIT", "E-SIM", "CHANGE IN CUSTOMER INFORMATION", "CHANGE OF OWNERSHIP", "COVERAGE", 
  "DATA CONNECTIVITY:INTERMITTENT CONNECTION", "DATA CONNECTIVITY:NO CONNECTION", "DATA CONNECTIVITY:SPECIFIC WEBSITE/APPLICATION", 
  "DATA CONNECTIVITY:SLOW CONNECTION", "DEACTIVATION OF FLEXIBUNDLES", "DISCONNECTION", "DISPUTE: MSF CHARGES", 
  "DISPUTE: CALL CHARGES", "DISPUTE:DATA CHARGES", "DISPUTE:SMS CHARGES", "DISPUTE: PCC", "DISPUTE:VAS CHARGES", 
  "FAIR USE POLICY", "FAST DEPLETION", "FLP RESENDING OF LOAD", "HANDSET UNLOCKING", "HOAX CALL/SMS", 
  "HOME PREPAID WIFI", "INABILITY TO CALL THE HOTLINE/SPECIAL NUMBER", "INTERNATIONAL ROAMING- STATUS", 
  "INABILITY TO REGISTER", "LIFTING:DATA", "LIFTING:INCOMING/OUTGOING/DATA", "LIFTING:REDIRECTION", "MENU UPDATE", 
  "MOBILE APPLICATION", "OTHER PROCEDURAL CONCERN", "PASALOAD", "PAYMENT ARRANGEMENT", "PAYMENT CHANNEL", 
  "PLAN DOWNGRADE/UPGRADE", "PLAN INCLUSION", "PRODUCT/PROMO INQUIRY", "PROMO MECHANICS", "PROMO RATES/INCLUSION", 
  "PUK/PIN", "REFUND", "REGISTRATION PROCEDURE", "RELOADING PROCEDURE", "RELOADING:DELAYED CONFIRMATION MESSAGE", 
  "RELOADING:INABILITY TO RELOAD", "RELOADING:MULTIPLE DEDUCTION", "RELOADING:NO CONFIRMATION MESSAGE", 
  "RELOADING:UNCREDITED LOAD", "REPLACEMENT:DEVICE", "REPLACEMENT:SIM", "RETAILER INCENTIVE", "RETENTION", 
  "REWARDS", "SELF CARE CHANNEL", "SERVICE CONTRACT", "SERVICE DOWNTIME:CALL", "SERVICE DOWNTIME:DATA", 
  "SERVICE DOWNTIME:LOADING", "SERVICE DOWNTIME:REGISTRATION", "SERVICE DOWNTIME:SMS", "SERVICE DOWNTIME:VAS", 
  "SIM UPGRADE", "SMS CONNECTIVITY:INCOMING", "SMS CONNECTIVITY:MULTIPLE", "SMS CONNECTIVITY:DELAYED", 
  "SMS CONNECTIVITY:OUTGOING", "SMS CONNECTIVITY:PREMIUM SMS", "SOA:BILL REPRINT", "SOA:E-STATEMENT", 
  "STATUS: ACCOUNT", "SOA:NON RECEIPT/DELAYED", "SUBSCRIBER TAG STATUS:NO SERVICE", "UNBLOCKING OF DEALER/RETAILER SIM", 
  "VAS CANCELLATION", "VAS TECH:VAS CANCELLATION", "VAS TECH:UNABLE TO REGISTER", "VOICE CONNECTIVITY: INCOMING", 
  "VOICE CONNECTIVITY: OUTGOING", "VOICE QUALITY", "BALANCE: AMOUNT TO SETTLE", "DISSATISFACTION", "MNP INQUIRY", 
  "SUCCESSFUL MNP INTERPORT-IN (TO POSTPAID)", "SUCCESSFUL MNP INTERPORT-IN (TO PREPAID)", "SUCCESSFUL MNP INTERPORT-OUT", 
  "SUCCESSFUL MNP INTRAPORT (TO POSTPAID)", "SUCCESSFUL MNP INTRAPORT (TO PREPAID)", "MNP SIM ACTIVATION", 
  "MNP SIM/DEVICE DELIVERY", "UNSUCCESSFUL MNP (POSTPAID)-BILL ISSUES", "UNSUCCESSFUL MNP (PREPAID)-BILL ISSUES", 
  "UNSUCCESSFUL MNP (POSTPAID)–CHANGE OF MIND", "UNSUCCESSFUL MNP (PREPAID)–CHANGE OF MIND", "UNSUCCESSFUL MNP (POSTPAID)-FINANCIAL REASON", 
  "UNSUCCESSFUL MNP (PREPAID)-FINANCIAL REASON", "UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PLAN OFFER", 
  "UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PROMO OFFER", "UNSUCCESSFUL MNP (PREPAID)-UNACCEPTABLE PROMO OFFER", 
  "UNSUCCESSFUL MNP (POSTPAID)-TOOLS ISSUE", "UNSUCCESSFUL MNP (PREPAID)-TOOLS ISSUE", "UNSUCCESSFUL MNP (POSTPAID)–UNDECIDED", 
  "UNSUCCESSFUL MNP (PREPAID)–UNDECIDED", "DISPUTE: DEVICE AMORTIZATION", "VOLTE/VOWIFI ISSUE", "GENERAL INQUIRY", 
  "INTERNATIONAL ROAMING- ACTIVATION", "INTERNATIONAL ROAMING- DEACTIVATION", "SIM REGISTRATION", "SIM REG: SIM VALIDITY EXTENSION", 
  "SIM REG: EXERCISE OF RIGHTS", "SIM REG: BARRING DUE TO LOST/STOLEN SIM", "SIM REG: LIFTING DUE TO FOUND SIM", 
  "SIM REG: BARRING DUE TO DEATH OF OWNER", "SIM REG: TRANSFER OF OWNERSHIP", "SIM REG: DEACTIVATION DUE TO DEATH of OWNER", 
  "SIM REG: PERMANENT DEACTIVATION", "SIM REG: UPDATE NAME", "SIM REG: UPDATE ADDRESS", "SIM REG: UPDATE BIRTHDATE", 
  "SIM REG: UPDATE ID", "SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP", "SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT", 
  "SIM REG: REGULATORY TEMPO DISCON", "SIM REG: RECONNECTION FROM TEMPO DISCON", "DATA CONNECTIVITY- 5G ENHANCEMENT RELATED", 
  "Reconnection from Voluntary TD", "Reconnection from Involuntary TD", "VPD due to Deceased", "Waiver of Reconnection Fee", 
  "Case Management – Billing Dispute", "Customer Account Adjustment", "DISPUTE ON MONETARY", "DISPUTE ON NON MONETARY", 
  "DEFECTIVE SIM", "3G SUNSET/NETWORK ENHANCEMENT", "GENERIC"
];

const VOC_OPTIONS = {
  "Technical": ["VOICE CONNECTIVITY", "SMS CONNECTIVITY", "DATA CONNECTIVITY", "ROAMING CONNECTIVITY", "COVERAGE CONNECTIVITY", "GENERIC"],
  "Aftersales": SHARED_COMMERCIAL_VOC,
  "Inquiry": SHARED_COMMERCIAL_VOC,
  "Complaint": SHARED_COMMERCIAL_VOC
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
    closeBtn.textContent = "Acknowledge & Dismiss";
  };
  closeBtn.addEventListener('click', closeRoutine);
}

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
   SUPERVISOR OPERATIONS PORTAL & TAB-DELINEATED WORKBOOK ENGINE
   ========================================================================== */
function showSupervisorPanel() {
  const panel = $('supervisorAdminPanel');
  if (panel) panel.style.display = "flex";
  const dateEl = $('adminFilterDate');
  if (dateEl) {
    const rightNow = new Date();
    const yyyy = rightNow.getFullYear();
    const mm = String(rightNow.getMonth() + 1).padStart(2, '0');
    const dd = String(rightNow.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }
}

async function executeSupervisorExtraction() {
  try {
    const reportType = $('adminFilterDataType')?.value || "CASES";
    const selectedLobFilter = $('adminFilterLob').value;
    const selectedDateFilter = $('adminFilterDate').value; 

    if (!selectedDateFilter) {
      showSystemAlert("Filter Required", "Please select a Target Run Date before executing a data stream extraction.", true);
      return;
    }

    showToast(`Compiling requested ${reportType.toLowerCase()} records matrix...`);

    let csvContent = "";
    let recordsCount = 0;

    // Strips out tabs and breaks to prevent string cross-contamination
    const clean = (val) => {
      if (val === undefined || val === null || val === "") return "";
      return val.toString().replace(/[\t\n\r]/g, " ").trim();
    };

    /* ==========================================================================
       BRANCH A: TAB-DELIMITED CASES WORKBOOK EXTRACTION
       ========================================================================== */
    if (reportType === "CASES") {
      const performanceRef = collection(firestoreDb, "cases_performance_metrics");
      const q = query(performanceRef, where("submission_date", "==", selectedDateFilter));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        showSystemAlert("Data Void", `No distinct case log submissions found matching target date: [${selectedDateFilter}].`);
        return;
      }

      const logsRef = collection(firestoreDb, "case_logs");
      const logsSnapshot = await getDocs(logsRef);
      const workspaceDetailsMap = {};
      logsSnapshot.forEach(docSnap => {
        workspaceDetailsMap[docSnap.id] = docSnap.data().form_data || {};
      });

      // Headers delimited using literal tab escapes (\t)
      csvContent += "WinID\tAssigned LOB\tConcern Type\tVOC Option\tCase/SR Number\tSubject\tCustomer Name\tMIN\tCompany\tEmail\tThread ID\tDate-Time\tAction Taken\tWOCAS\tLast Sync Timestamp\n";

      snapshot.forEach((docSnap) => {
        const pData = docSnap.data();
        const targetAgentId = pData.agent_id || "N/A";
        const agentLob = pData.lob || "UNKNOWN";
        
        if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

        const itemSnap = pData.snapshot || {};
        const legacyForm = pData.form_data || {};
        const backupScratch = workspaceDetailsMap[targetAgentId] || {};

        const fetchField = (primaryKey, alternateKey = "") => {
          return itemSnap[primaryKey] || 
                 pData[primaryKey] || 
                 legacyForm[primaryKey] || 
                 backupScratch[primaryKey] || 
                 (alternateKey && itemSnap[alternateKey]) ||
                 (alternateKey && backupScratch[alternateKey]) || 
                 "";
        };

        const row = [
          clean(targetAgentId),
          clean(agentLob),
          clean(fetchField("concernType")),
          clean(fetchField("voc")),
          clean(pData.case_id || "N/A"),
          clean(fetchField("subj", "subject")),
          clean(fetchField("name", "customerName")),
          clean(fetchField("min", "mobileNumber")),
          clean(fetchField("company")),
          clean(fetchField("email")),
          clean(fetchField("thread", "threadId")),
          clean(fetchField("datetime", "dateTime")),
          clean(fetchField("action", "actionTaken")),
          clean(fetchField("wocas")),
          clean(pData.completed_at ? new Date(pData.completed_at).toLocaleString() : "N/A")
        ];
        
        csvContent += row.join("\t") + "\n";
        recordsCount++;
      });

    /* ==========================================================================
       BRANCH B: COMPLIANCE METRICS EXTRACTION
       ========================================================================== */
    } else {
      const metricsRef = collection(firestoreDb, "daily_compliance_telemetry");
      const q = query(metricsRef, where("date", "==", selectedDateFilter));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        showSystemAlert("Data Void", `No tracking metrics or portal access events logged on date context: [${selectedDateFilter}].`);
        return;
      }

      csvContent += "WinID\tAgent Name\tLine of Business (LOB)\tTotal Cases Logged\tWOCAS Submissions\tShift Login Frequency\tGraceful Logouts\tUnexpected Drops / System Crashes\tLast Activity Log\n";

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const agentLob = data.lob || "UNKNOWN";

        if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

        const row = [
          clean(data.agent_id || "N/A"),
          clean(data.agent_name || "Unknown"),
          clean(agentLob),
          data.cases_logged_count || 0,
          data.wocas_logged_count || 0,
          data.login_count || 0,
          data.logout_count || 0,
          data.abrupt_disconnect_count || 0,
          clean(data.last_activity_at ? new Date(data.last_activity_at).toLocaleTimeString() : "N/A")
        ];
        
        csvContent += row.join("\t") + "\n";
        recordsCount++;
      });
    }

    if (recordsCount === 0) {
      showSystemAlert("Zero Results", `No operational records matching your [${selectedLobFilter}] selection filter were tracked on this date.`);
      return;
    }

    // Output strictly configured as an Excel-compatible tab-separated stream
    const blob = new Blob([csvContent], { type: "text/tab-separated-values;charset=utf-8;" });
    const link = document.createElement("a");
    const filenameLabel = reportType === "CASES" ? "Detailed_Cases_Workbook" : "Compliance_Telemetry_Report";
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filenameLabel}_[${selectedLobFilter}]_${selectedDateFilter}.xls`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully exported ${recordsCount} ${reportType.toLowerCase()} rows to Excel!`);

  } catch (error) {
    console.error("Supervisor data extraction core workspace error:", error);
    showSystemAlert("Query Interrupted", "Database pipeline rejected structural extraction parameter instructions.");
  }
}

/* ==========================================================================
   CLEAN LOGOUT AND INSTANT RESET OPERATIONS
   ========================================================================== */
function terminateAgentSession() {
  const logoutModal = $('logoutModal');
  const cancelBtn = $('confirmLogoutCancelBtn');
  const confirmBtn = $('confirmLogoutSubmitBtn');

  if (!logoutModal || !cancelBtn || !confirmBtn) {
    executeLogOutRoutine();
    return;
  }

  logoutModal.style.display = "flex";

  const closeLogoutModal = () => {
    logoutModal.style.display = "none";
    cancelBtn.removeEventListener('click', closeLogoutModal);
    confirmBtn.removeEventListener('click', confirmAction);
  };

  const confirmAction = () => {
    logoutModal.style.display = "none";
    cancelBtn.removeEventListener('click', closeLogoutModal);
    confirmBtn.removeEventListener('click', confirmAction);
    executeLogOutRoutine();
  };

  cancelBtn.addEventListener('click', closeLogoutModal);
  confirmBtn.addEventListener('click', confirmAction);
}

async function executeLogOutRoutine() {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  if (currentAgentId) {
    const rightNow = new Date();
    const yyyy = rightNow.getFullYear();
    const mm = String(rightNow.getMonth() + 1).padStart(2, '0');
    const dd = String(rightNow.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    try {
      const metricDayRef = doc(firestoreDb, "daily_compliance_telemetry", `${currentAgentId}_${todayStr}`);
      await setDoc(metricDayRef, {
        logout_count: increment(1),
        last_activity_at: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn("Could not log exit telemetry payload:", e);
    }
  }
  
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
   INITIALIZATION ENGINE & EVENT MOUNT LOOPS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  $('logoutBtn')?.addEventListener('click', terminateAgentSession);
  $('adminExtractSubmitBtn')?.addEventListener('click', executeSupervisorExtraction);

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

  listenToOperationalBroadcasts();
  listenToSessionState();
});

/* ==========================================================================
   REAL-TIME VALIDATORS & REGEX WRAPPERS
   ========================================================================== */
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

/* ==========================================================================
   UNGRACEFUL STABILITY CRASH MONITORING
   ========================================================================== */
window.addEventListener('beforeunload', () => {
  const cachedAgentId = localStorage.getItem("active_agent_session_id");
  if (!cachedAgentId || cachedAgentId.toLowerCase() === "admin" || cachedAgentId.toLowerCase() === "supervisor") return;

  const rightNow = new Date();
  const yyyy = rightNow.getFullYear();
  const mm = String(rightNow.getMonth() + 1).padStart(2, '0');
  const dd = String(rightNow.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  const trackingPayload = {
    agent_id: cachedAgentId,
    date: todayStr,
    event: "ABRUPT_DISCONNECT",
    timestamp: Date.now()
  };

  const existingDropsQueue = JSON.parse(localStorage.getItem("auto_docs_dropped_sessions") || "[]");
  existingDropsQueue.push(trackingPayload);
  localStorage.setItem("auto_docs_dropped_sessions", JSON.stringify(existingDropsQueue));
});

(async function processPendingAbruptDrops() {
  const dropsQueue = JSON.parse(localStorage.getItem("auto_docs_dropped_sessions") || "[]");
  if (dropsQueue.length === 0) return;

  localStorage.removeItem("auto_docs_dropped_sessions");

  for (const drop of dropsQueue) {
    try {
      const targetDocRef = doc(firestoreDb, "daily_compliance_telemetry", `${drop.agent_id}_${drop.date}`);
      await setDoc(targetDocRef, {
        agent_id: drop.agent_id,
        date: drop.date,
        abrupt_disconnect_count: increment(1),
        last_activity_at: drop.timestamp
      }, { merge: true });
    } catch (err) {
      console.warn("Failed to flush background drop telemetry metric:", err);
    }
  }
})();
