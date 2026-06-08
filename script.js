/* ==========================================================================
   FIREBASE CONFIGURATION & MODULE INTEGRATION (V12.14.0)
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';
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

    if (user) {
      $('authModal').style.display = "none";
      updateSyncStatusUI('online');
      
      updateOutput();
      updateSuggestions();
      updateFloatingBanner();
      
      // Directly pull live workspace data from the cloud database
      await pullLiveWorkspace();
    } else {
      $('authModal').style.display = "flex";
      if ($("output")) {
        $("output").textContent = `CASE/SR VALUE: N/A\nCONCERN TYPE: \nVOC: \n\nSUBJ: \n\nNAME: \nMIN: \nCOMPANY: \nEMAIL: \nTHREAD: \nDATE/TIME: \n\nACTION:\n\n\nWOCAS:\n`;
      }
      if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
    }
  });
}

/* ==========================================================================
   SOLE SOURCE OF TRUTH: CLOUD DATA ENGINE
   ========================================================================== */
async function saveData() {
  if (isResetting) return; 
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  updateSyncStatusUI('saving');

  saveTimeout = setTimeout(async () => {
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
        updated_at: Date.now()
      });
      updateSyncStatusUI('online');
    } catch (error) {
      console.error("Firebase synchronization cloud drop:", error);
      updateSyncStatusUI('error');
    }
  }, 400); // 400ms debounce to prevent hitting Firebase rate limits while typing
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
  } catch (e) {
    console.error("Critical Cloud Fetch Failure:", e);
    updateSyncStatusUI('error');
  }
}

/* ==========================================================================
   CLEAN LOGOUT FLOW
   ========================================================================== */
async function terminateAgentSession() {
  if (!confirm("Log out of current workbench session? Your current cross-station cloud progress will be preserved.")) {
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

/* ==========================================================================
   FORM RESET MECHANISM (CLEARS CURRENT FIRESTORE OBJECT STATE)
   ========================================================================== */
async function resetForm(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!confirm("Are you sure you want to clear your current active workspace form?")) return;
  
  isResetting = true; 
  const currentUser = firebaseAuth.currentUser;

  try {
    // Clear visual interfaces
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

    // Write empty record back up to firebase so state clears globally across screens
    if (currentUser) {
      const docRef = doc(firestoreDb, "case_logs", currentUser.uid);
      await setDoc(docRef, {
        agent_id: currentUser.uid,
        agent_email: currentUser.email,
        case_number: "DRAFT",
        form_data: {},
        updated_at: Date.now()
      });
    }
    
    showToast("Cloud workspace wiped.");
  } catch(e) {
    console.error("Cloud database reset exception:", e);
    showToast("Error clearing background cloud records.", true);
  } finally {
    isResetting = false; 
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
  if (drawer && drawer.classList.contains('drawer-open') && !drawer.contains(e.target) && !$('drawerToggle')?.contains(e.target)) {
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

function updateFloatingBanner() {
  const banner = $('floatingShiftBanner');
  if (!banner) return;
  banner.style.background = "#fbbf24"; 
  banner.style.color = "#1e293b";
  banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> WORKBENCH IS SYNCED LIVE WITH CENTRAL OPERATIONS DATABASE`;
}

function copyDoc() {
  const outputText = $("output")?.textContent;
  if (!outputText || outputText.includes("Generating real-time output preview")) {
    showToast("No documentation content found to copy!", true);
    return;
  }

  navigator.clipboard.writeText(outputText).then(() => {
    showToast("Notes copied to system clipboard!");
  }).catch(err => {
    showToast("Clipboard routine blocked.", true);
  });
}

/* ==========================================================================
   THEME MANAGER
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
    el.addEventListener("input", () => { updateOutput(); saveData(); });
    el.addEventListener("change", () => { updateOutput(); saveData(); });
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
  $("themeToggle")?.addEventListener("click", toggleTheme);

  listenToSessionState();
});
