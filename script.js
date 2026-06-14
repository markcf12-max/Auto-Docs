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

// Quick helper to get clean ISO date string (YYYY-MM-DD)
function getSystemDateString() {
  return new Date().toISOString().slice(0, 10);
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
   SUPERVISOR-MANAGED EMAIL SPIEL REPOSITORY (COMPREHENSIVE VOC COVERAGE)
   ========================================================================== */
const EMAIL_SPIEL_MATRIX = {
  "Technical": {
    "GENERIC": "Dear Sir/Madam,\n\nThank you for contacting us. We know how important a reliable connection is for your daily work and activities, and we want to help you get this resolved quickly.\n\nYour profile has been securely verified, and our system shows your account services are fully active. To help us isolate the cause of the signal drop, please try these quick steps:\n\n• Refresh the network connection by turning your device off for 30 seconds and turning it back on.\n• Insert the SIM card into another device to check if the issue persists.\n\nIf the issue still persists, kindly provide the following details so we can open a technical investigation ticket for your area:\n\nMain Concern:\nName of Subscriber:\nAffected Mobile Number: [Mobile Number]\nExact Location/Address:\nNearest Landmark:\nHandset Model:\nSignal Bar Status (Poor/Fluctuating/No Signal):\nContact Number:\n\nThank you for your patience and cooperation.\n\nBest regards,\n[Agent Name]",
    "DATA CONNECTIVITY": "Dear Customer,\n\nThank you for contacting us regarding your mobile data. We understand how critical a stable internet connection is for your daily tasks, and we are committed to fixing this right away.\n\nFollowing our secure account review, we confirm that your high-speed data access is fully active with no system restrictions. To clear any temporary connection locks, please try this step:\n\n• Restart your device completely. This establishes a fresh data session and restores your data connection flags on the network.\n\nIf the issue persists, please reply with your current location and a quick description of your signal bars so we can escalate this directly to our network engineering team.\n\nThank you for your patience.\n\nBest regards,\n[Agent Name]\nEnterprise Technical Support Desk",
    "VOICE CONNECTIVITY": "Dear Customer,\n\nThank you for reaching out about your calling concern. We know how disruptive dropped calls or signal routing issues can be, and we want to get this sorted out for you.\n\nTo protect your privacy, we have securely verified your profile and confirmed your voice service features are active. To clear localized signal handoff stalls, please try this quick adjustment:\n\n• Toggle Airplane Mode ON for 30 seconds, then turn it OFF. This forces your SIM card to refresh its signal configuration matrix and re-register on our network switches.\n\nShould you continue to face call disruptions, please reply with an alternate contact number and a sample timestamp of a failed call so we can log an official voice diagnostic ticket.\n\nThank you for your cooperation.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group",
    "SMS CONNECTIVITY": "Dear Customer,\n\nThank you for messaging us about your SMS concern. We understand how important it is to receive your texts and verification codes promptly, and we are here to assist.\n\nFollowing our secure validation protocol, we confirm your line is properly connected to our messaging gateway. To resolve temporary messaging buffer locks, please try these quick fixes:\n\n• Toggle Airplane Mode ON for 30 seconds, then turn it OFF to refresh the messaging queue.\n• Check that your device storage is not full and ensure short-code numbers are not marked as spam.\n\nIf you are still missing your messages, please reply with a specific time and date of a recent failed SMS attempt so our network team can locate the exact packet drop in our logs.\n\nThank you for your partnership.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group",
    "SERVICE DOWNTIME:DATA": "Dear Sir/Madam,\n\nThank you for reaching out to us. We understand how important your data, voice, and SMS services are to your daily activities, and we apologize for any inconvenience caused.\n\nTo keep your connection reliable, we are currently performing system enhancements on our nationwide network infrastructure. This optimization may temporarily affect your services in certain sectors while our engineers complete tower upgrades. We are working diligently to finish these updates quickly to provide you with an improved network experience.\n\nWe have safely documented this interaction under your secure profile. If you have any questions, please feel free to reply directly to this thread.\n\nThank you for your understanding and cooperation.\n\nBest regards,\n[Agent Name]"
  },
  "Aftersales": {
    // --- PRE-EXISTING ORIGINAL SPIELS ---
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
    "SIM ACTIVATION": "Dear Sir/Madam,\n\nThank you for reaching out. We acknowledge your request regarding the activation of the new ICCID.\n\nWe have processed the SIM activation under case number [Case Number]. Please be advised that the turnaround time for this request is within 24 hours.\n\nShould you have further assistance, please do not hesitate to contact us.\n\nBest regards,\n[Agent Name]",
    "REPLACEMENT:SIM": "Your SIM replacement under Case No. [Case Number] has been processed. Delivery is expected within 3–5 business days. Please advise the recipient to keep their line open, as our courier will contact them once delivery is scheduled. As this is the first replacement request, no charges will apply. Future requests will incur a fee of PHP 40 for a regular SIM and PHP 60 for an eSIM.\n\nUpon receipt, insert the SIM into a mobile device and allow up to 4 hours for automatic activation.\n\nWe appreciate your patience and are available should you need further assistance.\n\nBest regards,\n[Agent Name]",
    "BALANCE:ACCOUNT RECONCILIATION": "Dear Sir/Madam:\n\nThank you for reaching out to us. We have received your email regarding the proof of payment and BIR Form 2307.\n\nWe sincerely appreciate you taking the time to provide the necessary documents. Your request will now be carefully forwarded to the assigned billing officer and our BIR team to ensure it is handled promptly and accurately.\n\nShould you have any other concerns or need further assistance, please do not hesitate to reach out.\n\nDear CRA:\n\nWe would like to respectfully request your assistance concerning the proof of payment submitted by our customer.\n\nDear Smart Enterprise BIR Team:\n\nWe would greatly appreciate your assistance regarding the BIR form submitted by our customer.\n\nBest regards,\n[Agent Name]",

    // --- EXPANDED COMMERCIAL VOC MATRIX CODES ---
    "APP RELATED": "Dear Customer,\n\nThank you for reaching out regarding our mobile application. We want to ensure you have a smooth, effortless digital experience tracking your services.\n\nTo troubleshoot app launch loops or synchronization bugs, please perform these quick clearing steps:\n1. Open your device Settings > Apps > select our App and click 'Clear Cache & Data'.\n2. Ensure your phone software is completely up-to-date and restart your device.\n\nWe have documented this under Case Number [Case Number]. If you are still experiencing errors, please reply with your device model and a screenshot of the prompt so we can investigate immediately.\n\nBest regards,\n[Agent Name]",
    
    "ADA ENROLLMENT": "Dear Corporate Partner,\n\nThank you for choosing to simplify your billing operations via our Automatic Debit Arrangement (ADA) platform. We are here to guide you through the seamless activation process.\n\nTo safely process your request, please fill out the attached ADA Enrollment Form and secure the signature of your company's Authorized Signatory, along with a copy of your credit card/bank mandate record.\n\nOnce completed, please reply directly to this email with the attachments under Case Number [Case Number] so we can complete processing within 3 business days.\n\nBest regards,\n[Agent Name]",
    
    "AVAILMENT OF ADD-ONS": "Dear Customer,\n\nThank you for reaching out. We are glad to help you boost your account allocation with our current line of add-on packages.\n\nWe have checked your profile for [Mobile Number] and confirmed it is fully eligible to register for additional allocation tiers. To finalize this transaction under Case Number [Case Number], please reply confirming the specific data, call, or messaging package you wish to activate.\n\nAlternatively, you may instantly browse and activate these packages directly via our self-care application at your convenience.\n\nBest regards,\n[Agent Name]",
    
    "BALANCE TRANSFER": "Dear Customer,\n\nThank you for contacting us regarding a mobile balance transfer request. We understand the importance of allocating allocations across your enterprise lines.\n\nTo complete this securely, please verify that both the source line and destination number [Mobile Number] are active. Kindly reply with the exact transfer allocation threshold you want implemented.\n\nWe will update your progress under Case Number [Case Number] as soon as we receive your text confirmation.\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:CLARIFICATION ON BILLED CHARGES": "Dear Valued Customer,\n\nThank you for reaching out. We want to ensure your monthly invoice metrics are clear, transparent, and completely aligned with your usage patterns.\n\nWe have initialized a detailed itemized auditing review on your current statement under Case Number [Case Number]. To help us resolve this query quickly, please let us know which specific charge item or transaction period requires clarification.\n\nRest assured, we will double-check our system switch metrics and follow up with a complete response within 24 to 48 hours.\n\nBest regards,\n\n[Agent Name]\nEnterprise Financial Operations Group",
    
    "BALANCE:COLLECTION REMINDER": "Dear Customer,\n\nThis is a friendly account operational check regarding your outstanding balance statement linked to account [Mobile Number].\n\nTo maintain uninterrupted network accessibility, please settle your dues through our verified payment partners or enterprise digital desks. If you have already fulfilled this statement payment within the past 24 hours, please disregard this automated notification.\n\nIf you need to view your current updated statement breakdown, feel free to reply directly to this thread citing Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:NON-RECEIPT OF BILL": "Dear Customer,\n\nWe apologize for the inconvenience of not receiving your monthly statement invoice. We want to ensure you always get your records on time.\n\nWe have successfully verified your enterprise registration under Case Number [Case Number]. We are re-sending your latest statement of account to the email address on file. Please check your spam folder if it doesn't appear in your main inbox within the next few minutes.\n\nTo update your primary billing email address, reply directly to this message with your updated contact profile details.\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:POSTING OF PAYMENT": "Dear Sir/Madam,\n\nThank you for submitting your transaction records. We are here to ensure your payments are accurately credited to your account profile.\n\nWe have logged your receipt details under Case Number [Case Number]. Our finance verification desk is currently processing the posting sweep onto your line [Mobile Number]. This reconciliation cycle takes approximately 24 hours to clear.\n\nYour lines will remain in an active service status throughout this standard clear window.\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:PRO-RATA": "Dear Customer,\n\nThank you for reaching out. We are glad to clarify how your initial monthly service fee was calculated on your latest statement.\n\nBecause your activation date fell in the middle of our standard commercial billing cycle, your first invoice reflects a pro-rated charge. This means you are only being billed for the exact number of days the line was active prior to your cycle cutoff date.\n\nYour subsequent invoices will reflect the standard monthly service fee. This inquiry has been logged under Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:REMAINING ALLOCATION": "Dear Customer,\n\nThank you for requesting an allocation status update for your mobile line [Mobile Number].\n\nOur service network control panel confirms that your current active allocation pool is fully online. Your remaining high-speed data balances and call allowances have been safely delivered to your profile. You can check these real-time metrics anytime by opening our digital self-care app.\n\nThis balance query tracking flag has been registered under reference Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:TOP UP": "Dear Customer,\n\nThank you for reaching out regarding account top-up configurations for your line [Mobile Number].\n\nWe confirm that your wallet limits are clear and available for loading. You can instantly top up your balance using our mobile application, or through any authorized digital kiosk or enterprise online partner desk.\n\nShould you experience any issues loading your line, please share the transaction reference ID with us by replying to this thread under Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "BALANCE:UNBILLED": "Dear Customer,\n\nThank you for your inquiry regarding unbilled transaction volumes currently accumulated on your line [Mobile Number].\n\nWe have checked our network usage registers under Case Number [Case Number]. Your real-time unbilled metrics show your current usage is well within normal limits. Please note that these pending parameters are estimated configurations and will be finalized on your next statement cutoff date.\n\nBest regards,\n[Agent Name]",
    
    "BAN": "Dear Partner,\n\nThank you for contacting our account provisioning team regarding your Billing Account Number (BAN) profiles.\n\nWe have successfully located your corporate profile configuration matrix. Your account maps match our database structures perfectly under Case Number [Case Number]. If you require structural alterations or consolidation of sub-BAN assets, please submit your formalized authorization instructions directly via this thread.\n\nBest regards,\n[Agent Name]",
    
    "BAR SMS": "Dear Customer,\n\nThank you for reaching out. We understand you need to manage short-code visibility settings or restrict premium messaging functions on your line.\n\nWe have initialized an SMS barring adjustment ticket for line [Mobile Number] under Case Number [Case Number]. To protect your line from premium content charges, we can restrict outgoing or incoming short-code channels according to your operational preferences.\n\nPlease reply with your confirmation so we can apply these configuration adjustments to your line within the hour.\n\nBest regards,\n[Agent Name]",
    
    "BARRING:DATA": "Dear Customer,\n\nThank you for reaching out to us. This is to acknowledge your request to place a data service restriction on mobile line [Mobile Number].\n\nWe have initiated the requested configuration adjustment to bar cellular data access under Case Number [Case Number]. This prevents your line from connecting to mobile internet channels while keeping your voice calling and text features fully functional.\n\nIf you ever need to restore your high-speed internet access, simply let us know through this email thread.\n\nBest regards,\n[Agent Name]",
    
    "BARRING:LOSS": "Dear Customer,\n\nWe are sorry to hear about your lost device, and we are moving quickly to secure your account and protect your personal information.\n\nWe have implemented an immediate emergency security block on mobile line [Mobile Number] under Case Number [Case Number]. Outgoing and incoming calls, data sessions, and messaging features are now fully locked to prevent unauthorized use.\n\nWhen you are ready to restore your services, please contact us so we can help you with a secure SIM card replacement.\n\nBest regards,\n[Agent Name]",
    
    "BILL DETAILS:DUE DATE/CUTOFF": "Dear Customer,\n\nThank you for reaching out. We are happy to provide your monthly invoice schedule to help you track your statements smoothly.\n\nYour account configuration maps to a fixed billing statement cutoff date on the 1st of every month, with your payment due date falling exactly 20 days later. You can also view these schedule rules on the top header of your digital invoices.\n\nThis ticket has been documented for your records under Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "BIN ABUSE": "Dear Customer,\n\nThis is an important update from our security operations desk regarding recent activity detected on your account platform.\n\nOur systemic monitors flagged non-standard verification patterns linked to your payment registration profile. To protect your line and account security, we have placed a temporary transaction lock on your profile under Case Number [Case Number].\n\nKindly reply with a valid corporate identity document so we can securely verify your profile and clear this flag.\n\nBest regards,\n[Agent Name]\nGlobal Security Operations Desk",
    
    "BIN FRAUD": "Dear Customer,\n\nThis is a critical alert from our risk mitigation team regarding your registered payment profiles.\n\nWe have detected unverified transaction attempts that violate our security protocols. To secure your account assets, a protective freeze has been applied to payment methods on file under Case Number [Case Number].\n\nPlease reach out to our corporate verification desk as soon as possible so we can securely update your billing credentials.\n\nBest regards,\n[Agent Name]\nRisk Mitigation & Fraud Prevention Division",
    
    "CHANGE IN BILLING ADDRESS": "Dear Customer,\n\nThank you for reaching out. We are glad to assist you with updating your account profile records.\n\nWe have received your address update request for line [Mobile Number] under Case Number [Case Number]. To complete this adjustment in our database system, please reply to this thread with a copy of a valid government ID or your latest billing proof showing your new address.\n\nWe will update your account records as soon as we receive your documents.\n\nBest regards,\n[Agent Name]",
    
    "CHANGE IN CUSTOMER INFORMATION": "Dear Customer,\n\nThank you for contacting us to update your profile contact metrics.\n\nWe have logged your request to modify your account information under Case Number [Case Number]. To protect your account security, please provide a signed Letter of Request alongside a copy of your authorized identification documents.\n\nOnce received, our database team will update your records across all connected profiles within 24 hours.\n\nBest regards,\n[Agent Name]",
    
    "COVERAGE": "Dear Customer,\n\nThank you for reaching out to us regarding network coverage parameters in your area.\n\nWe want to ensure you receive optimal signal strength wherever you go. We have logged your location coordinates under Case Number [Case Number] and passed them to our network planning team to run a local coverage audit.\n\nOur team will monitor nearby cellular sites to maximize your signal performance and resolve any localized coverage dips.\n\nBest regards,\n[Agent Name]\nNetwork Engineering & Planning Group",
    
    "DATA CONNECTIVITY:INTERMITTENT CONNECTION": "Dear Customer,\n\nThank you for contacting us about your cellular internet connection drops. We know how frustrating a fluctuating connection can be, and we are here to help.\n\nWe have reviewed your profile for [Mobile Number] and confirmed your line parameters are healthy. To stabilize your network handshakes, please go to your device Settings > Mobile Networks > Network Mode, and toggle between LTE/5G choices to force a clean re-registration on our network towers.\n\nWe are tracking this performance ticket under Case Number [Case Number]. Please let us know if your connection continues to drop.\n\nBest regards,\n[Agent Name]",
    
    "DATA CONNECTIVITY:NO CONNECTION": "Dear Customer,\n\nThank you for reaching out about your data connection. We understand how important a reliable mobile internet connection is for your daily tasks, and we want to get you back online quickly.\n\nWe have refreshed your network configuration profile under Case Number [Case Number]. To complete this sync and restore your data connection flags, please turn your device off for 30 seconds and then restart it.\n\nAdditionally, please verify that your mobile data toggle is turned ON in your device settings menu.\n\nBest regards,\n[Agent Name]",
    
    "DATA CONNECTIVITY:SPECIFIC WEBSITE/APPLICATION": "Dear Customer,\n\nThank you for contacting us regarding your app access speeds on line [Mobile Number].\n\nIf you can browse general websites but notice slow speeds on a specific application, it typically points to an app-side server configuration or a local content cache bottleneck rather than a network outage. Please try clearing your app's cache storage and check for any pending updates in your device's app store.\n\nWe have logged this analysis thread under reference Case Number [Case Number] for your records.\n\nBest regards,\n[Agent Name]",
    
    "DATA CONNECTIVITY:SLOW CONNECTION": "Dear Customer,\n\nThank you for reaching out regarding your mobile data speeds. We want to ensure you get the fast, high-quality performance you expect from our network.\n\nWe have verified your network profile under Case Number [Case Number] and confirmed that your line has no speed restrictions or data limits. To clear out any temporary network congestion, please toggle your Airplane Mode ON for 20 seconds, then turn it back OFF to refresh your connection.\n\nIf your speeds do not improve, please reply with your current location coordinates so our engineers can run a diagnostic check on your local cellular tower.\n\nBest regards,\n[Agent Name]",
    
    "DEACTIVATION OF FLEXIBUNDLES": "Dear Customer,\n\nThank you for reaching out. This is to confirm your request to remove the Flexibundle package from your account profile.\n\nWe have initiated the deactivation ticket for your line [Mobile Number] under reference Case Number [Case Number]. This package will be removed at the end of your current billing cycle to ensure you get full use of your already billed allowances.\n\nYou will see this change reflected on your next invoice statement.\n\nBest regards,\n[Agent Name]",
    
    "DISPUTE: MSF CHARGES": "Dear Valued Customer,\n\nThank you for raising your concern regarding Monthly Service Fee (MSF) adjustments on your latest statement.\n\nWe want to ensure your invoice is completely accurate. We have opened a formal financial investigation under Case Number [Case Number] to audit the charges applied to line [Mobile Number]. Our billing reconciliation team will review your contract terms against this invoice period.\n\nWe will contact you with a detailed breakdown as soon as the financial audit is complete.\n\nBest regards,\n[Agent Name]\nEnterprise Financial Reconciliation Desk",
    
    "DISPUTE: CALL CHARGES": "Dear Customer,\n\nThank you for contacting us regarding the voice call charges on your recent statement.\n\nWe have initiated an internal audit of our call detail records (CDR) under Case Number [Case Number] to verify the duration and routing metrics for the calls in question on line [Mobile Number].\n\nRest assured, if our system shows any billing errors or duplicated items, we will apply the appropriate adjustment to your next invoice statement.\n\nBest regards,\n[Agent Name]\nUsage Verification Group",
    
    "DISPUTE:DATA CHARGES": "Dear Customer,\n\nThank you for reaching out regarding the data usage charges on your statement. We understand you need clarification on these usage amounts.\n\nWe have opened a tracking case under Case Number [Case Number] to pull the data session logs for your line [Mobile Number]. Please note that modern smartphones often run automated cloud backups, application updates, and background synchronization over cellular networks unless restricted in the device settings.\n\nOur billing analysts will verify these network sessions and follow up with you shortly.\n\nBest regards,\n[Agent Name]",
    
    "DISPUTE:SMS CHARGES": "Dear Customer,\n\nThank you for reaching out regarding your statement's messaging charges. We are here to clarify your usage billing.\n\nWe have opened an investigation under Case Number [Case Number] to audit the SMS transaction logs for line [Mobile Number]. This audit will check for any premium short-code interactions or roaming messages that may have incurred standard international text rates.\n\nWe will update you with our findings within 24 to 48 hours.\n\nBest regards,\n[Agent Name]",
    
    "DISPUTE: PCC": "Dear Customer,\n\nThank you for contacting us regarding Premium Content Charges (PCC) applied to your mobile statement account.\n\nWe have logged your dispute under Case Number [Case Number] and are reviewing the digital content subscriptions linked to line [Mobile Number]. To protect your account from future charges, we have placed an immediate block on premium content subscriptions for this line.\n\nOur billing team will review the subscription validation history to see if an adjustment can be applied.\n\nBest regards,\n[Agent Name]",
    
    "DISPUTE:VAS CHARGES": "Dear Customer,\n\nThank you for contacting us regarding Value-Added Service (VAS) charges on your account statement.\n\nWe want to ensure your billing is accurate and fully authorized. We have opened a usage investigation under Case Number [Case Number] to audit the registration logs for line [Mobile Number]. We have also disabled active VAS features on this line to prevent further unauthorized charges.\n\nOur billing team will review this case and follow up with you as soon as possible.\n\nBest regards,\n[Agent Name]",
    
    "FAIR USE POLICY": "Dear Customer,\n\nThank you for reaching out to us. This is an informational notice regarding network data management and Fair Use Policy (FUP) parameters.\n\nTo ensure all users enjoy a fast, reliable mobile web experience, high-volume data connections may see temporary speed adjustments during periods of high network congestion once daily volume thresholds are reached. Your full high-speed access resets automatically every day according to your package guidelines.\n\nYou can review your package details under tracking Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "FAST DEPLETION": "Dear Customer,\n\nThank you for reaching out about your high-speed data allocation limits on line [Mobile Number].\n\nWe have audited our network system logs under Case Number [Case Number] and confirmed that data volume tracking matches actual network usage sessions perfectly. Modern applications streaming high-definition video, running background cloud syncs, or operating on high-speed 5G networks can consume data allowances faster than expected.\n\nTo help save your data, we recommend turning on 'Data Saver' mode in your device settings and restricting background app updates to Wi-Fi connections.\n\nBest regards,\n[Agent Name]",
    
    "FLP RESENDING OF LOAD": "Dear Customer,\n\nThank you for contacting us regarding your Fixed Line Prepaid (FLP) allocation delivery status.\n\nWe apologize if there was a delivery lag on your monthly package. We have successfully re-queued your load distribution profile under Case Number [Case Number]. Your line [Mobile Number] has been refreshed on our loading gateway network, and you should receive your full allocation balance shortly.\n\nKindly restart your device if the load balance does not update automatically within 15 minutes.\n\nBest regards,\n[Agent Name]",
    
    "HANDSET UNLOCKING": "Dear Customer,\n\nThank you for reaching out to us regarding your device's network configuration lock.\n\nWe are happy to assist you with your device unlock request. We have initiated a contract eligibility check under Case Number [Case Number] for line [Mobile Number]. To complete this process smoothly, please reply to this thread with your device's exact IMEI number (which you can find by dialing *#06# on your phone keypad).\n\nOnce we verify your contract status, we will provide the official network unlock code and step-by-step instructions.\n\nBest regards,\n[Agent Name]",
    
    "HOAX CALL/SMS": "Dear Customer,\n\nThank you for reporting this unverified incident to our security operations team. We appreciate your vigilance in keeping our network safe.\n\nWe take phishing, scam messaging, and fraudulent calls very seriously. We have logged the details you provided under tracking Case Number [Case Number] and forwarded the offending number to our network fraud division for investigation and potential blacklisting.\n\nPlease remember never to share sensitive verification PINs, passwords, or personal financial details with unverified contacts.\n\nBest regards,\n[Agent Name]\nCorporate Fraud Investigation Division",
    
    "HOME PREPAID WIFI": "Dear Customer,\n\nThank you for contacting us regarding your Home Prepaid Wi-Fi gateway device.\n\nWe want to ensure your home network runs smoothly and reliably. We have checked your router's registration status under Case Number [Case Number] and verified that the network configuration is healthy. If you are experiencing slow speeds, please try moving your Wi-Fi modem near a window to improve its signal reception from nearby towers.\n\nYou can easily track your data usage and buy add-on packages by logging into our self-care app while connected to your home Wi-Fi network.\n\nBest regards,\n[Agent Name]",
    
    "INABILITY TO CALL THE HOTLINE/SPECIAL NUMBER": "Dear Customer,\n\nThank you for contacting us regarding dial routing restrictions when calling special short-code numbers on line [Mobile Number].\n\nWe have checked your profile settings under Case Number [Case Number]. Some corporate lines or standard mobile plans require specific premium dialing features to be explicitly enabled to call external hotlines or premium short-code numbers. Please reply to this thread confirming if this is an enterprise-approved service request.\n\nOnce confirmed, we will activate the necessary routing flags on our network switch.\n\nBest regards,\n[Agent Name]",
    
    "INABILITY TO REGISTER": "Dear Customer,\n\nThank you for contacting us regarding your plan package registration concern on line [Mobile Number].\n\nWe want to help you get your package up and running smoothly. We have refreshed your profile configuration on our online commerce system under Case Number [Case Number] to resolve any registration glitches. Please make sure you have sufficient wallet balance or unallocated plan limits before trying to register again.\n\nIf you still see errors, please reply with the exact error code or prompt you receive.\n\nBest regards,\n[Agent Name]",
    
    "INTERNATIONAL ROAMING- ACTIVATION": "Dear Customer,\n\nThank you for reaching out to ensure your mobile services run smoothly while traveling abroad. We are happy to help you set up your roaming features.\n\nWe have initiated the international roaming activation process for line [Mobile Number] under reference Case Number [Case Number]. This updates your cellular profile across our global partner networks. To ensure everything connects correctly, please restart your device once you arrive at your international destination to pick up the local partner network signal.\n\nHave a safe trip and thank you for choosing our services.\n\nBest regards,\n[Agent Name]",
    
    "INTERNATIONAL ROAMING- DEACTIVATION": "Dear Customer,\n\nThank you for reaching out to us upon your return. Welcome home!\n\nWe have successfully received your request to turn off international roaming features for line [Mobile Number], and we are tracking this under Case Number [Case Number]. We have restored your line configuration to our standard nationwide cellular networks to prevent any accidental international roaming charges.\n\nPlease turn your device off and back on again to refresh your connection to our local network towers.\n\nBest regards,\n[Agent Name]",
    
    "LIFTING:DATA": "Dear Customer,\n\nThank you for reaching out. We have received your request to restore mobile internet access on your account.\n\nWe are happy to inform you that the data restriction on line [Mobile Number] has been removed under Case Number [Case Number]. Your access to our high-speed internet networks is now fully restored.\n\nTo complete the connection refresh, please toggle your phone's Airplane Mode ON for 10 seconds and turn it back OFF.\n\nBest regards,\n[Agent Name]",
    
    "LIFTING:INCOMING/OUTGOING/DATA": "Dear Customer,\n\nThank you for contacting us regarding your account status. We are here to help restore your full mobile features.\n\nFollowing our secure financial and account review, we have successfully removed all voice, text, and data restrictions on line [Mobile Number] under reference Case Number [Case Number]. Your outgoing calls, messaging features, and high-speed internet access are now fully active.\n\nKindly restart your mobile phone to refresh your connection with our local cell towers.\n\nBest regards,\n[Agent Name]",
    
    "MENU UPDATE": "Dear Customer,\n\nThank you for contacting us regarding your SIM tool menu features on line [Mobile Number].\n\nWe have sent an over-the-air (OTA) update command to your SIM card under reference Case Number [Case Number] to refresh your network service options and application menus. To complete this menu update, please keep your device powered on and allow up to 15 minutes for the new configurations to install automatically.\n\nBest regards,\n[Agent Name]",
    
    "MOBILE APPLICATION": "Dear Customer,\n\nThank you for reaching out with your feedback about our mobile application platform experience.\n\nWe want to ensure your account management tools work perfectly. We have shared your app profile logs with our mobile development team under Case Number [Case Number] to resolve any performance lag or login issues. Please make sure you are using the latest version of the app by checking your device's app store.\n\nThank you for your patience as we optimize your digital workspace tools.\n\nBest regards,\n[Agent Name]",
    
    "OTHER PROCEDURAL CONCERN": "Dear Sir/Madam,\n\nThank you for contacting our corporate support desk. We are dedicated to providing clear, effective support for all your account needs.\n\nWe have received your procedural inquiry and logged it under reference Case Number [Case Number]. Your request has been passed to our dedicated account group for review. We will check our operational guidelines and follow up with a detailed response shortly.\n\nThank you for your partnership.\n\nBest regards,\n[Agent Name]",
    
    "PASALOAD": "Dear Customer,\n\nThank you for reaching out regarding our peer-to-peer balance sharing service.\n\nWe have checked your network configuration logs for line [Mobile Number] under Case Number [Case Number]. To ensure balance transfers work smoothly, please verify that your line has enough active credits and that the destination number is correct. Please note that standard transactions require a small transaction service fee.\n\nBest regards,\n[Agent Name]",
    
    "PAYMENT ARRANGEMENT": "Dear Corporate Partner,\n\nThank you for contacting us to coordinate your account payment schedule. We understand managing operational cash flows smoothly is important for your business.\n\nWe have logged your payment proposal under reference Case Number [Case Number]. Our corporate finance team is reviewing your requested payment terms against your account history. We will reach out to you within 2 business days to finalize your updated payment plan map.\n\nWe appreciate your partnership and clear communication.\n\nBest regards,\n\n[Agent Name]\nCredit Operations Division",
    
    "PAYMENT CHANNEL": "Dear Valued Customer,\n\nThank you for reaching out. We are happy to share our official payment channels to help you settle your statements easily.\n\nYou can securely make payments using credit cards, corporate online banking portals, or any authorized digital payment partner kiosk. To ensure your payment posts correctly, please use your exact Billing Account Number (BAN) or your mobile contract number during checkout.\n\nThis helpful reminder has been logged under reference Case Number [Case Number].\n\nBest regards,\n[Agent Name]",
    
    "PLAN DOWNGRADE/UPGRADE": "Dear Valued Customer,\n\nThank you for reaching out to adjust your plan allowance tiers to better match your current usage needs.\n\nWe have opened a contract configuration ticket under reference Case Number [Case Number] for your line [Mobile Number]. To complete this plan change smoothly, please reply to this thread confirming your choice of our updated plan options. Please note that changing your plan tier may adjust your contract terms or require a final reconciliation of your current billing cycle charges.\n\nWe look forward to updating your plan options soon.\n\nBest regards,\n[Agent Name]",
    
    "PLAN INCLUSION": "Dear Customer,\n\nThank you for contacting us regarding your current plan inclusions and built-in allowances.\n\nWe are happy to confirm your monthly plan structure under reference Case Number [Case Number]. Your line [Mobile Number] includes full access to your high-speed data pools, call minutes, and unlimited texting features. These allowances reset at the start of every billing cycle.\n\nYou can check your real-time usage balances anytime through our self-care mobile application.\n\nBest regards,\n[Agent Name]",
    
    "PRODUCT/PROMO INQUIRY": "Dear Customer,\n\nThank you for reaching out! We appreciate your interest in our latest product releases and promotional offers.\n\nWe have logged your inquiry under reference Case Number [Case Number]. We are happy to share that our current promotional updates offer enhanced data limits, corporate package discounts, and flexible device options tailored to your needs. Please find the attached brochure detailing our full service rates and inclusion guidelines.\n\nFeel free to reply if you would like assistance setting up these services.\n\nBest regards,\n[Agent Name]",
    
    "PROMO MECHANICS": "Dear Customer,\n\nThank you for contacting us for more details on our current promotional offers.\n\nWe have logged your inquiry under reference Case Number [Case Number]. To help you get the most out of this offer, please find the attached terms sheet outlining eligibility criteria, registration codes, and service validation steps. Please note that these promotional allowances remain active for a specific duration as noted in the guide.\n\nBest regards,\n[Agent Name]",
    
    "PROMO RATES/INCLUSION": "Dear Customer,\n\nThank you for reaching out to verify our latest promotional rates and service choices.\n\nWe have verified your request details under Case Number [Case Number]. Our corporate packages offer reduced long-distance rates and expanded shared data pools for your team. We have attached our complete rates sheet to this email for your reference.\n\nIf you would like to apply these promotional rates to your account, please let us know.\n\nBest regards,\n[Agent Name]",
    
    "PUK/PIN": "Dear Customer,\n\nThank you for reaching out. We understand your device is requesting a Personal Unblocking Key (PUK) to unlock your SIM card.\n\nTo help you restore service safely, we have generated your secure unblocking code under Case Number [Case Number]. \n\nYour secure PUK code for line [Mobile Number] is: [PUK Code].\n\nWhen prompted on your phone screen, enter this numeric code carefully. Please note that entering the wrong PUK code 10 times will permanently lock your SIM card for security reasons, which would require a SIM replacement.\n\nBest regards,\n[Agent Name]",
    
    "REFUND": "Dear Customer,\n\nThank you for contacting us regarding your account refund request.\n\nWe want to ensure all financial transactions are processed accurately. We have initiated a formal refund review under reference Case Number [Case Number] for line [Mobile Number]. Our finance department will audit the billing records and transaction receipts you provided.\n\nThis verification cycle takes approximately 7 to 14 business days to clear, and we will update you as soon as the credit adjustment is applied.\n\nBest regards,\n\n[Agent Name]\nCorporate Finance & Accounting Desk",
    
    "REGISTRATION PROCEDURE": "Dear Customer,\n\nThank you for reaching out for assistance with your service configuration registration steps.\n\nWe are here to help guide you through the setup process. We have logged this walkthrough under reference Case Number [Case Number]. To complete your registration smoothly, please visit our online portal, enter your mobile contract number, and verify your profile using the one-time PIN sent to your device.\n\nIf you experience any issues during setup, please let us know.\n\nBest regards,\n[Agent Name]",
    
    "RELOADING PROCEDURE": "Dear Customer,\n\nThank you for reaching out for assistance with reloading your prepaid account balances.\n\nWe have logged this walkthrough guide under reference Case Number [Case Number]. You can instantly add balance credits to line [Mobile Number] by dialing our balance management short-code numbers, using our self-care app, or visiting any authorized payment partner kiosk.\n\nSimply choose your preferred payment method, enter your mobile number, and your credits will balance immediately.\n\nBest regards,\n[Agent Name]",
    
    "RELOADING:DELAYED CONFIRMATION MESSAGE": "Dear Customer,\n\nThank you for letting us know about the network text confirmation delay for your recent reload transaction.\n\nWe have checked our network commerce switches under reference Case Number [Case Number]. We confirm that your reload balance was successfully credited to line [Mobile Number]. Localized messaging traffic spikes can sometimes delay text confirmations, but your balance is fully updated and ready to use.\n\nYou can verify your updated balance anytime via our self-care app.\n\nBest regards,\n[Agent Name]",
    
    "RELOADING:INABILITY TO RELOAD": "Dear Customer,\n\nThank you for reaching out regarding the reloading error you encountered on line [Mobile Number].\n\nWe want to ensure your prepaid access works smoothly. We have refreshed your commerce connection flags under reference Case Number [Case Number] to clear any system communication locks. Please try reloading your account again using an alternate payment channel or an online digital desk.\n\nIf the issue persists, please reply with the exact error prompt or transaction receipt details.\n\nBest regards,\n[Agent Name]",
    
    "RELOADING:MULTIPLE DEDUCTION": "Dear Customer,\n\nThank you for contacting us regarding duplicate transaction deductions on your recent reload purchase.\n\nWe want to ensure your balances are accurate. We have opened a financial reconciliation ticket under reference Case Number [Case Number] to review the transactions for line [Mobile Number]. If our audit confirms duplicate deductions for a single transaction, rest assured we will credit the extra balance back to your account profile immediately.\n\nThank you for your patience as we complete this verification check.\n\nBest regards,\n[Agent Name]\nReconciliation Engineering Group",
    
    "RELOADING:NO CONFIRMATION MESSAGE": "Dear Customer,\n\nThank you for contacting us to confirm your recent reload transaction status.\n\nWe confirm that your reload purchase was successfully credited to line [Mobile Number] under tracking Case Number [Case Number]. While network messaging lags may have prevented the automated text confirmation from delivering, your balance is fully updated and active on our network switches.\n\nBest regards,\n[Agent Name]",
    
    "RELOADING:UNCREDITED LOAD": "Dear Customer,\n\nThank you for reaching out regarding a balance update discrepancy on line [Mobile Number].\n\nWe want to help resolve this quickly. We have opened a commerce transaction trace under reference Case Number [Case Number]. To help us locate and credit your balance, please reply to this thread with a copy of your purchase receipt, the transaction reference number, and the date of purchase.\n\nOnce verified, we will manually post the missing credit to your account.\n\nBest regards,\n[Agent Name]",
    
    "REPLACEMENT:DEVICE": "Dear Valued Customer,\n\nThank you for contacting us regarding your corporate device asset replacement options.\n\nWe have opened a device tracking ticket under reference Case Number [Case Number] for line [Mobile Number]. To help us process your equipment replacement smoothly, please reply with your current delivery address, contact name, and a brief description of the technical issues you are experiencing with your current device.\n\nOur fulfillment desk will review your warranty coverage and update you on the delivery schedule.\n\nBest regards,\n[Agent Name]\nFulfillment Operational Logistics Desk",
    
    "RETAILER INCENTIVE": "Dear Distribution Partner,\n\nThank you for contacting us regarding your retailer commission and network incentive balances.\n\nWe appreciate your partnership in expanding our network reach. We have logged your transaction query under reference Case Number [Case Number]. Our partner rewards team is auditing your distribution targets for this sales cycle to ensure all incentives are accurately calculated.\n\nYour updated balances will be credited to your partner wallet within 3 business days.\n\nBest regards,\n[Agent Name]\nChannel Partner Operations Group",
    
    "RETENTION": "Dear Valued Customer,\n\nThank you for reaching out to us. We truly value your business and are committed to providing you with the best long-term service experience.\n\nWe have opened an account review file under reference Case Number [Case Number] for line [Mobile Number]. We want to ensure your plan options match your needs perfectly. An account specialist will contact you directly within 24 hours to present our latest contract renewal loyalty offers and exclusive plan rewards.\n\nThank you for your continued trust in our network.\n\nBest regards,\n\n[Agent Name]\nCustomer Loyalty & Retention Group",
    
    "REWARDS": "Dear Customer,\n\nThank you for contacting us regarding your loyalty rewards account points and redemption choices.\n\nWe are happy to confirm your rewards profile is healthy under tracking Case Number [Case Number]. Your accumulated loyalty points are fully active on line [Mobile Number]. You can easily browse our latest rewards catalog and redeem points for data packages, bill credits, or retail vouchers directly through our mobile application.\n\nBest regards,\n[Agent Name]",
    
    "SELF CARE CHANNEL": "Dear Customer,\n\nThank you for reaching out. We are glad to help you set up your automated self-care tools.\n\nUsing our self-care channels lets you check your real-time data usage, view statements, and activate add-on services anytime without waiting in phone queues. This guide has been documented under reference Case Number [Case Number] for line [Mobile Number].\n\nSimply download our app from your device's application store to get started.\n\nBest regards,\n[Agent Name]",
    
    "SERVICE CONTRACT": "Dear Customer,\n\nThank you for contacting us regarding your corporate service contract terms and commitment schedules.\n\nWe have retrieved your contract profile records under reference Case Number [Case Number] for line [Mobile Number]. Your agreement terms, plan parameters, and tenure dates are securely archived in our database. If you require an official copy of your signed contract documents, please let us know so we can request them from our legal archives.\n\nBest regards,\n[Agent Name]",
    
    "SERVICE DOWNTIME:CALL": "Dear Customer,\n\nThank you for contacting us regarding voice service interruptions in your area.\n\nWe apologize for any disruption this has caused. We have opened a technical ticket under reference Case Number [Case Number] to check local tower connections for line [Mobile Number]. Our engineers are currently working on tower optimization and maintenance to restore full voice calling quality as quickly as possible.\n\nThank you for your patience as we complete these network updates.\n\nBest regards,\n[Agent Name]\nNetwork Operations Control Division",
    
    "SERVICE DOWNTIME:LOADING": "Dear Customer,\n\nThank you for letting us know about current delays with our prepaid loading services.\n\nWe apologize for the inconvenience. Our systems desk is currently updating our commercial transaction servers under reference Case Number [Case Number] to resolve intermittent processing drops. Our team is working to restore full loading speeds quickly.\n\nYour transactions are safe, and any pending loads will post automatically as soon as the update completes.\n\nBest regards,\n[Agent Name]",
    
    "SERVICE DOWNTIME:REGISTRATION": "Dear Customer,\n\nThank you for reaching out regarding package registration errors you encountered.\n\nWe apologize for any technical glitches. Our maintenance team is running system updates on our profile servers under tracking Case Number [Case Number]. If you receive an error while registering for a package, please allow a short time for system updates to complete before trying again.\n\nBest regards,\n[Agent Name]",
    
    "SERVICE DOWNTIME:SMS": "Dear Customer,\n\nThank you for letting us know about message delivery lags in your area.\n\nWe have logged these details under technical reference Case Number [Case Number] to check the status of your local cell tower. Our engineers are optimizing nearby messaging gateways to resolve text message delivery lags as quickly as possible.\n\nThank you for your patience as we work to restore standard delivery performance.\n\nBest regards,\n[Agent Name]",
    
    "SERVICE DOWNTIME:VAS": "Dear Customer,\n\nThank you for contacting us regarding value-added service application access lags.\n\nOur service operations team is run-checking database connections under reference Case Number [Case Number] to resolve network communication lags on our value-added service platforms. We are working to restore full application access shortly.\n\nBest regards,\n[Agent Name]",
    
    "SIM UPGRADE": "Dear Customer,\n\nThank you for reaching out to upgrade your SIM card configuration to get the best network performance.\n\nUpgrading your SIM card ensures full access to our high-speed 5G network channels. We have opened an upgrade ticket under reference Case Number [Case Number] for line [Mobile Number]. Please visit your nearest store with a valid ID to pick up your new upgraded SIM card.\n\nYour phone number and plan inclusions will remain exactly the same after the upgrade.\n\nBest regards,\n[Agent Name]",
    
    "SMS CONNECTIVITY:INCOMING": "Dear Customer,\n\nThank you for contacting us regarding inbound text message delivery concerns on line [Mobile Number].\n\nWe want to ensure you receive all your messages reliably. We have refreshed your inbound routing profiles on our core SMS gateway under reference Case Number [Case Number]. To update these changes, please turn your mobile device off for 30 seconds and restart it to clear out any delayed message queues.\n\nBest regards,\n[Agent Name]",
    
    "SMS CONNECTIVITY:MULTIPLE": "Dear Customer,\n\nThank you for contacting us regarding duplicate text message notifications on your device.\n\nReceiving multiple copies of the same message can happen if a local tower handoff lag prevents your device from sending a delivery receipt back to our network gateway. We have reset your messaging session under reference Case Number [Case Number] for line [Mobile Number] to stabilize these delivery signals.\n\nKindly restart your device to apply this configuration update.\n\nBest regards,\n[Agent Name]",
    
    "SMS CONNECTIVITY:DELAYED": "Dear Customer,\n\nThank you for reaching out regarding text message delivery delays on line [Mobile Number].\n\nWe understand that timely message delivery is critical. We have logged this concern under reference Case Number [Case Number] and cleared the temporary data cache on your network line. This helps clear out delivery bottlenecks on the network switch.\n\nPlease ensure your device has a strong signal connection to clear any remaining message delays.\n\nBest regards,\n[Agent Name]",
    
    "SMS CONNECTIVITY:OUTGOING": "Dear Customer,\n\nThank you for contacting us regarding outbound text message issues on line [Mobile Number].\n\nWe have reviewed your profile under reference Case Number [Case Number] and confirmed your account status is healthy. Please verify that your device's settings menu shows the correct central SMS Service Center Number configuration. \n\nIf you need help checking this number, please reply with your device model details.\n\nBest regards,\n[Agent Name]",
    
    "SMS CONNECTIVITY:PREMIUM SMS": "Dear Customer,\n\nThank you for contacting us regarding premium messaging and short-code subscription configurations on your account.\n\nWe have updated your short-code routing preferences under reference Case Number [Case Number] for line [Mobile Number]. If you are missing verification short-codes or banking notifications, we will verify that premium content delivery is fully enabled on your profile.\n\nBest regards,\n[Agent Name]",
    
    "SOA:BILL REPRINT": "Dear Valued Customer,\n\nThank you for requesting an invoice statement copy for your business account records.\n\nWe have processed your invoice request under reference Case Number [Case Number]. Attached to this email is a secure PDF copy of your requested statement of account for line [Mobile Number]. You can open and view this file using standard PDF reader software.\n\nBest regards,\n[Agent Name]",
    
    "SOA:E-STATEMENT": "Dear Customer,\n\nThank you for opting into our digital e-statement delivery service for paperless billing.\n\nWe have activated electronic billing profiles for your account under reference Case Number [Case Number] for line [Mobile Number]. Moving forward, your statement notifications will deliver directly to this verified email address at the close of every billing cycle.\n\nThank you for choosing paperless billing to support our environmental initiatives.\n\nBest regards,\n[Agent Name]",
    
    "STATUS: ACCOUNT": "Dear Customer,\n\nThank you for reaching out to check your account configuration status logs.\n\nWe have retrieved your account details under reference Case Number [Case Number]. We are happy to confirm that your account for line [Mobile Number] is in good standing and fully active on our nationwide network. There are no service restrictions or block flags applied to your profile.\n\nBest regards,\n[Agent Name]",
    
    "SOA:NON RECEIPT/DELAYED": "Dear Customer,\n\nWe apologize for the delay in the delivery of your monthly statement of account invoice.\n\nWe want to ensure you always have access to your billing details. We have opened a delivery tracking ticket under reference Case Number [Case Number] to look into this billing delay. In the meantime, we have attached a digital copy of your latest statement to this email for your immediate review.\n\nBest regards,\n[Agent Name]",
    
    "SUBSCRIBER TAG STATUS:NO SERVICE": "Dear Customer,\n\nThank you for contacting us regarding the 'No Service' status indicator on your device.\n\nWe understand how critical it is to restore your connection. We have run a deep-cycle profile sync on our cellular registers under reference Case Number [Case Number] to re-register line [Mobile Number] on nearby towers. \n\nPlease turn your device completely off, remove and clean your SIM card surface, then reinsert it and turn the device back on to restore service.\n\nBest regards,\n[Agent Name]",
    
    "UNBLOCKING OF DEALER/RETAILER SIM": "Dear Partner,\n\nThank you for contacting our channel partner operations desk to restore access to your distribution line.\n\nWe have verified your partner registration profile under reference Case Number [Case Number]. The access block on your retail management SIM card has been removed. Your merchant wallet functions and loading tools are now fully active.\n\nKindly restart your terminal to resume normal operations.\n\nBest regards,\n[Agent Name]\nPartner Channel Operations Division",
    
    "VAS CANCELLATION": "Dear Customer,\n\nThank you for reaching out to manage your premium subscriptions and value-added services.\n\nWe confirm that all active value-added service (VAS) premium subscriptions on line [Mobile Number] have been successfully canceled under reference Case Number [Case Number]. This prevents any future recurring subscription charges from being applied to your statement.\n\nBest regards,\n[Agent Name]",
    
    "VAS TECH:VAS CANCELLATION": "Dear Customer,\n\nThank you for reaching out to our technical desk to remove value-added service application flags.\n\nWe have sent a configuration update to our subscription gateway under reference Case Number [Case Number] to clear all active VAS features from line [Mobile Number]. This technical adjustment removes the line from subscription billing lists permanently.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group",
    
    "VAS TECH:UNABLE TO REGISTER": "Dear Customer,\n\nThank you for contacting our technical solutions group regarding value-added service registration errors on line [Mobile Number].\n\nWe have reviewed our application gateway configurations under reference Case Number [Case Number] and updated your line permission tags to clear any registration errors. Please try registering for your value-added service package again.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group",
    
    "VOICE CONNECTIVITY: INCOMING": "Dear Customer,\n\nThank you for contacting us regarding inbound call routing concerns on line [Mobile Number].\n\nWe want to ensure you can receive all your calls reliably. We have refreshed your inbound call routing profile on our central network switches under reference Case Number [Case Number] to clear out any routing lags. \n\nPlease toggle your device's Airplane Mode ON for 10 seconds, then turn it back OFF to sync these network changes.\n\nBest regards,\n[Agent Name]",
    
    "VOICE CONNECTIVITY: OUTGOING": "Dear Customer,\n\nThank you for contacting us regarding outbound call routing concerns on line [Mobile Number].\n\nWe have reviewed your plan parameters under reference Case Number [Case Number] and confirmed your outbound calling features are active with no account restrictions. To clear temporary network handoff loops, please go to your device settings menu, turn off 'VoLTE' temporarily, and try placing an outbound call again.\n\nBest regards,\n[Agent Name]",
    
    "VOICE QUALITY": "Dear Customer,\n\nThank you for reaching out regarding voice call quality and audio clarity concerns in your area.\n\nWe want to ensure your calls are clear and reliable. We have logged your area coordinates under tracking reference Case Number [Case Number] to run an audio clarity audit on nearby cell towers. Our team will optimize local signal handoff settings to improve call quality in your area.\n\nBest regards,\n[Agent Name]\nNetwork Engineering Group",
    
    "BALANCE: AMOUNT TO SETTLE": "Dear Customer,\n\nThank you for contacting us to verify your total outstanding balance due for settlement.\n\nAs of our latest statement cycle check under tracking reference Case Number [Case Number], the total balance to settle on account line [Mobile Number] is [Amount]. You can safely complete payment through any authorized corporate digital channel or local partner banking app.\n\nBest regards,\n[Agent Name]",
    
    "DISSATISFACTION": "Dear Valued Customer,\n\nThank you for sharing your candid experience with us. We hold our service standards to the highest levels and sincerely apologize that we did not meet your expectations this time.\n\nWe have escalated your feedback directly to our operations management group under reference Case Number [Case Number]. An executive support manager will review your account timeline to address your concerns and ensure a better service experience moving forward.\n\nThank you for helping us improve our services.\n\nBest regards,\n\n[Agent Name]\nOffice of Customer Experience Management",
    
    "MNP INQUIRY": "Dear Customer,\n\nThank you for reaching out to inquire about our Mobile Number Portability (MNP) options to switch your service network.\n\nWe are happy to provide information on how to switch networks while keeping your existing phone number. This inquiry track has been documented under reference Case Number [Case Number]. To complete an MNP transfer smoothly, you will need to request a Unique Porting Code (UPC) from your current network provider and ensure your line has no outstanding balances.\n\nWe look forward to welcoming you to our network.\n\nBest regards,\n[Agent Name]\nMobile Portability Specialist Team",
    
    "SUCCESSFUL MNP INTERPORT-IN (TO POSTPAID)": "Dear Customer,\n\nWe are excited to welcome you to our network family! Thank you for choosing our enterprise postpaid services.\n\nWe are happy to inform you that your Mobile Number Portability (MNP) transfer has successfully cleared our network switch under reference Case Number [Case Number]. Your original mobile number is now fully active on your new postpaid plan profile. \n\nKindly insert your new SIM card into your device to start using your high-speed data, call, and text allowances.\n\nBest regards,\n[Agent Name]\nPostpaid Onboarding Specialist Desk",
    
    "SUCCESSFUL MNP INTERPORT-IN (TO PREPAID)": "Dear Customer,\n\nWelcome to our network family! Thank you for porting your mobile line over to our prepaid network services.\n\nWe confirm that your Mobile Number Portability (MNP) switch has successfully cleared under reference Case Number [Case Number]. Your original mobile number is now active on our prepaid network switch. You can now load your line and register for our high-speed data promos through our self-care mobile app.\n\nBest regards,\n[Agent Name]",
    
    "SUCCESSFUL MNP INTRAPORT (TO POSTPAID)": "Dear Customer,\n\nThank you for choosing to upgrade your prepaid account line over to our premium postpaid plan choices.\n\nWe are happy to confirm that your intra-network plan adjustment has successfully processed under reference Case Number [Case Number] for line [Mobile Number]. Your account profile has been updated to our postpaid network billing system, and your plan inclusions are now active.\n\nYour first regular statement invoice will generate on your next cycle cutoff date.\n\nBest regards,\n[Agent Name]",
    
    "SUCCESSFUL MNP INTRAPORT (TO PREPAID)": "Dear Customer,\n\nThank you for contacting us regarding your account plan adjustment request.\n\nThis is to confirm that your internal plan modification to convert line [Mobile Number] over to our prepaid service network has completed successfully under reference Case Number [Case Number]. Any remaining postpaid billing balances have been calculated for your final statement closing invoice.\n\nYou can now load your line using standard prepaid reload channels.\n\nBest regards,\n[Agent Name]",
    
    "MNP SIM ACTIVATION": "Dear Customer,\n\nThank you for contacting us regarding your mobile number portability SIM activation status.\n\nWe have initiated the network activation command for your ported line [Mobile Number] under tracking reference Case Number [Case Number]. This network configuration sync takes approximately 2 to 4 hours to clear across all systems.\n\nKindly keep your device turned off during this activation window, then restart it to complete the process.\n\nBest regards,\n[Agent Name]",
    
    "MNP SIM/DEVICE DELIVERY": "Dear Customer,\n\nThank you for choosing to port your services over to our network. We are hard at work preparing your new account kit.\n\nYour portability tracking profile and SIM kit delivery have been assigned to our courier dispatch under reference Case Number [Case Number]. Delivery takes approximately 3 to 5 business days. Please ensure a valid ID is available at your delivery location to securely accept the package.\n\nBest regards,\n[Agent Name]\nFulfillment Operational Logistics Desk",
    
    "UNSUCCESSFUL MNP (POSTPAID)-BILL ISSUES": "Dear Customer,\n\nThank you for contacting us regarding your pending Mobile Number Portability (MNP) transfer request.\n\nOur system validation check encountered an interruption under reference Case Number [Case Number] due to outstanding balance items flagged by your current service provider on line [Mobile Number]. \n\nTo resume your network transfer, please contact your current provider to settle all outstanding balances so they can clear your line for portability release.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (PREPAID)-BILL ISSUES": "Dear Customer,\n\nThank you for contacting us regarding your prepaid mobile number portability request status.\n\nOur validation team noted an interruption with your network transfer request under reference Case Number [Case Number] due to pending billing disputes or commercial transaction flags on your source line profile. Please clear these items with your current network provider so we can resume processing your transfer request.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (POSTPAID)–CHANGE OF MIND": "Dear Customer,\n\nThank you for reaching out to us regarding your pending postpaid network portability transfer request.\n\nWe have updated your request file under reference Case Number [Case Number] to note your decision to cancel the network transfer for line [Mobile Number]. Your current contract configuration will remain unchanged with no structural changes applied to your profile.\n\nShould you ever decide to explore our plan choices again in the future, we will be glad to assist you.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (PREPAID)–CHANGE OF MIND": "Dear Customer,\n\nThank you for contacting us regarding your pending prepaid portability request tracking profile.\n\nWe have noted your cancelation request under reference Case Number [Case Number] and closed your transfer file accordingly. Your line will remain active with your current provider with no network modifications applied.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (POSTPAID)-FINANCIAL REASON": "Dear Customer,\n\nThank you for reaching out to us regarding your postpaid portability request profile.\n\nWe have logged your account details under reference Case Number [Case Number]. Your transfer request encountered an interruption due to contract liability flags or financial parameters set by your current network provider. Please contact your provider's billing team to resolve these profile restrictions.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (PREPAID)-FINANCIAL REASON": "Dear Customer,\n\nThank you for contacting us regarding your prepaid mobile number portability request status.\n\nOur portability verification check was interrupted under reference Case Number [Case Number] due to merchant balance adjustments or financial flags reported on your source line profile. Please check with your current service provider to resolve these account restrictions.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PLAN OFFER": "Dear Customer,\n\nThank you for sharing your feedback with us regarding our current postpaid plan choices.\n\nWe want to ensure we find a plan option that fits your business needs and budget perfectly. We have logged your preferences under reference Case Number [Case Number] and passed your profile to an enterprise account specialist to explore custom plan options for your line [Mobile Number].\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (POSTPAID)-UNACCEPTABLE PROMO OFFER": "Dear Customer,\n\nThank you for your feedback regarding our current introductory promotional packages.\n\nWe want to provide the best value for your business. We have logged your comments under reference Case Number [Case Number] and passed them to our corporate product management group to help us refine and customize our future package offers.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (PREPAID)-UNACCEPTABLE PROMO OFFER": "Dear Customer,\n\nThank you for contacting us and sharing your thoughts on our current prepaid promotional offers.\n\nWe want to ensure our packages fit your usage needs perfectly. We have logged your feedback under reference Case Number [Case Number] and passed it to our prepaid marketing team as we continue to design and update our prepaid value bundles.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (POSTPAID)-TOOLS ISSUE": "Dear Customer,\n\nThank you for your patience as we process your postpaid mobile number portability request.\n\nOur system encountered a temporary technical sync lag while processing your transfer request under reference Case Number [Case Number]. Our technical teams are updating the system interface to fix this error and complete your transfer request shortly.\n\nWe will update you as soon as your line status updates.\n\nBest regards,\n[Agent Name]\nPortability Systems Engineering Desk",
    
    "UNSUCCESSFUL MNP (PREPAID)-TOOLS ISSUE": "Dear Customer,\n\nThank you for your patience as we process your prepaid portability switch profile.\n\nOur commerce systems encountered a temporary synchronization error while activating your ported line under reference Case Number [Case Number]. Our network specialists are resolving this technical issue to ensure your prepaid line updates across all platforms within 24 hours.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (POSTPAID)–UNDECIDED": "Dear Customer,\n\nThank you for contacting us regarding your pending postpaid mobile number portability file status.\n\nWe have placed your transfer application on a temporary hold status under reference Case Number [Case Number] to allow you full time to evaluate your plan options. Your transfer code remains valid for its standard activation window, and we are here to assist whenever you are ready to proceed.\n\nBest regards,\n[Agent Name]",
    
    "UNSUCCESSFUL MNP (PREPAID)–UNDECIDED": "Dear Customer,\n\nThank you for reaching out regarding your prepaid portability transfer status.\n\nWe have updated your file to a pending hold status under reference Case Number [Case Number] to give you more time to review your options. Please let us know whenever you are ready to resume processing your network switch.\n\nBest regards,\n[Agent Name]",
    
    "DISPUTE: DEVICE AMORTIZATION": "Dear Corporate Partner,\n\nThank you for raising your concern regarding device amortization installment items on your corporate statement.\n\nWe want to ensure your equipment financing metrics are completely accurate. We have opened a full billing audit under reference Case Number [Case Number] for line [Mobile Number]. Our financial operations team will review your original handset subsidy agreement and payment history to verify these charges.\n\nWe will update you with our findings within 2 business days.\n\nBest regards,\n\n[Agent Name]\nCorporate Asset Management Group",
    
    "VOLTE/VOWIFI ISSUE": "Dear Customer,\n\nThank you for contacting our technical solutions group regarding your Voice over LTE (VoLTE) and Voice over Wi-Fi (VoWiFi) calling configurations.\n\nWe want to ensure you enjoy HD-quality voice calls. We have verified your profile under reference Case Number [Case Number] and confirmed your advanced calling features are enabled. To complete setup on your device, please go to your device Cellular Settings menu, turn 'VoLTE/Wi-Fi Calling' ON, and verify you are connected to a stable network or Wi-Fi source.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group",
    
    "GENERAL INQUIRY": "Dear Customer,\n\nThank you for reaching out to our corporate help desk. We appreciate your message and are here to help.\n\nWe have received your general account inquiry and documented it under reference Case Number [Case Number]. Our team is gathering the requested information based on your account profile, and we will follow up with a clear, complete answer shortly.\n\nBest regards,\n[Agent Name]",
    
    "SIM REGISTRATION": "Dear Customer,\n\nThank you for contacting us regarding the official registration status of your SIM card profile.\n\nIn compliance with statutory regulatory standards, we confirm that your profile data for line [Mobile Number] has been successfully validated and is securely updated in our network database under tracking reference Case Number [Case Number]. Your line is fully compliant with all current registration requirements.\n\nThank you for your cooperation in keeping our network secure.\n\nBest regards,\n[Agent Name]\nRegulatory Compliance Registry Desk",
    
    "SIM REG: SIM VALIDITY EXTENSION": "Dear Customer,\n\nThank you for contacting us regarding SIM card validity parameters and timeline extension options for line [Mobile Number].\n\nWe have updated your line configuration under reference Case Number [Case Number]. Your account profile has been refreshed to reflect the extended account validity timeline based on your current corporate usage. This ensures your line remains fully active and connected to our network towers.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: EXERCISE OF RIGHTS": "Dear Customer,\n\nThank you for contacting our privacy compliance desk regarding your personal data verification rights under SIM registration frameworks.\n\nWe respect your data privacy and individual rights. We have logged your request profile under reference Case Number [Case Number]. Our privacy officers will assist you with verifying, updating, or reviewing your registered identity records securely.\n\nBest regards,\n[Agent Name]\nData Privacy Compliance Officer",
    
    "SIM REG: BARRING DUE TO LOST/STOLEN SIM": "Dear Customer,\n\nWe are sorry to hear about your lost device, and we are moving quickly to protect your registered personal information.\n\nIn line with security standards, we have placed an immediate protective block on your registered line profile [Mobile Number] under reference Case Number [Case Number]. This locks all outbound calling, text messaging, and data usage features to protect your personal information from unauthorized access.\n\nWe are ready to assist you with a secure SIM replacement whenever you are ready.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: LIFTING DUE TO FOUND SIM": "Dear Customer,\n\nWe are glad to hear that you have safely recovered your device! Let's get your services restored.\n\nFollowing our secure profile verification check under reference Case Number [Case Number], we have removed the protective security block on line [Mobile Number]. Your voice calling, text messaging, and mobile internet features are now fully restored.\n\nKindly restart your phone to refresh its connection to nearby cell towers.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: BARRING DUE TO DEATH of OWNER": "Dear Customer,\n\nWe offer our deepest condolences to you and your family during this difficult time.\n\nTo secure the account profile, we have placed a protective service lock on line [Mobile Number] under tracking reference Case Number [Case Number]. This keeps the account secure while estate transitions are completed. Please let us know if you need assistance with account closure or transferring the line to another family member.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: TRANSFER OF OWNERSHIP": "Dear Customer,\n\nThank you for contacting us to coordinate a transfer of ownership and update your registered account profile.\n\nWe have initiated the transfer tracking process under reference Case Number [Case Number] for line [Mobile Number]. To complete this registration update in compliance with regulatory standards, please reply to this thread with a copy of the signed transfer agreement and valid IDs for both parties.\n\nOnce received, we will update the network registry records within 24 hours.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: DEACTIVATION DUE TO DEATH of OWNER": "Dear Customer,\n\nWe extend our deepest condolences to you and your family for your loss.\n\nWe have processed the permanent deactivation and account closure for line [Mobile Number] under reference Case Number [Case Number] as requested. This stops future billing cycles and removes the profile from our active network switches.\n\nWe appreciate you taking the time to update our records.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: PERMANENT DEACTIVATION": "Dear Customer,\n\nThank you for contacting us to confirm your permanent line deactivation request.\n\nWe have processed the permanent deactivation request for line [Mobile Number] under reference Case Number [Case Number]. This removes the line profile from our active subscriber network registry. Please note that any remaining balances will be compiled on a final statement invoice sent to your email.\n\nThank you for choosing our services.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: UPDATE NAME": "Dear Customer,\n\nThank you for reaching out to correct the name on your account profile registry.\n\nWe have logged your name adjustment request under reference Case Number [Case Number] for line [Mobile Number]. To ensure our records are accurate, please reply to this thread with a copy of a marriage certificate, court decree, or valid government ID showing your correct name.\n\nWe will update your registry profile as soon as we verify your documents.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: UPDATE ADDRESS": "Dear Customer,\n\nThank you for contacting us to update your primary residential address on your registration profile.\n\nWe have opened an address modification ticket under reference Case Number [Case Number] for line [Mobile Number]. To update our database records, please reply to this thread with a copy of your updated address details or a recent utility statement for verification.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: UPDATE BIRTHDATE": "Dear Customer,\n\nThank you for contacting us to correct the birthdate listed on your network registry profile.\n\nWe have logged your update request under reference Case Number [Case Number] for line [Mobile Number]. To help us correct this typo in our database, please reply with a copy of a valid government ID or birth certificate showing your correct birthdate.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: UPDATE ID": "Dear Customer,\n\nThank you for reaching out to update your identification documents on file in our network registry.\n\nWe have logged your document update request under reference Case Number [Case Number] for line [Mobile Number]. Please reply directly to this secure thread with a clear copy of your updated government ID card to ensure your profile remains verified.\n\nOnce received, our database team will update your records within 24 hours.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: LIFTING OF BARRING DUE TO TRANSFER OF OWNERSHIP": "Dear Customer,\n\nThank you for completing the registration profile updates for your line transfer.\n\nWe are happy to confirm that the transfer validation check is complete, and the service block on line [Mobile Number] has been removed under reference Case Number [Case Number]. Your line features are now fully active under the updated owner profile.\n\nKindly restart your device to refresh your connection to the network.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: LIFTING OF BARRING DUE TO SIM REPLACEMENT": "Dear Customer,\n\nThank you for verifying your identity profile and completing your secure SIM replacement steps.\n\nWe have successfully removed the protective security block on your account under reference Case Number [Case Number]. Your original phone number [Mobile Number] is now active on your new SIM card with all voice, text, and data features fully restored.\n\nPlease insert your new SIM card into your device to complete the activation process.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: REGULATORY TEMPO DISCON": "Dear Customer,\n\nThis is an operational notification regarding a temporary regulatory status block applied to your line profile.\n\nIn compliance with statutory registration requirements, line [Mobile Number] has been placed on a temporary suspension status under reference Case Number [Case Number] pending profile updates. Outgoing services have been temporarily paused until registration information is updated.\n\nTo restore full services, please reply with your updated registration details so we can verify your profile.\n\nBest regards,\n[Agent Name]",
    
    "SIM REG: RECONNECTION FROM TEMPO DISCON": "Dear Customer,\n\nThank you for providing your updated registration information to our compliance desk.\n\nWe have successfully verified your registration profile under reference Case Number [Case Number]. The temporary regulatory suspension on line [Mobile Number] has been removed, and your full voice, text, and data features are now active.\n\nKindly restart your device to refresh your network connection.\n\nBest regards,\n[Agent Name]",
    
    "DATA CONNECTIVITY- 5G ENHANCEMENT RELATIONED": "Dear Customer,\n\nThank you for reaching out regarding mobile data performance and local 5G network enhancements.\n\nWe want to ensure you get the fast, high-quality network performance you expect. We have logged your location coordinates under reference Case Number [Case Number] to check local tower configurations. Our team is upgrading nearby cell sites to expand 5G coverage and improve network speeds in your area.\n\nThank you for your patience as we complete these network enhancements.\n\nBest regards,\n[Agent Name]\n5G Network Engineering Taskforce",
    
    "Waiver of Reconnection Fee": "Dear Valued Customer,\n\nThank you for contacting us regarding the standard account reconnection fee on your recent statement.\n\nWe appreciate your long-term partnership with us. As a gesture of support, we have submitted a manual billing adjustment under reference Case Number [Case Number] to waive the 300 reconnection fee for line [Mobile Number]. This adjustment credit will apply to your next monthly statement invoice automatically.\n\nBest regards,\n[Agent Name]\nEnterprise Billing Operations Group",
    
    "Case Management – Billing Dispute": "Dear Customer,\n\nThank you for raising your billing concern with us. We want to ensure your account statements are completely accurate.\n\nWe have opened a formal billing case under reference Case Number [Case Number] to audit your payment history and charges on line [Mobile Number]. Our financial operations team will review your account details against your contract terms.\n\nWe will contact you with our detailed findings within 2 business days.\n\nBest regards,\n\n[Agent Name]\nCase Management Division",
    
    "Customer Account Adjustment": "Dear Customer,\n\nThank you for reaching out. We are glad to update you on your financial adjustment request status.\n\nWe have successfully applied a balance credit adjustment to your account profile under reference Case Number [Case Number] for line [Mobile Number]. This balance credit will update on your account immediately and print as a deduction on your next monthly statement invoice.\n\nThank you for your patience throughout this verification check.\n\nBest regards,\n[Agent Name]\nFinancial Adjustments Desk",
    
    "DISPUTE ON MONETARY": "Dear Customer,\n\nThank you for contacting us regarding your billing statement dispute.\n\nWe want to ensure your financial transactions are completely accurate. We have opened a formal monetary dispute ticket under reference Case Number [Case Number] to look into the usage charges on line [Mobile Number]. Our accounting team will audit our system switches and billing logs for the disputed period.\n\nWe appreciate your patience while we complete this financial review.\n\nBest regards,\n[Agent Name]\nCorporate Financial Operations Group",
    
    "DISPUTE ON NON MONETARY": "Dear Customer,\n\nThank you for reaching out to us regarding your account profile dispute.\n\nWe have logged your concern under reference Case Number [Case Number] to review contract parameters, service options, or line configurations for [Mobile Number]. Our team will review your account history to resolve this operational concern.\n\nBest regards,\n[Agent Name]\nOperations Review Desk",
    
    "DEFECTIVE SIM": "Dear Customer,\n\nThank you for contacting us regarding technical issues with your SIM card on line [Mobile Number].\n\nIf your device displays error prompts like 'Insert SIM' or 'SIM Card Error', it typically points to a physical chip degradation or local connector issue. We have opened a technical replacement ticket under reference Case Number [Case Number]. Please visit your nearest store with a valid ID to pick up a free replacement SIM card to restore services quickly.\n\nBest regards,\n[Agent Name]\nTechnical Solutions Group",
    
    "3G SUNSET/NETWORK ENHANCEMENT": "Dear Customer,\n\nThank you for reaching out to us regarding our nationwide network upgrade and 3G sunset program.\n\nTo provide a faster, more reliable mobile experience, we are transitioning older network channels over to modern high-speed 4G LTE and 5G network towers. We have logged your device check under reference Case Number [Case Number]. To ensure you retain optimal voice and data quality, please make sure your device supports 4G/5G and that you are using an updated, 4G-capable SIM card.\n\nBest regards,\n[Agent Name]\nNetwork Modernization Taskforce"
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
      
      // 1. Render the structured workspace guidelines advice
      target.innerHTML = cloudData.htmlContent;
      
      // 2. Fetch the template directly from the database snapshot record
      const databaseTemplateText = cloudData.rawSpielText || "";
      updatePlaybookSpiel(concern, voc, databaseTemplateText);
      
      const panel = $('playbookPanel');
      if (panel) {
        panel.classList.add('panel-flash-active');
        setTimeout(() => panel.classList.remove('panel-flash-active'), 600);
      }
    } else {
      target.innerHTML = html + `• Follow standard processing vectors designated for ${voc}.<br><br><i style="color: var(--text-muted);">Note: Detailed cloud playbook sheet not yet compiled for this row.</i>`;
      updatePlaybookSpiel(concern, voc, ""); // Pass blank if missing
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
  const supervisorAdminPanel = $('supervisorAdminPanel');

  if (role === "SUPERVISOR") {
    // Hide standard agent documentation layout blocks from supervisors completely
    if (mainWorkspaceLayout) mainWorkspaceLayout.style.display = "none";
    if (viewPlaybooksDrawerBtn) viewPlaybooksDrawerBtn.style.display = "none";
    if (mobileActionDock) mobileActionDock.style.display = "none";
    
    // Explicitly make sure the Supervisor Dashboard is visible in full layout space
    if (supervisorAdminPanel) supervisorAdminPanel.style.display = "flex";
  } else {
    // Standard Agent routing logic layout initialization
    if (mainWorkspaceLayout) mainWorkspaceLayout.style.display = "grid";
    if (viewPlaybooksDrawerBtn) viewPlaybooksDrawerBtn.style.display = "block";
    if (mobileActionDock) mobileActionDock.style.display = "flex";
    
    // Hide Supervisor dashboard panel from agents completely
    if (supervisorAdminPanel) supervisorAdminPanel.style.display = "none";
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
      showSupervisorPanel();
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

function listenToSessionState() {
  const cachedId = localStorage.getItem("active_agent_session_id");
  
  document.querySelectorAll("input, textarea").forEach(el => {
    // Prevent wiping authentication fields on initialize state checks
    if (el.id !== 'authEmail' && el.id !== 'authPassword' && el.id !== 'authName') {
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
      
      isolateWorkspaceUI("SUPERVISOR");
      if ($('authModal')) $('authModal').style.display = "none";
      if ($('logoutBtn')) $('logoutBtn').style.display = "block";
      
      showSupervisorPanel();
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

  // IF THE CURRENT ACTIVE USER ID IS A SUPERVISOR, CLOSE THE PORTAL IMMEDIATELY WITH NO CONFIRMATION
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

  // Restore regular UI states default values safely
  localStorage.removeItem("active_agent_session_id");
  
  currentAgentId = null;
  currentAgentName = "Unknown Agent";
  currentAgentLob = "UNKNOWN";
  
  // Enforce rigid layout isolation rules to clean up workbench states entirely
  isolateWorkspaceUI("AGENT"); 
  
  // Fall straight back down into initial unauthorized state system prompt loops
  showLoginGateway(false);
  updateOutput();
  
  if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
  const spielPanel = $('playbookSpielContainer');
  if (spielPanel) spielPanel.innerHTML = "";
  
  renderHistoryView();
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
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  $('logoutBtn')?.addEventListener('click', terminateAgentSession);
  $('adminExtractSubmitBtn')?.addEventListener('click', executeSupervisorExtraction);
  
  // BYPASS INTERMEDIARY CONFIRMATION DRAWER FLOWS FOR INSTANT PORTAL TEARDOWN
  $('closeSupervisorBtn')?.addEventListener('click', () => { 
    executeLogOutRoutine();
  });
  
  $('exitPortalBtn')?.addEventListener('click', () => { 
    executeLogOutRoutine();
  });

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
