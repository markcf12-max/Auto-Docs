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
   VOC ENGINE REFERENCE MATRICES (UNIFIED WORKSTATION ARRAYS)
   ========================================================================== */
const TECH_PROCEDURES = {
  "VOICE CONNECTIVITY": [{ text: "Check voice service status flags", link: "#" }],
  "SMS CONNECTIVITY": [{ text: "Check SMS provisioning status", link: "#" }],
  "DATA CONNECTIVITY": [{ text: "Check active data sessions", link: "#" }],
  "ROAMING CONNECTIVITY": [{ text: "Verify global routing tags", link: "#" }],
  "COVERAGE CONNECTIVITY": [{ text: "Check tower coverage indexes", link: "#" }],
  "GENERIC": [{ text: "Run local network troubleshooting and verify account status map." }]
};

const AFTERSALES_PROCEDURES = {
  "REPLACEMENT:SIM": [{ text: "Verify proof of ownership, check company/individual IDs, check historical logs, and process request profile via your SIM management engine." }],
  "ACTIVATION": [{ text: "Examine validation values for the target ICCID block in the inventory console and map activation commands to the network switch." }],
  "CHANGE OF OWNERSHIP": [{ text: "Review signed Letter of Authorization (LOA), complete verification profiles for both assignees, and write adjustments to corporate ledger account." }],
  "VOICE CONNECTIVITY: INCOMING": [{ text: "Trace HLR call flags, activate missing service streams (Voice/SMS/Data), and run verification tests on network loops." }],
  "VOICE CONNECTIVITY: OUTGOING": [{ text: "Trace HLR call flags, activate missing service streams (Voice/SMS/Data), and run verification tests on network loops." }],
  "DISCONNECTION": [{ text: "Check account age, evaluate open statements or remaining penalties, issue final bill warnings, and flag contract as disconnected." }]
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
   SUPERVISOR-MANAGED EMAIL SPIEL REPOSITORY (UPDATED WITH CUSTOM SPIELS)
   ========================================================================== */
const EMAIL_SPIEL_MATRIX = {
  "Technical": {
    "GENERIC": "Dear Sir/Madam,\n\nThank you for contacting us. We acknowledge receipt of your email and understand the importance of having uninterrupted service for your daily activities.\n\nPlease be informed that the account is currently active and has full access to services. For further checking, kindly perform the following troubleshooting steps:\n\n• Refresh the network connection by turning your device off and then turning it back on. After restarting, please try again.\n• Insert the SIM card into another device and check if the issue persists.\n\nIf the issue still persists, kindly provide the following details so we can investigate further:\n\nMain Concern:\nName of Subscriber:\nAffected Mobile Number:\nError Prompted:\nExact Location/Address with ZIP Code:\nNearest Landmark:\nHandset Model:\nDate and Time the Problem Was First Encountered:\nType of Coverage (Indoor/Outdoor/Anywhere):\nFloor Level (if applicable):\nSignal Bar Status (Poor/Fluctuating/Intermittent/No Signal):\nTechnology (2G, 3G, LTE):\nContact Number/s:\n\nWe appreciate your understanding and cooperation. We look forward to your response so we can assist you further.\n\nBest regards,\n[Agent Name]",
    "DATA CONNECTIVITY": "Dear Customer,\n\nThank you for reaching out. We have analyzed your cellular provisioning profile regarding your mobile data connection. Please perform a hard restart of your device to force network re-registration. If connectivity issues persist, reply with your current location coordinates so our field engineers can verify cell tower load vectors.\n\nBest regards,\n[Agent Name]\nEnterprise Technical Support Desk",
    "VOICE CONNECTIVITY": "Dear Customer,\n\nWe appreciate you bringing your incoming/outgoing voice calling disruptions to our attention. Our team has verified that your core SIM configuration is active. Please toggle Airplane Mode ON for 30 seconds and then OFF to re-align your network configuration profile.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group-",
    "SERVICE DOWNTIME:DATA": "Dear Sir/Madam,\n\nThank you for reaching out to us. We truly understand the importance of these services to you.\n\nWe are currently enhancing our nationwide network to provide better service, which may temporarily affect data connectivity, voice, and SMS services. Our network team is diligently working to ensure an improved and reliable experience for all users.\n\nShould you require any further assistance, please do not hesitate to contact us.\n\nBest regards,\n[Agent Name]"
  },
  "Aftersales": {
    "Reconnection from Involuntary TD": "Dear Sir/Madam,\n\nThank you for reaching out and providing the proof of payment. We have acknowledged the request for account reconnection.\n\nYour request has been processed under case number [Case Number], with a turnaround time of up to 24 hours. Please note that a reconnection fee of PHP 300 may be applied to your next billing statement.\n\nShould you have further question or clarification, please do not hesitate to contact us.\n\nBest regards,\n[Agent Name]",
    "APPLICATION STATUS": "Dear Sir/Madam,\n\nThank you for reaching out to us. We sincerely apologize for any inconvenience this may have caused, and please rest assured that our team will carefully review your account.\n\nTo proceed, kindly provide a Letter of Request signed by the Authorized Signatory.\n\nOnce we receive the letter, we will promptly continue with the verification process.\n\nBest regards,\n[Agent Name]",
    "LIFTING:REDIRECTION": "Dear Sir/Madam:\n\nThank you for providing the mobile number. Rest assured that we will handle your request promptly.\n\nUpon validation, we found that the account was redirected due to exceeding the credit limit. Before we proceed, we kindly ask for your acknowledgment that you are amenable to settling the amount incurred in excess of the credit limit.\n\nWe look forward to your prompt response so we can proceed accordingly.\n\nBest regards,\n[Agent Name]",
    "Reconnection from Voluntary TD": "Dear Sir/Madam:\n\nThank you for reaching out to us. This is to acknowledge the receipt of your email.\n\nWe have checked your account, and it is currently under temporary disconnection, Case Number [Case Number]. The maximum period for this disconnection is six months, after which the account will be permanently disconnected if it is not reconnected.\n\nIf you would like to reconnect your account, a reconnection fee of 300 will apply and will appear on your next billing cycle.\n\nWe understand how important this account is to you, and we are here to help in any way we can.\n\nPlease feel free to reach out if you need assistance or have any concerns. We will make sure to support you throughout the process.\n\nBest regards,\n[Agent Name]",
    "DISCONNECTION": "Dear Sir/Madam,\n\nWe understand that requesting a permanent disconnection can be a difficult decision, and we truly appreciate you taking the time to reach out.\n\nBefore we proceed with your request for permanent termination, we kindly ask for your confirmation to settle the outstanding balances, which will be reflected in the final billing statement.\n\nIf you wish to continue with the termination, please reply with your confirmation so we can process your request accordingly.\n\nBest regards,\n[Agent Name]",
    "APPLICATION REQUIREMENTS": "Dear Customer,\n\nThank you for reaching out to us and for choosing SMART as your trusted service provider. We truly appreciate the opportunity to assist you.\n\nPlease be assured that your application has been endorsed to the assigned Relationship Manager, who will carefully review and process your request. They will reach out to you as soon as possible regarding the next steps.\n\nWe appreciate your patience and understanding throughout the process. If there is anything else we can help you with, please do not hesitate to let us know.\n\nBest regards,\n[Agent Name]",
    "CHANGE IN CREDIT LIMIT": "Dear Sir/Madam,\n\nUpon checking, we confirm that all roaming services on the account are active. We also verified that the current credit limit is 3,000, and the account has an outstanding balance of [Current Balance]. To assist you promptly, could you kindly confirm the amount to which you would like us to increase the credit limit?\n\nWe will be happy to process the adjustment once we receive your confirmation.\n\nBest regards,\n[Agent Name]",
    "SUCCESSFUL MNP INTERPORT-OUT": "Dear Sir/Madam,\n\nThank you for reaching out to us. We acknowledge the receipt of your email and appreciate you taking the time to contact us.\n\nUpon validation, we found that your account is under Smart Signature. To better assist you, you may reach out through the official Facebook page of Smart Communications, Inc. or dial *888 from your Smart mobile phone to connect with their hotline.\n\nShould you need any further assistance, please feel free to let us know.\n\nBest regards,\n[Agent Name]",
    "ACTIVATION": "Dear Sir/Madam,\n\nThank you for reaching out to us. We truly appreciate the opportunity to assist you with your request.\n\nWe have successfully processed the activation/deactivation of outgoing and incoming calls, SMS, and data under case number [Case Number]. Kindly note that the turnaround time for this request is within 24 hours.\n\nShould you have any concerns or clarification, please do not hesitate to reach out to us.\n\nBest regards,\n[Agent Name]",
    "INTERNATIONAL ROAMING- STATUS": "Dear Sir/Madam,\n\nWe appreciate you for reaching out to us regarding your request to activate the roaming services of the number [Mobile Number]. We are happy to let you know that upon checking the account, it shows that the roaming service is already active and is ready for use.\n\nTo further improve your experience, you may also visit our website at gigaroam.smart.com.ph and avail any of our roaming bundles that may suit your needs while you are abroad.\n\nFor any help needed with your roaming needs while you are abroad, below is the contact information of our dedicated roaming channels:\n\nInternational Toll-Free Roaming Hotline: +632 8848 8878\nEmail Address: SmartRoaming@smart.com.ph\n\nPlease don't hesitate to let us know if you need any other assistance regarding your account and we are always happy to help.\n\nBest regards,\n[Agent Name]",
    "CHANGE OF OWNERSHIP": "Dear Sir/Madam,\n\nThank you for reaching out to us. We are glad to assist you with your request to change the assignee.\n\nWe are pleased to share that a case has been successfully created to update the assignee to Ms. Shaina Ann Mae F. Diaz under Case Number [Case Number], associated with mobile number [Mobile Number]. Kindly allow up to 24 hours for the process to be fully completed.\n\nShould you have any additional questions or require further assistance, please feel free to email us anytime. We are always here and happy to help.\n\nBest regards,\n[Agent Name]",
    "SIM ACTIVATION": "Dear Sir/Madam,\n\nThank you for reaching out. We acknowledge your request regarding the activation of the new ICCID.\n\nWe have processed the SIM activation under case number [Case Number]. Please be advised that the turnaround time for this request is within 24 hours.\n\nShould you need further assistance, please do not hesitate to contact us.\n\nBest regards,\n[Agent Name]",
    "REPLACEMENT:SIM": "Your SIM replacement under Case No. [Case Number] has been processed. Delivery is expected within 3–5 business days. Please advise the recipient to keep their line open, as our courier will contact them once delivery is scheduled. As this is the first replacement request, no charges will apply. Future requests will incur a fee of PHP 40 for a regular SIM and PHP 60 for an eSIM.\n\nUpon receipt, insert the SIM into a mobile device and allow up to 4 hours for automatic activation.\n\nWe appreciate your patience and are available should you need further assistance.\n\nBest regards,\n[Agent Name]",
    "BALANCE:ACCOUNT RECONCILIATION": "Dear Sir/Madam:\n\nThank you for reaching out to us. We have received your email regarding the proof of payment and BIR Form 2307.\n\nWe sincerely appreciate you taking the time to provide the necessary documents. Your request will now be carefully forwarded to the assigned billing officer and our BIR team to ensure it is handled promptly and accurately.\n\nShould you have any other concerns or need further assistance, please do not hesitate to reach out.\n\nDear CRA:\n\nWe would like to respectfully request your assistance concerning the proof of payment submitted by our customer.\n\nDear Smart Enterprise BIR Team:\n\nWe would greatly appreciate your assistance regarding the BIR form submitted by our customer.\n\nBest regards,\n[Agent Name]"
  }
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
  
  // Reset datalist stack safely
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
  if (!$("output") || isResetting || !currentAgentId) return;
  
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

  if (concern === "Technical" && TECH_PROCEDURES[voc]) {
    html += TECH_PROCEDURES[voc].map(p => `• ${p.text}`).join("<br>");
  } else if (concern === "Aftersales" && AFTERSALES_PROCEDURES[voc]) {
    html += AFTERSALES_PROCEDURES[voc].map(p => `• ${p.text}`).join("<br>");
  } else {
    html += `• Follow standard processing vectors designated for ${voc}.`;
  }

  target.innerHTML = html;
  updatePlaybookSpiel(concern, voc);
}

/* ==========================================================================
   PLAYBOOK DYNAMIC SPIEL SYSTEM WITH INTEGRATED GUARDRAILS
   ========================================================================== */
function updatePlaybookSpiel(concern, voc) {
  const container = $('playbookSpielContainer');
  if (!container) return;

  if (!concern || !voc || !EMAIL_SPIEL_MATRIX[concern] || !EMAIL_SPIEL_MATRIX[concern][voc]) {
    container.innerHTML = `<div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">No standard sample email spiel registered for the selected ${concern || 'N/A'} ➔ ${voc || 'N/A'} vector context.</div>`;
    return;
  }

  const caseNum = $("case")?.value.trim() || "000000";
  const mobileNum = $("min")?.value.trim() || "(MIN)";

  let localizedRawTemplate = EMAIL_SPIEL_MATRIX[concern][voc];
  let fullyCompiledTemplate = localizedRawTemplate.replace(/\[Agent Name\]/g, currentAgentName);
  fullyCompiledTemplate = fullyCompiledTemplate.replace(/\[Case Number\]/g, caseNum !== "" ? caseNum : "000000");
  fullyCompiledTemplate = fullyCompiledTemplate.replace(/\[Mobile Number\]/g, mobileNum !== "" ? mobileNum : "(MIN)");

  container.innerHTML = `
    <div style="background: rgba(245, 158, 11, 0.15); border-left: 4px solid #f59e0b; color: #fbbf24; padding: 10px; margin-bottom: 12px; border-radius: 4px; font-size: 12px; font-weight: 600; line-height: 1.4;">
      <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> REMINDER: Customize the sample email if fitted to the concern.
    </div>

    <div style="position: relative; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px;">
      <pre id="playbookRawSpielText" style="margin: 0; white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #e2e8f0; line-height: 1.5;">${fullyCompiledTemplate}</pre>
    </div>
  `;
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
  if ($('logoutBtn')) $('logoutBtn').style.display = "block";
  updateSyncStatusUI('online');
  
  updateVocOptions(true);
  updateOutput();
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
    const spielPanel = $('playbookSpielContainer');
    if (spielPanel) spielPanel.innerHTML = "";
    renderHistoryView();
  }
}

