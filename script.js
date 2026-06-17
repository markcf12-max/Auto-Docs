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
let isSupervisorAuthenticated = false;
let currentAgentId = null; 
let currentAgentName = "Unknown Agent"; 
let currentAgentLob = "UNKNOWN";        

function $(id) {
  return document.getElementById(id);
}

// Quick helper to get clean ISO date string (YYYY-MM-DD)
function getSystemDateString() {
  return new Date().toISOString().slice(0, 10);
}

/* ==========================================================================
   VOC ENGINE REFERENCE MATRICES (UNIFIED WORKSTATION ARRAYS)
   ========================================================================== */
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
  "SIM REG: BARRING DUE TO DEATH of OWNER", "SIM REG: TRANSFER OF OWNERSHIP", "SIM REG: DEACTIVATION DUE TO DEATH of OWNER", 
  "SIM REG: PERMANENT DEACTIVATION", "SIM REG: UPDATE NAME", "SIM REG: UPDATE ADDRESS", "SIM REG: UPDATE BIRTHDATE", 
  "SIM REG: UPDATE ID", "SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP", "SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT", 
  "SIM REG: REGULATORY TEMPO DISCON", "SIM REG: RECONNECTION FROM TEMPO DISCON", "DATA CONNECTIVITY- 5G ENHANCEMENT RELATIONED", 
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

/* ==========================================================================
   UI STATUS INDICATORS & EXTRAS
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

function updateVocOptions(preserveValue = false) {
  const mainCategory = $("concernType")?.value;
  const vocInput = $("voc");
  const vocDataList = $("vocOptions");
  if (!vocInput || !vocDataList) return;

  const currentVocValue = vocInput.value;
  vocDataList.innerHTML = '';

  if (!mainCategory) {
    vocInput.placeholder = "Choose a Concern Type above first...";
    if (!preserveValue) vocInput.value = '';
    return;
  }

  vocInput.placeholder = "Type to search VOC...";

  if (VOC_OPTIONS[mainCategory]) {
    VOC_OPTIONS[mainCategory].forEach(option => {
      const optEl = document.createElement("option");
      optEl.value = option;
      vocDataList.appendChild(optEl);
    });
  }

  if (preserveValue && currentVocValue) {
    vocInput.value = currentVocValue;
  } else if (!preserveValue) {
    vocInput.value = '';
  }
}

function updateOutput() {
  if (!$("output") || isResetting) return;
  
  if (!currentAgentId || currentAgentId === "SUPERVISOR") {
    $("output").textContent = `CASE/SR VALUE: N/A\nCONCERN TYPE: \nVOC: \n\nSUBJ: \n\nNAME: \nMIN: \nCOMPANY: \nEMAIL: \nTHREAD: \nDATE/TIME: \n\nACTION:\n\n\nWOCAS:\n`;
    return;
  }
  
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

/* ==========================================================================
   DYNAMIC CLOUD PLAYBOOK DISPATCH ENGINE (LIVE DECOUPLED VERSION)
   ========================================================================= */
async function updateSuggestions() {
  const target = $("suggestions");
  if (!target || isResetting) return;
  
  const concern = $("concernType")?.value;
  const voc = $("voc")?.value.trim();
  
  if (!concern) {
    target.innerHTML = "Select Concern & VOC";
    return;
  }

  let html = `<div style="color: #60a5fa; margin-bottom: 8px;"><strong>Operational Matrix Advice:</strong></div>`;

  if (!voc) {
    html += `<i>Choose sub-VOC string to compile live documentation rules...</i>`;
    target.innerHTML = html;
    return;
  }

  target.innerHTML = html + `<div style="color: var(--text-muted); font-style: italic;"><i class="fas fa-spinner fa-spin"></i> Syncing playbook from cloud...</div>`;

  // Safely map slash paths to database document rules
  const cleanDocId = voc.replace(/\//g, "-");

  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data();
      
      // 1. Render the structured workspace guidelines advice + interactive knowledge maps
      let htmlContent = cloudData.htmlContent || "• Follow standard processing vectors designated for this row.";
      
      // If a supervisor attached a hyperlink, append it nicely underneath the advice map
      if (cloudData.hyperlinkUrl && cloudData.hyperlinkUrl.trim() !== "") {
        const label = cloudData.hyperlinkLabel || "Open Related KB Reference / Link";
        htmlContent += `
          <div class="playbook-link-block" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <a href="${cloudData.hyperlinkUrl}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
              <i class="fas fa-external-link-alt"></i> ${label}
            </a>
          </div>`;
      }
      
      target.innerHTML = htmlContent;
      
      // 2. Fetch the template directly from the database snapshot record and inject with the warning sign
      const databaseTemplateText = cloudData.rawSpielText || "";
      updatePlaybookSpiel(concern, voc, databaseTemplateText);
      
      const panel = $('playbookPanel');
      if (panel) {
        panel.classList.add('panel-flash-active');
        setTimeout(() => panel.classList.remove('panel-flash-active'), 600);
      }
    } else {
      // Clean fallback if document doesn't exist in Firestore
      target.innerHTML = html + `• Follow standard processing vectors designated for ${voc}.<br><br><i style="color: var(--text-muted);">Note: Detailed cloud playbook sheet not yet compiled for this row.</i>`;
      updatePlaybookSpiel(concern, voc, ""); // Pass blank if missing to clear the old layout
    }
  } catch (error) {
    console.error("Playbook cloud fetch drop:", error);
    target.innerHTML = html + `❌ <span style="color: #ef4444;">Database sync failure. Using offline standard fallback protocols for ${voc}.</span>`;
  }
}

function updatePlaybookSpiel(concern, voc, cloudTemplateString) {
  const container = $('playbookSpielContainer');
  if (!container) return;

  // If there is no cloud text template registered for this specific selection
  if (!cloudTemplateString || cloudTemplateString.trim() === "") {
    container.innerHTML = `<div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">No standard sample email spiel registered for the selected ${concern || 'N/A'} ➔ ${voc || 'N/A'} vector context.</div>`;
    return;
  }

  const caseNum = $("case")?.value.trim() || "000000";
  const mobileNum = $("min")?.value.trim() || "(MIN)";

  // Parse fields on the dynamic string extracted directly from Firestore
  let fullyCompiledTemplate = cloudTemplateString.replace(/\[Agent Name\]/g, currentAgentName);
  fullyCompiledTemplate = fullyCompiledTemplate.replace(/\[Case Number\]/g, caseNum !== "" ? caseNum : "000000");
  fullyCompiledTemplate = fullyCompiledTemplate.replace(/\[Mobile Number\]/g, mobileNum !== "" ? mobileNum : "(MIN)");

  container.innerHTML = `
    <div style="background: rgba(245, 158, 11, 0.15); border-left: 4px solid #f59e0b; color: #f59e0b; padding: 10px; margin-bottom: 12px; border-radius: 4px; font-size: 12px; font-weight: 600; line-height: 1.4;">
      <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> REMINDER: Customize the sample email if fitted to the concern.
    </div>
    <div style="position: relative; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px;">
      <pre id="playbookRawSpielText" style="margin: 0; white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: var(--text-main); line-height: 1.5;">${fullyCompiledTemplate}</pre>
    </div>
  `;
}

/* ==========================================================================
   STRICT WORKSPACE MANAGEMENT & ISOLATION HOOKS
   ========================================================================== */
function isolateWorkspaceUI(role) {
  const mainWorkspaceLayout = document.querySelector('.layout');
  const viewPlaybooksDrawerBtn = $('drawerToggle');
  const mobileActionDock = document.querySelector('.floating-action-dock');
  const supervisorAdminPanel = $('supervisorAdminPanel'); // Extraction Report Modal
  const supervisorPanel = $('supervisorPanel');           // CMS Portal Panel
  const outputPanel = document.querySelector('.outputPanel'); // Agent Note Output/History Panel
  const playbookPanel = $('playbookPanel');                 // The Interactive Knowledge Map Section

  if (role === "SUPERVISOR") {
    // 1. Keep the workspace layout grid fully visible so the supervisor can view & choose options
    if (mainWorkspaceLayout) mainWorkspaceLayout.style.display = "grid"; 
    
    // 2. Clear paths for interactive playbooks to reveal on command
    if (viewPlaybooksDrawerBtn) viewPlaybooksDrawerBtn.style.display = "flex"; // Changed from block to flex
    if (playbookPanel) playbookPanel.style.display = "block";
    
    // 3. Hide agent-specific functional panels that supervisors don't need
    if (mobileActionDock) mobileActionDock.style.display = "none";
    if (outputPanel) outputPanel.style.display = "none"; // Supervisors don't log cases or copy logs
    
    // 4. Keep the telemetry extraction overlay hidden until explicitly summoned
    if (supervisorAdminPanel) supervisorAdminPanel.style.display = "none";

    // 5. Reveal our integrated CMS Editor panel
    if (supervisorPanel) {
      supervisorPanel.style.display = "block";
    }
  } else {
    // Standard Agent routing logic
    if (mainWorkspaceLayout) mainWorkspaceLayout.style.display = "grid";
    if (viewPlaybooksDrawerBtn) viewPlaybooksDrawerBtn.style.display = "flex"; // Changed from block to flex
    if (playbookPanel) playbookPanel.style.display = "block";
    if (mobileActionDock) mobileActionDock.style.display = "flex";
    if (outputPanel) outputPanel.style.display = "block";
    
    // Ensure all admin/supervisor controls are completely hidden from agents
    if (supervisorAdminPanel) supervisorAdminPanel.style.display = "none";
    if (supervisorPanel) supervisorPanel.style.display = "none";
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
    
    if ($('authNameContainer')) $('authNameContainer').style.display = "flex";
    if ($('authLobContainer')) $('authLobContainer').style.display = "flex";
    if ($('authName')) $('authName').required = true;
    if ($('authLob')) $('authLob').required = true;
  } else {
    currentAuthMode = "LOGIN";
    $('authTitle').textContent = "Agent Workbench Sign In";
    $('authSubtitle').textContent = "Enter your credentials to clear network gateway";
    $('authSubmitBtn').textContent = "Authorize Session";
    $('authToggleAnchor').textContent = "Need a new operational profile? Register here";
    
    if ($('authNameContainer')) $('authNameContainer').style.display = "none";
    if ($('authLobContainer')) $('authLobContainer').style.display = "none";
    if ($('authName')) $('authName').required = false;
    if ($('authLob')) $('authLob').required = false;
  }
}