function showLoginGateway(isRegisterMode = false) {
  $('authModal').style.display = "flex";
  if ($('logoutBtn')) $('logoutBtn').style.display = "none";
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

  const executeSave = async () => {
    updateSyncStatusUI('saving');
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
    case:        getCleanVal("case"),
    subj:        getCleanVal("subj"),
    name:         getCleanVal("name"),
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
      case_id: caseNumber || getCleanVal("case") || "N/A",
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
   SHIFT HISTORY MANIFEST SYSTEM
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

  // Compile a cleanly structured, human-readable text file block
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

async function clearShiftHistory() {
  if (!currentAgentId) return;

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
   SUPERVISOR OPERATIONS PORTAL WITH DATE RANGE FILTERS (.CSV)
   ========================================================================== */
function showSupervisorPanel() {
  const panel = $('supervisorAdminPanel');
  if (panel) panel.style.display = "flex";
  
  const startDateEl = $('adminFilterStartDate');
  const endDateEl = $('adminFilterEndDate');
  
  if (startDateEl && endDateEl) {
    const rightNow = new Date();
    const todayStr = `${rightNow.getFullYear()}-${String(rightNow.getMonth() + 1).padStart(2, '0')}-${String(rightNow.getDate()).padStart(2, '0')}`;
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
        where("submission_date", "<=", endDateFilter)
      );

      const performanceSnapshot = await getDocs(q);
      
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
    const todayStr = `${rightNow.getFullYear()}-${String(rightNow.getMonth() + 1).padStart(2, '0')}-${String(rightNow.getDate()).padStart(2, '0')}`;
    
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
    const spielPanel = $('playbookSpielContainer');
    if (spielPanel) spielPanel.innerHTML = "";

    if (currentAgentId) {
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
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  $('logoutBtn')?.addEventListener('click', terminateAgentSession);
  $('adminExtractSubmitBtn')?.addEventListener('click', executeSupervisorExtraction);
  $('closeSupervisorBtn')?.addEventListener('click', () => { $('supervisorAdminPanel').style.display = "none"; });
  $('exitPortalBtn')?.addEventListener('click', () => { $('supervisorAdminPanel').style.display = "none"; listenToSessionState(); });

  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true);
  }

  const trackingFields = ["case", "concernType", "voc", "subj", "name", "min", "company", "email", "thread", "datetime", "action", "wocas"];
  trackingFields.forEach(id => {
    const el = $(id);
    if (!el) return; 
    el.addEventListener("input", () => { updateOutput(); updateSuggestions(); saveData(false); });
    el.addEventListener("change", () => { updateOutput(); updateSuggestions(); saveData(true); });
    el.addEventListener("blur", () => { saveData(true); });
  });

  $("case")?.addEventListener("input", (e) => validateCaseField(e.target));
  $("min")?.addEventListener("input", (e) => validateMinField(e.target));

  $("concernType")?.addEventListener("change", () => {
    updateVocOptions(false);
    updateSuggestions();
  });
  
  $("voc")?.addEventListener("input", () => {
    updateOutput();
    updateSuggestions();
  });
  $("voc")?.addEventListener("change", () => {
    updateOutput();
    updateSuggestions();
    saveData(true);
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
   UNGRACEFUL STABILITY MONITORING
   ========================================================================== */
window.addEventListener('beforeunload', () => {
  const cachedAgentId = localStorage.getItem("active_agent_session_id");
  if (!cachedAgentId || cachedAgentId.toLowerCase() === "admin" || cachedAgentId.toLowerCase() === "supervisor") return;

  const rightNow = new Date();
  const todayStr = `${rightNow.getFullYear()}-${String(rightNow.getMonth() + 1).padStart(2, '0')}-${String(rightNow.getDate()).padStart(2, '0')}`;
  
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