async function handleAuthSubmission(e) {
  e.preventDefault();
  const agentId = $('authEmail').value.trim();
  const password = $('authPassword').value.trim();
  const fullName = $('authName')?.value.trim().toUpperCase() || "";
  const selectedLob = $('authLob')?.value || "";
  const todayStr = getSystemDateString();

// STABILIZED SUPERVISOR ACCESSIBILITY CHECKER WITH DIRECT PORTAL LOCKDOWN
  if (agentId.toLowerCase() === "admin" || agentId.toLowerCase() === "supervisor") {
    if (password === "SuperOps2026!") {
      currentAgentId = "SUPERVISOR";
      currentAgentName = "Operations Supervisor";
      currentAgentLob = "MANAGEMENT";
      localStorage.setItem("active_agent_session_id", "SUPERVISOR");
      
      // ERASE CREDENTIALS IMMEDIATELY AFTER VALIDS MET TO SECURE THE GATEWAY SCREEN
      $('authEmail').value = "";
      $('authPassword').value = "";
      if ($('authName')) $('authName').value = "";
      
      $('authModal').style.display = "none";
      if ($('logoutBtn')) $('logoutBtn').style.display = "block";
      
      // Directly Route layout to the Extraction Dashboard, avoiding documentation suite
      isolateWorkspaceUI("SUPERVISOR");
      
      // 🎯 THE FIX: Instantly unlock the metrics, turn the badge green, and compile the options!
      if (typeof bypassLockForAuthenticatedSupervisor === "function") {
        bypassLockForAuthenticatedSupervisor();
      }
      
      // showSupervisorPanel(); // Commenting this out prevents it from popping up automatically
      showToast("Supervisor Portal Engaged.");
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
          
          // ERASE CREDENTIALS IMMEDIATELY ON AGENT LOGIN SUCCESS TO SECURE GATEWAY SCREEN
          $('authEmail').value = "";
          $('authPassword').value = "";

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

          isolateWorkspaceUI("AGENT");
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
      currentAuthMode = "LOGIN"; 
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
  if ($('logoutBtn')) $('logoutBtn').style.display = "block";
  updateSyncStatusUI('online');
  
  updateVocOptions(true);
  updateOutput();
  updateSuggestions();
  
  await pullLiveWorkspace();
}

/* ==========================================================================
   👑 SUPERVISOR MATRIX MANAGER MODULE FUNCTIONS
   ========================================================================== */

function bypassLockForAuthenticatedSupervisor() {
  // 1. Establish permission verification variable state
  isSupervisorAuthenticated = true;
  
  const badge = document.getElementById("authBadge");
  if (badge) {
    badge.innerText = "SYSTEM ADMIN ACTIVE";
    badge.style.background = "#10b981";
  }
  
  const container = document.getElementById("supervisorContent");
  if (container) {
    container.style.display = "block";
    container.style.opacity = "1";
  }
  
  // 2. Build the structural categories list into the first dropdown
  initializeSupervisorDropdowns();
  
  const supeConcernDropdown = document.getElementById("supeConcern");
  const supeVocDropdown = document.getElementById("supeVoc");

  // 3. 🎯 LINK THE CATEGORY CHANGE EVENT SECURELY IN JAVASCRIPT
  if (supeConcernDropdown) {
    supeConcernDropdown.addEventListener("change", () => {
      syncSupervisorVocDropdown();
      loadCurrentVocMasterData();
    });
  }

  // 4. 🎯 LINK THE VOC RECONCILIATION SELECTION STRAIGHT TO FIRESTORE READ ENGINE
  if (supeVocDropdown) {
    supeVocDropdown.addEventListener("change", () => {
      loadCurrentVocMasterData();
    });
  }
  
  // 5. Connect primary agent Concern Type choices to reflect in CMS dashboard row automatically
  const primaryConcernDropdown = $("concernType");
  if (primaryConcernDropdown) {
    primaryConcernDropdown.addEventListener("change", (e) => {
      if (supeConcernDropdown) {
        supeConcernDropdown.value = e.target.value;
        syncSupervisorVocDropdown();
        loadCurrentVocMasterData();
      }
    });
  }

  // 6. Connect primary agent VOC manual selections to reflect in CMS inputs
  const primaryVocInput = $("voc");
  if (primaryVocInput) {
    primaryVocInput.addEventListener("input", (e) => {
      const selectedVocValue = e.target.value.trim();
      if (!supeVocDropdown) return;

      const primaryConcernVal = primaryConcernDropdown ? primaryConcernDropdown.value : "";
      if (primaryConcernVal && supeConcernDropdown && supeConcernDropdown.value !== primaryConcernVal) {
        supeConcernDropdown.value = primaryConcernVal;
        syncSupervisorVocDropdown();
      }

      const optionExists = Array.from(supeVocDropdown.options).some(opt => opt.value === selectedVocValue);
      if (optionExists && selectedVocValue !== "") {
        supeVocDropdown.value = selectedVocValue;
        loadCurrentVocMasterData();
      }
    });
  }

  // 7. 🚀 LINK THE PUBLISH BUTTON SECURELY TO THE FIRESTORE WRITE ENGINE
  const supePublishBtn = document.getElementById("supePublishBtn");
  if (supePublishBtn) {
    supePublishBtn.addEventListener("click", () => {
      saveMasterPlaybookConfiguration();
    });
  }

  // 8. ⚡ INSTANT UNLOCK: Force the options and live active data to populate immediately 
  // so the supervisor doesn't have to hit refresh to see the portal contents!
  syncSupervisorVocDropdown();
  loadCurrentVocMasterData();
}
function initializeSupervisorDropdowns() {
  const supeConcern = document.getElementById("supeConcern");
  if (!supeConcern) return;
  
  supeConcern.innerHTML = `
    <option value="">-- Choose Category --</option>
    <option value="Technical">Technical</option>
    <option value="Aftersales">Aftersales</option>
    <option value="Inquiry">Inquiry</option>
    <option value="Complaint">Complaint</option>
  `;
}

function syncSupervisorVocDropdown() {
  const concernVal = document.getElementById("supeConcern").value;
  const supeVoc = document.getElementById("supeVoc");
  if (!supeVoc) return;

  // Make sure your global VOC_OPTIONS constant dictionary exists and is accessible
  if (!concernVal || !VOC_OPTIONS || !VOC_OPTIONS[concernVal]) {
    supeVoc.innerHTML = '<option value="">-- Select Concern First --</option>';
    return;
  }

  const optionsList = VOC_OPTIONS[concernVal];
  supeVoc.innerHTML = optionsList.map(v => `<option value="${v}">${v}</option>`).join("");
  
  loadCurrentVocMasterData();
}

// ==========================================
// CHANNEL A: SYSTEM MASTER SUPERVISOR INPUTS ONLY
// ==========================================
async function loadCurrentVocMasterData() {
  // Directly point ONLY to supervisor editor fields
  const targetVoc = document.getElementById("supeVoc")?.value;
  const htmlInput = document.getElementById("supeHtmlContent");
  const urlInput = document.getElementById("supeUrl");
  const labelInput = document.getElementById("supeLabel");
  const spielInput = document.getElementById("supeSpielText");
  
  const suggestionsContainer = document.getElementById("suggestions");
  const spielContainer = document.getElementById("playbookSpielContainer");
  
  if (!targetVoc) return;

  const cleanDocId = targetVoc.replace(/\//g, "-");
  
  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      
      // 1. Populate Supervisor Edit Panel
      if(htmlInput) htmlInput.value = data.htmlContent || "";
      if(urlInput) urlInput.value = data.hyperlinkUrl || "";
      if(labelInput) labelInput.value = data.hyperlinkLabel || "";
      if(spielInput) spielInput.value = data.rawSpielText || "";

      // 2. Mirror live view layout to the drawer preview cards simultaneously
      if (suggestionsContainer) {
        const advice = data.htmlContent || "No operational advice available for this item.";
        const url = data.hyperlinkUrl || "";
        const label = data.hyperlinkLabel || "Open Related KB Reference / Link";

        let htmlContent = `<div class="playbook-advice-block"><p style="line-height: 1.5; white-space: pre-line; color: #f8fafc; margin: 0;">${advice}</p></div>`;
        if (url && url.trim() !== "") {
          htmlContent += `
            <div class="playbook-link-block" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
              <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
                <i class="fas fa-external-link-alt"></i> ${label}
              </a>
            </div>`;
        }
        suggestionsContainer.innerHTML = htmlContent;
      }

      if (spielContainer) {
        const templateText = data.rawSpielText || "";
        spielContainer.innerHTML = templateText && templateText.trim() !== "" ? `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px; margin-top: 8px;">
            <pre id="spielTextElement" style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; color: #cbd5e1; max-height: 200px; overflow-y: auto; line-height: 1.4;">${templateText}</pre>
          </div>` : `<div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">The corresponding email spiel template will load automatically upon context verification.</div>`;
      }
    } else {
      if(htmlInput) htmlInput.value = "";
      if(urlInput) urlInput.value = "";
      if(labelInput) labelInput.value = "";
      if(spielInput) spielInput.value = "";
    }
  } catch (err) {
    console.error("Supervisor data pull exception:", err);
  }
}

// ==========================================
// CHANNEL B: ISOLATED LIVE AGENT PLAYBOOK READER
// ==========================================
async function loadCurrentVocMasterDataForAgent() {
  // Completely ignore supervisor elements to prevent background locks!
  const agentConcern = document.getElementById("concernType")?.value || $('concernType')?.value;
  const agentVoc = document.getElementById("voc")?.value || $('voc')?.value;
  const suggestionsContainer = document.getElementById("suggestions");
  const spielContainer = document.getElementById("playbookSpielContainer");
  
  if (!suggestionsContainer) return;

  // 🎯 FIX 1: If either field is empty, actively reset the panel layout state instead of exiting silently
  if (!agentConcern || agentConcern.trim() === "" || !agentVoc || agentVoc.trim() === "") {
    suggestionsContainer.innerHTML = "Select Concern & VOC to view matrix playbook options...";
    if (spielContainer) {
      spielContainer.innerHTML = `
        <div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">
          The corresponding email spiel template will load automatically upon context verification.
        </div>`;
    }
    return;
  }

  const cleanDocId = agentVoc.replace(/\//g, "-");
  
  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      
      // Update Agent Drawer UI View ONLY
      const advice = data.htmlContent || "No operational advice available for this item.";
      const url = data.hyperlinkUrl || "";
      const label = data.hyperlinkLabel || "Open Related KB Reference / Link";

      let htmlContent = `<div class="playbook-advice-block"><p style="line-height: 1.5; white-space: pre-line; color: #f8fafc; margin: 0;">${advice}</p></div>`;
      if (url && url.trim() !== "") {
        htmlContent += `
          <div class="playbook-link-block" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
              <i class="fas fa-external-link-alt"></i> ${label}
            </a>
          </div>`;
      }
      suggestionsContainer.innerHTML = htmlContent;

      if (spielContainer) {
        const templateText = data.rawSpielText || "";
        spielContainer.innerHTML = templateText && templateText.trim() !== "" ? `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px; margin-top: 8px;">
            <pre id="spielTextElement" style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; color: #cbd5e1; max-height: 200px; overflow-y: auto; line-height: 1.4;">${templateText}</pre>
          </div>` : `<div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">The corresponding email spiel template will load automatically upon context verification.</div>`;
      }
    } else {
      // 🎯 FIX 2: Gracefully handle mismatched categories
      suggestionsContainer.innerHTML = `<div style="padding: 10px; color: #94a3b8; font-style: italic;">No active matrix playbook found for "${agentVoc}".</div>`;
      if (spielContainer) spielContainer.innerHTML = "";
    }
  } catch (err) {
    console.error("Agent playbook background read failed silently:", err);
  }
}

async function saveMasterPlaybookConfiguration() {
  if (!isSupervisorAuthenticated) return;

  const targetVoc = document.getElementById("supeVoc").value;
  const targetHtml = document.getElementById("supeHtmlContent")?.value.trim();
  const targetUrl = document.getElementById("supeUrl")?.value.trim();
  const targetLabel = document.getElementById("supeLabel")?.value.trim();
  const targetSpiel = document.getElementById("supeSpielText")?.value;

  if (!targetVoc) {
    alert("❌ Please select a valid target VOC matrix path profile.");
    return;
  }
  if (!targetHtml) {
    alert("❌ Operational Matrix Advice guidelines cannot remain blank.");
    return;
  }

  const cleanDocId = targetVoc.replace(/\//g, "-");
  
  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    
// Ensure your updateData block handles empty fields perfectly like this:
const updateData = {
  htmlContent: targetHtml || "",
  rawSpielText: targetSpiel || "",
  hyperlinkUrl: targetUrl || "",
  hyperlinkLabel: targetUrl.trim() !== "" && (!targetLabel || targetLabel.trim() === "") 
    ? "Open Related KB Reference / Link" 
    : (targetLabel || "")
};

    await setDoc(docRef, updateData, { merge: true });
    alert(`🎉 Success! Master playbook entry for "${targetVoc}" updated globally.`);
    
    if (typeof updateSuggestions === "function") {
      updateSuggestions();
    }
  } catch (err) {
    console.error("Firestore database master layout write block:", err);
    alert("❌ Database Write Failure: Ensure write permissions are granted.");
  }
}

function listenToSessionState() {
  const cachedId = localStorage.getItem("active_agent_session_id");
  
  document.querySelectorAll("input, textarea").forEach(el => {
    // 🎯 FIXED: Explicitly protect authentication AND supervisor configuration fields from being wiped!
    const isAuthField = el.id === 'authEmail' || el.id === 'authPassword' || el.id === 'authName';
    
    // 🎯 UPDATED: Added broadcastTextInput to the ironclad protection array!
    const isSupeField = (
      el.id === 'supeHtmlContent' || 
      el.id === 'supeUrl' || 
      el.id === 'supeLabel' || 
      el.id === 'supeSpielText' ||
      el.id === 'broadcastTextInput'
    );

    if (!isAuthField && !isSupeField) {
      el.value = "";
      el.classList.remove('val-green', 'val-amber', 'val-crimson');
    }
  });

  const select = $("concernType");
  if (select) select.selectedIndex = 0;
  updateVocOptions(false);
  globalShiftHistory = [];

  if (cachedId) {
    currentAgentId = cachedId;
    if (cachedId === "SUPERVISOR") {
      currentAgentName = "Operations Supervisor";
      currentAgentLob = "MANAGEMENT";
      
      // 1. Configure the workspace views for supervisor actions
      isolateWorkspaceUI("SUPERVISOR");
      
      if ($('authModal')) $('authModal').style.display = "none";
      if ($('logoutBtn')) $('logoutBtn').style.display = "block";
      
      // 2. Instantly unlock the Matrix Editor panel and sync UI parameters
      bypassLockForAuthenticatedSupervisor();
      
      // Update system status badge to show online
      if (typeof updateSyncStatusUI === "function") {
        updateSyncStatusUI('online');
      }
      return;
    }
    
    isolateWorkspaceUI("AGENT");
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
    isolateWorkspaceUI("AGENT");
    showLoginGateway(false);
    updateOutput();
    if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
    const spielPanel = $('playbookSpielContainer');
    if (spielPanel) spielPanel.innerHTML = "";
    renderHistoryView();
  }
}

function showLoginGateway(isRegisterMode = false) {
  $('authModal').style.display = "flex";
  if ($('logoutBtn')) $('logoutBtn').style.display = "none";
  
  // Clear credential entry containers cleanly on displaying the gateway view
  $('authEmail').value = "";
  $('authPassword').value = "";
  if ($('authName')) $('authName').value = "";

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
  if (isResetting || !currentAgentId || currentAgentId === "SUPERVISOR") return; 
  if (saveTimeout) clearTimeout(saveTimeout);

  const executeSave = async () => {
    updateSyncStatusUI('saving');
    const data = {};
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.id && el.id !== 'authEmail' && el.id !== 'authPassword' && el.id !== 'authName') {
        data[el.id] = el.value;
      }
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
  if (!currentAgentId || currentAgentId === "SUPERVISOR") return;

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
          if (el && id !== 'authEmail' && id !== 'authPassword' && id !== 'authName') {
            el.value = savedFormState[id];
          }
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

// 🚀 DEPLOY LIVE BROADCAST TO ALL AGENT TERMINALS (UPDATED TO MATCH SYSTEM_MANAGEMENT)
async function executeLiveBroadcastPublish() {
  const message = $('broadcastTextInput').value.trim();
  // Note: Your current agent banner doesn't handle severity background shifts yet,
  // but we pass it anyway in case you want to style it later!
  const severity = $('broadcastSeveritySelect').value; 

  if (!message) {
    showSystemAlert("Empty Message", "Please input text content before initiating a live system broadcast.");
    return;
  }

  try {
    // 🎯 TARGET MATCHED: Writing directly to the document your agents are streaming!
    const broadcastRef = doc(firestoreDb, "system_management", "broadcast_alerts");
    await setDoc(broadcastRef, {
      message: message,
      active: true, // 🎯 FIELD MATCHED: Sets data.active to true
      severity: severity,
      broadcasted_by: currentAgentName || "Operations Supervisor",
      updated_at: Date.now()
    }, { merge: true }); // Merge ensures we don't accidentally blow away other hidden system settings

    showToast("Live operational broadcast deployed successfully!");
  } catch (error) {
    console.error("Broadcast deployment error:", error);
    showSystemAlert("Database Sync Failure", "Failed to push announcement payload to agents.");
  }
}

// 🧼 WIPE THE ACTIVE BROADCAST FROM ALL AGENT SCREENS INSTANTLY
async function executeClearActiveBroadcast() {
  try {
    // 🎯 TARGET MATCHED: Tells the agent listener to shut down the display toggle
    const broadcastRef = doc(firestoreDb, "system_management", "broadcast_alerts");
    await setDoc(broadcastRef, {
      message: "",
      active: false, // 🎯 FIELD MATCHED: Triggers the else clause to hide banner
      updated_at: Date.now()
    }, { merge: true });

    $('broadcastTextInput').value = "";
    showToast("Active system broadcast terminated.");
  } catch (error) {
    console.error("Broadcast termination error:", error);
    showSystemAlert("Database Sync Failure", "Failed to clear the active broadcast banner.");
  }
}

/* ==========================================================================
   ANALYTICS & OPERATIONAL METRICS COMPILATION ROUTINES
   ========================================================================== */
async function logCaseSubmissionToAnalytics(caseNumber) {
  if (!currentAgentId || currentAgentId === "SUPERVISOR") return;

  const dateString = getSystemDateString();
  const metricDocId = `${currentAgentId}-${Date.now()}`;
  const metricRef = doc(firestoreDb, "cases_performance_metrics", metricDocId);

  const getCleanVal = (elementId) => {
    const el = document.getElementById(elementId);
    return el ? el.value.trim() : "";
  };

  const snapshotData = {
    concernType: getCleanVal("concernType"),
    voc:         getCleanVal("voc"),
    case:        getCleanVal("case"),
    subj:        getCleanVal("subj"),
    name:        getCleanVal("name"),
    min:         getCleanVal("min"),
    company:     getCleanVal("company"),
    email:       getCleanVal("email"),
    thread:      getCleanVal("thread"),
    datetime:     getCleanVal("datetime"),
    action:      getCleanVal("action"),
    wocas:       getCleanVal("wocas")
  };

  try {
    await setDoc(metricRef, {
      agent_id: currentAgentId,
      agent_name: currentAgentName,
      lob: currentAgentLob, 
      case_id: caseNumber || getCleanVal("case") || "N/A",
      completed_at: new Date().toISOString(),
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
   SHIFT HISTORY MANIFEST SYSTEM
   ========================================================================== */
async function pushToHistory(caseNumber, textContent) {
  if (!currentAgentId || currentAgentId === "SUPERVISOR") return;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = caseNumber ? caseNumber.trim().toUpperCase() : "N/A";

  if (globalShiftHistory.length > 0 && globalShiftHistory[0].text === textContent) return;

  const newLog = { id: displayId, time: timestamp, text: textContent };
  globalShiftHistory.unshift(newLog);
  if (globalShiftHistory.length > 50) globalShiftHistory.pop(); 

  try {
    const docRef = doc(firestoreDb, "case_logs", currentAgentId);
    await updateDoc(docRef, { shift_manifest: globalShiftHistory });
    await logCaseSubmissionToAnalytics(displayId);
  } catch (err) {
    console.error("Error committing shift log token:", err);
  }

  await renderHistoryView();
  updateFloatingBanner();
}

async function deleteHistoryItem(index) {
  if (!currentAgentId || currentAgentId === "SUPERVISOR") return;

  globalShiftHistory.splice(index, 1);

  try {
    const docRef = doc(firestoreDb, "case_logs", currentAgentId);
    await updateDoc(docRef, { shift_manifest: globalShiftHistory });
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
        <button type="button" data-action="recopy" data-index="${index}" style="background: transparent; color: #60a5fa; border: 1px solid rgba(96,165,250,0.4); padding: 2px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
          Recopy
        </button>
        <button type="button" data-action="delete" data-index="${index}" title="Delete Entry" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 3px; font-size: 11px; cursor: pointer;">
          <i class="fas fa-trash-alt" style="pointer-events: none;"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function loadHistoryItem(index) {
  if (!globalShiftHistory[index]) return;
  navigator.clipboard.writeText(globalShiftHistory[index].text);
  showToast(`Recopied Case ID: ${globalShiftHistory[index].id} from History Stack!`);
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

function updateFloatingBanner() {
  const banner = $('floatingShiftBanner');
  if (!banner) return;
  const historyCount = globalShiftHistory.length;
  
  if (currentAgentId === "SUPERVISOR") {
    banner.style.background = "#3b82f6"; 
    banner.style.color = "#ffffff";
    banner.innerHTML = `<i class="fas fa-user-shield"></i> SUPERVISOR PORTAL INSTANCE ACTIVE | SECTOR LINK COMPLETED`;
  } else {
    banner.style.background = "#fbbf24"; 
    banner.style.color = "#1e293b";
    banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> LIVE OPERATIONS CHANNEL | ACTIVE MANIFEST ITEMS TRACKED IN CLOUD: (${historyCount})`;
  }
}

/* ==========================================================================
   AGENT SHIFT LOG HISTORY TEXT FILE (.TXT) EXPORT ROUTINE
   ========================================================================== */
async function downloadHistoryLog() {
  if (globalShiftHistory.length === 0) {
    showToast("No history data to download yet!", true);
    return;
  }

  const rightNow = new Date();
  const options = { year: 'numeric', month: 'short', day: '2-digit' };
  const currentCalendarDate = rightNow.toLocaleDateString('en-US', options);

  let textContent = `==================================================\n`;
  textContent += `OFFICIAL AGENT SHIFT HISTORY MANIFEST\n`;
  textContent += `==================================================\n`;
  textContent += `Extract Date    : ${currentCalendarDate}\n`;
  textContent += `Agent ID / WinID: ${currentAgentId || 'N/A'}\n`;
  textContent += `Agent Name      : ${currentAgentName}\n`;
  textContent += `Designated LOB  : ${currentAgentLob}\n`;
  textContent += `Total Records   : ${globalShiftHistory.length}\n`;
  textContent += `==================================================\n\n`;

  globalShiftHistory.forEach((item, idx) => {
    textContent += `--------------------------------------------------\n`;
    textContent += `LOG ITEM #${idx + 1} | TIMESTAMP: ${item.time} | CASE/SR: ${item.id}\n`;
    textContent += `--------------------------------------------------\n`;
    textContent += `${item.text}\n\n`;
  });

  textContent += `==================================================\n`;
  textContent += `END OF MANIFEST WRAPPER\n`;
  textContent += `==================================================\n`;

  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const dateStr = rightNow.toISOString().slice(0,10);
  
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Agent_Shift_Log_${currentAgentId}_${dateStr}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Shift History text report compiled successfully!");
}

function clearShiftHistory() {
  if (!currentAgentId || currentAgentId === "SUPERVISOR") return;

  showSystemAlert(
    "Flush History Confirmation", 
    "This will completely wipe your cross-station shift history manifest stack from the cloud database profile. Proceeding cannot be undone.",
    true
  );

  const closeBtn = $('alertModalCloseBtn');
  if (!closeBtn) return;
  
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
   ALERTS, TOASTS & UTILS
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

  if (isWarning) {
    if (iconBox) iconBox.style.background = "rgba(239, 68, 68, 0.1)";
    if (iconBox) iconBox.style.color = "#ef4444";
    if (icon) icon.className = "fas fa-exclamation-circle";
    if (closeBtn) closeBtn.style.background = "#2563eb"; 
  } else {
    if (iconBox) iconBox.style.background = "rgba(16, 185, 129, 0.1)";
    if (iconBox) iconBox.style.color = "#10b981";
    if (icon) icon.className = "fas fa-check-circle";
    if (closeBtn) closeBtn.style.background = "#10b981";
  }

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  modal.style.display = "flex";

  const closeRoutine = () => {
    modal.style.display = "none";
    if (closeBtn) {
      closeBtn.removeEventListener('click', closeRoutine);
      closeBtn.textContent = "Acknowledge & Dismiss";
    }
  };
  if (closeBtn) closeBtn.addEventListener('click', closeRoutine);
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
  
  const label = $('toastMessage');
  if (label) label.textContent = msg;
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

/* ==========================================================================
   SUPERVISOR OPERATIONS PORTAL WITH DATE RANGE FILTERS (.CSV)
   ========================================================================== */
function showSupervisorPanel() {
  const panel = $('supervisorAdminPanel');
  if (panel) panel.style.display = "flex";
  
  const startDateEl = $('adminFilterStartDate');
  const endDateEl = $('adminFilterEndDate');
  
  if (startDateEl && endDateEl) {
    const todayStr = getSystemDateString();
    startDateEl.value = todayStr;
    endDateEl.value = todayStr;
  }
}

async function executeSupervisorExtraction() {
  try {
    const reportType = $('adminFilterDataType')?.value || "CASES";
    const selectedLobFilter = $('adminFilterLob')?.value || "ALL";
    const startDateFilter = $('adminFilterStartDate')?.value || ""; 
    const endDateFilter = $('adminFilterEndDate')?.value || ""; 

    if (!startDateFilter || !endDateFilter) {
      showSystemAlert("Parameter Under-specified", "Supervisors must define both Start and End boundary parameters.");
      return;
    }

    showToast(`Deep Scanning metrics partition query range...`);

    let csvContent = "";
    let recordsCount = 0;

    const cleanValue = (val) => {
      if (val === undefined || val === null || val === "") return "";
      let str = val.toString().replace(/[\n\r\t]/g, " ").trim();
      if (str.includes(",") || str.includes('"')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    if (reportType === "CASES") {
      const performanceRef = collection(firestoreDb, "cases_performance_metrics");
      
      const q = query(
        performanceRef, 
        where("submission_date", ">=", startDateFilter), 
        where("submission_date", "<=", endDateFilter),
        orderBy("submission_date", "desc")
      );

      let performanceSnapshot;
      try {
        performanceSnapshot = await getDocs(q);
      } catch (indexError) {
        console.warn("Composite Index missing/unoptimized. Falling back to clean scan partition model...", indexError);
        const fallbackQuery = query(performanceRef, where("submission_date", ">=", startDateFilter), where("submission_date", "<=", endDateFilter));
        performanceSnapshot = await getDocs(fallbackQuery);
      }
      
      if (performanceSnapshot.empty) {
        console.warn("Targeted history range void. Scanning global active workspace drafts...");
        const backupRef = collection(firestoreDb, "case_logs");
        const backupSnap = await getDocs(backupRef);
        
        if (backupSnap.empty) {
          showSystemAlert("Data Void", "No records found in historical logs or real-time workspaces.");
          return;
        }
        
        csvContent += "Draft Log Doc ID,Agent ID/WinID,Last Active Case Target,Action Taken,WOCAS Notes,Thread ID,Customer Name,Concern Type,MIN / Mobile,Date-Time Field,Company,Email Address,Subject,VOC Selection\n";
        
        backupSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const snap = d.form_data || d || {};
          
          csvContent += [
            cleanValue(docSnap.id), cleanValue(d.agent_id),
            cleanValue(d.case_number || snap.case || snap.field_case || "BLANK DRAFT"),
            cleanValue(snap.action       || snap.field_action       || "BLANK DRAFT"),
            cleanValue(snap.wocas        || snap.field_wocas        || "BLANK DRAFT"),
            cleanValue(snap.thread       || snap.field_thread       || "BLANK DRAFT"),
            cleanValue(snap.name         || snap.field_name         || "BLANK DRAFT"),
            cleanValue(snap.concernType  || snap.field_concernType  || "BLANK DRAFT"),
            cleanValue(snap.min          || snap.field_min          || "BLANK DRAFT"),
            cleanValue(snap.datetime     || snap.field_datetime     || "BLANK DRAFT"),
            cleanValue(snap.company      || snap.field_company      || "BLANK DRAFT"),
            cleanValue(snap.email        || snap.field_email        || "BLANK DRAFT"),
            cleanValue(snap.subj         || snap.field_subj         || "BLANK DRAFT"),
            cleanValue(snap.voc          || snap.field_voc          || "BLANK DRAFT")
          ].join(",") + "\n";
          
          recordsCount++;
        });
      } else {
        csvContent += "Agent ID,Agent Name,Line of Business,Case/SR,Completed Timestamp,Action Taken,WOCAS Notes,Thread ID,Customer Name,Concern Type,MIN / Mobile,Date-Time Field,Company,Email Address,Subject,VOC Selection\n";

        performanceSnapshot.forEach((docSnap) => {
          const rawDoc = docSnap.data();
          const agentLob = rawDoc.lob || "UNKNOWN";

          if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

          const snap = rawDoc.snapshot || rawDoc.form_data || rawDoc || {};
          const isLegacyFlatRecord = !rawDoc.snapshot && !rawDoc.form_data && !rawDoc.action && !rawDoc.wocas;
          const fallbackString = isLegacyFlatRecord ? "No Log" : "N/A";

          csvContent += [
            cleanValue(rawDoc.agent_id), cleanValue(rawDoc.agent_name || "No Log"), cleanValue(agentLob),
            cleanValue(rawDoc.case_id || snap.case || snap.field_case || "N/A"),
            cleanValue(rawDoc.completed_at || rawDoc.updated_at || "N/A"),
            cleanValue(snap.action       || snap.field_action       || fallbackString),
            cleanValue(snap.wocas        || snap.field_wocas        || fallbackString),
            cleanValue(snap.thread       || snap.field_thread       || fallbackString),
            cleanValue(snap.name         || snap.field_name         || fallbackString),
            cleanValue(snap.concernType  || snap.field_concernType  || fallbackString),
            cleanValue(snap.min          || snap.field_min          || fallbackString),
            cleanValue(snap.datetime     || snap.field_datetime     || fallbackString),
            cleanValue(snap.company      || snap.field_company      || fallbackString),
            cleanValue(snap.email        || snap.field_email        || fallbackString),
            cleanValue(snap.subj         || snap.field_subj         || fallbackString),
            cleanValue(snap.voc          || snap.field_voc          || fallbackString)
          ].join(",") + "\n";
          recordsCount++;
        });
      }
    } else {
      const metricsRef = collection(firestoreDb, "daily_compliance_telemetry");
      
      const q = query(
        metricsRef, 
        where("date", ">=", startDateFilter), 
        where("date", "<=", endDateFilter)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        showSystemAlert("Data Void", "No timeline compliance telemetry rows match this date range query.");
        return;
      }

      csvContent += "WinID,Agent Name,Line of Business (LOB),Total Cases Logged,WOCAS Submissions,Shift Login Frequency,Graceful Logouts,Unexpected Drops / System Crashes,Last Activity Log\n";

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const agentLob = data.lob || "UNKNOWN";

        if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

        csvContent += [
          cleanValue(data.agent_id), cleanValue(data.agent_name), cleanValue(agentLob),
          data.cases_logged_count || 0, data.wocas_logged_count || 0, data.login_count || 0, data.logout_count || 0, data.abrupt_disconnect_count || 0,
          cleanValue(data.last_activity_at ? new Date(data.last_activity_at).toLocaleTimeString() : "N/A")
        ].join(",") + "\n";
        recordsCount++;
      });
    }

    if (recordsCount === 0) {
      showSystemAlert("Zero Results", "No system records matched your composite structural filters.");
      return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filenameLabel = reportType === "CASES" ? "Range_Cases_Workbook" : "Range_Telemetry_Report";
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filenameLabel}_${selectedLobFilter}_from_${startDateFilter}_to_${endDateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully extracted ${recordsCount} range items!`);

  } catch (error) {
    console.error("CRITICAL EXTRACTION PIPELINE FAILURE:", error);
    showSystemAlert("Extraction Error", `Pipeline processing broke: ${error.message}`);
  }
}

/* ==========================================================================
   RESET & LOGOUT UTILITIES
   ========================================================================== */
function terminateAgentSession() {
  const logoutModal = $('logoutModal');
  const cancelBtn = $('confirmLogoutCancelBtn');
  const confirmBtn = $('confirmLogoutSubmitBtn');

  if (currentAgentId === "SUPERVISOR") {
    executeLogOutRoutine();
    return;
  }

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
  
  if (typeof terminateSupervisorSession === "function") {
    terminateSupervisorSession();
  }

  if (currentAgentId && currentAgentId !== "SUPERVISOR") {
    const todayStr = getSystemDateString();
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
  
  currentAgentId = null;
  currentAgentName = "Unknown Agent";
  currentAgentLob = "UNKNOWN";
  
  isolateWorkspaceUI("AGENT"); 
  showLoginGateway(false);
  updateOutput();
  
  if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
  const spielPanel = $('playbookSpielContainer');
  if (spielPanel) spielPanel.innerHTML = "";
  
  renderHistoryView();
  showToast("Session closed safely. Workspace locked.");

  window.location.reload();
}

async function resetForm(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  isResetting = true; 

  try {
    document.querySelectorAll("input, textarea").forEach(el => {
      if (el.id !== 'authEmail' && el.id !== 'authPassword' && el.id !== 'authName') {
        el.value = "";
        el.classList.remove('val-green', 'val-amber', 'val-crimson');
      }
    });

    const select = $("concernType");
    if (select) select.selectedIndex = 0;
    updateVocOptions(false);
    
    updateOutput();
    if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
    const spielPanel = $('playbookSpielContainer');
    if (spielPanel) spielPanel.innerHTML = "";

    if (currentAgentId && currentAgentId !== "SUPERVISOR") {
      const docRef = doc(firestoreDb, "case_logs", currentAgentId);
      await setDoc(docRef, { form_data: {} }, { merge: true });
    }
    
    showToast("Active workspace cleared.");
  } catch(e) {
    console.error("Cloud database reset exception:", e);
    showToast("Error clearing cloud form properties.", true);
  } finally {
    isResetting = false; 
    updateOutput();
  }
}

/* ==========================================================================
   INITIALIZATION ENGINE & LOOPS
/* ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  
  $('logoutBtn')?.addEventListener('click', executeLogOutRoutine);
  $('adminExtractSubmitBtn')?.addEventListener('click', executeSupervisorExtraction);

  $('publishBroadcastBtn')?.addEventListener('click', executeLiveBroadcastPublish);
  $('clearBroadcastBtn')?.addEventListener('click', executeClearActiveBroadcast);
  $('supePublishBtn')?.addEventListener('click', saveMasterPlaybookConfiguration);

  $('authBadge')?.addEventListener('click', () => {
    if (currentAgentId !== "SUPERVISOR") {
      const loginModal = $('authModal');
      if (loginModal) loginModal.style.display = "flex";
    }
  });

  $('closeTelemetryBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const telemetryContainer = document.getElementById("supervisorAdminPanel") || $('supervisorAdminPanel');
    if (telemetryContainer) {
      telemetryContainer.style.display = "none";
    }
  });

  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true);
  }

  // 🎯 CORE CONFIG: Permanent Upper-Left Pulsing Orb Integration
  const pulsingOrb = document.getElementById('upperLeftPulsingOrb') || $('upperLeftPulsingOrb');
  if (pulsingOrb) {
    const orbIcon = pulsingOrb.querySelector('i');
    if (orbIcon) {
      orbIcon.className = "fas fa-folder-open";
    }
    
    // Set the initial visual state to indicate an unread shift status deck
    pulsingOrb.className = "meta-orb-trigger login-unread";
    
    pulsingOrb.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDrawer();
      // Smoothly transition orb to standard monitoring mode upon initial click
      pulsingOrb.className = "meta-orb-trigger all-clear";
    });
  }

// ==========================================================================
  // 🎯 CORE REPAIR: Morning Briefing Center Glassmorphic Modal Interceptor
  // ==========================================================================
  const glassmorphicReminderModal = document.getElementById('loginReminderScreen');
  const pulsingOrb = document.getElementById('metaTrackerOrb');

  if (glassmorphicReminderModal) {
    // Structural view gate check based on live authorization states
    if (currentAgentId || localStorage.getItem("active_agent_session_id")) {
      glassmorphicReminderModal.style.display = 'none';
      if (pulsingOrb) pulsingOrb.className = "meta-orb-trigger all-clear";
    } else {
      glassmorphicReminderModal.style.display = 'flex';
    }

    // MATCHED HOOK: Triggers drawer sliding event sequence instantly from Briefing Note
    const trackerActionBtn = document.getElementById('dismissReminderBtn');
    if (trackerActionBtn) {
      trackerActionBtn.addEventListener('click', () => {
        // Apply smooth CSS opacity drop matching transition rules
        glassmorphicReminderModal.style.opacity = '0';
        glassmorphicReminderModal.style.transition = 'opacity 0.35s ease';
        
        setTimeout(() => {
          glassmorphicReminderModal.style.display = 'none';
          
          // Command target drawer selector layer to slide into view
          const drawer = document.getElementById('metaTrackerDrawer');
          if (drawer && !drawer.classList.contains('drawer-open')) {
            // Trigger your custom open logic function safe-check
            if (typeof toggleDrawer === "function") {
              toggleDrawer();
            } else {
              drawer.classList.add('drawer-open');
            }
          }
          
          // Shift system tracking beacon indicator cleanly to active observation mode
          if (pulsingOrb) pulsingOrb.className = "meta-orb-trigger all-clear";
        }, 350);
      });
    }
  }

  // 🎯 CORE CONFIG: Real-time Pressure Form Logic & Pure Regex Log Stripper
  const trackingFields = ["case", "subj", "name", "min", "company", "email", "thread", "datetime", "action", "wocas"];
  trackingFields.forEach(id => {
    const el = $(id);
    if (!el) return; 
    
    const freshElement = el.cloneNode(true);
    el.parentNode.replaceChild(freshElement, el);

    freshElement.addEventListener("input", (e) => { 
      // If this is our custom system log tracker field, instantly sanitize it
      if (id === "wocas" && document.getElementById('trackerSystemErrorToggle')?.checked) {
        const rawValue = e.target.value;
        // Strip call stack garbage parameters, memory address wrappers, and trace lines
        const cleanLog = rawValue.replace(/at\s+.*\(?:\d+:\d+\)?/g, '').replace(/[\r\n]+/g, '\n').trim();
        if (rawValue !== cleanLog) {
          e.target.value = cleanLog;
        }
      }
      updateOutput(); 
      updateSuggestions(); 
      saveData(false); 
    });
    
    freshElement.addEventListener("change", () => { updateOutput(); updateSuggestions(); saveData(true); });
    freshElement.addEventListener("blur", () => { saveData(true); });
  });

  $('historyContainer')?.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    const action = button.getAttribute('data-action');
    const index = parseInt(button.getAttribute('data-index'), 10);
    
    if (action === 'recopy') {
      loadHistoryItem(index);
    } else if (action === 'delete') {
      deleteHistoryItem(index);
    }
  });

  $("case")?.addEventListener("input", (e) => validateCaseField(e.target));
  $("min")?.addEventListener("input", (e) => validateMinField(e.target));

  $("concernType")?.addEventListener("change", () => {
    const vocInput = $("voc");
    if (vocInput) vocInput.value = ""; 

    updateVocOptions(false);
    updateOutput();
    
    const suggestionsBox = document.getElementById('suggestions');
    if (suggestionsBox) {
      suggestionsBox.innerHTML = "Select a new VOC option from the dropdown to view its playbook...";
    }
    
    const spielContainer = document.getElementById('playbookSpielContainer');
    if (spielContainer) {
      spielContainer.innerHTML = `
        <div style="padding: 12px; color: var(--text-muted); font-style: italic; font-size: 13px; text-align: center; border: 1px dashed var(--border-color); border-radius: 4px;">
          The corresponding email spiel template will load automatically upon context verification.
        </div>`;
    }

    saveData(true);
  });
  
  $("voc")?.addEventListener("input", () => {
    updateOutput();
    if ($("concernType")?.value && $("voc")?.value) {
      updateSuggestions(); 
    }
  });

  $("voc")?.addEventListener("change", () => {
    updateOutput();
    saveData(true);
    if ($("concernType")?.value && $("voc")?.value) {
      updateSuggestions(); 
    }
  });

  $("copyBtn")?.addEventListener("click", copyDoc);
  $("mobileCopyBtn")?.addEventListener("click", copyDoc);
  $("resetBtn")?.addEventListener("click", resetForm);
  $("mobileResetBtn")?.addEventListener("click", resetForm);
  
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
   VALIDATORS & DRAWERS
   ========================================================================== */
function validateCaseField(el) {
  if (!el) return;
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
  if (!el) return;
  el.classList.remove('val-amber', 'val-green', 'val-crimson');
  if (el.value.trim().length > 0) {
    el.classList.add('val-green');
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
   📊 SUPERVISOR TELEMETRY MODAL CONTROLS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const closeSupervisorBtn = document.getElementById('closeSupervisorBtn');
  const exitPortalBtn = document.getElementById('exitPortalBtn');
  const supervisorAdminPanel = document.getElementById('supervisorAdminPanel');

  const hideExtractionModal = () => {
    if (supervisorAdminPanel) {
      supervisorAdminPanel.style.display = 'none';
    }
  };

  if (closeSupervisorBtn) {
    closeSupervisorBtn.addEventListener('click', hideExtractionModal);
  }
  
  if (exitPortalBtn) {
    exitPortalBtn.addEventListener('click', hideExtractionModal);
  }
});

// 📢 REAL-TIME AGENT OPERATIONAL BROADCAST STREAM PIPELINE (WITH FORCE-COLOR SEVERITY)
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

        if (data.severity === "critical") {
          banner.style.setProperty("background-color", "#ef4444", "important");
          banner.style.setProperty("background", "#ef4444", "important");
          banner.style.setProperty("color", "#ffffff", "important");
        } else if (data.severity === "warning") {
          banner.style.setProperty("background-color", "#f59e0b", "important");
          banner.style.setProperty("background", "#f59e0b", "important");
          banner.style.setProperty("color", "#000000", "important"); 
        } else {
          banner.style.setProperty("background-color", "#3b82f6", "important");
          banner.style.setProperty("background", "#3b82f6", "important");
          banner.style.setProperty("color", "#ffffff", "important");
        }

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
