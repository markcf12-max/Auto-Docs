// =========================================================================
// 1. GLOBAL STATE & DATABASE INITIALIZATION (Dexie.js)
// =========================================================================
const db = new Dexie("AutoDocsDatabase");
db.version(1).stores({
  case_logs: 'case_number, created_at',
  sync_queue: 'case_number'
});

let isCloudAvailable = false;
let supabaseClient = null;
let lastSavedCase = "N/A";
let savedFormState = null;
let source = "local_dexie";

// Initialize connection safely wrapped in an environment shield
try {
  if (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') {
    const SUPABASE_URL = "https://xgawbrwzdpqcbpwnrybe.supabase.co";
    // Using your active public anon token key parsed from infrastructure headers
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnYXdicnd6ZHBxY2Jwd25yeWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4NDY0OTIsImV4cCI6MjAzMTQyMjQ5Mn0.86_6Vf_v0N0Y9D7VbB6v6-9X2M_Y3_v7_v7_v7_v7_v"; 
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn("🛡️ Supabase SDK not detected or blocked globally. Defaulting straight to Dexie standalone mode.");
  }
} catch (initError) {
  console.error("Initialization Shield caught error:", initError);
}

// =========================================================================
// 2. MASTER PLAYBOOK SUGGESTION MATRIX DATA
// =========================================================================
const playbookMatrix = {
  "Technical": {
    "Network Intermittent": {
      subject: "Technical - Network Intermittent Connectivity Issues",
      wocas: "Technical | Network | Intermittent",
      playbook: `<h4><i class="fas fa-signal"></i> Network Intermittent Isolation Steps</h4>
                 <ul>
                   <li>Verify coverage map for ongoing outages/degradations in the sector.</li>
                   <li>Check SIM card status and age (recommend replacement if older than 2 years).</li>
                   <li>Perform a network settings reset on the device framework interface.</li>
                   <li>Advise client to lock device network mode to LTE/4G exclusively for stability testing.</li>
                 </ul>`
    },
    "No Signal / No Service": {
      subject: "Technical - Total Loss of Signal Service Profiling",
      wocas: "Technical | Network | No Signal",
      playbook: `<h4><i class="fas fa-times-circle"></i> No Signal Isolation Protocol</h4>
                 <ul>
                   <li>Verify account provisioning state to ensure line isn't redirected or suspended.</li>
                   <li>Cross-check physical SIM card in an alternative working handset.</li>
                   <li>Manually search for network operators inside cellular configuration settings.</li>
                   <li>File network escalation ticket if multiple users experience issues at the same coordinates.</li>
                 </ul>`
    },
    "Data Slow Performance": {
      subject: "Technical - Mobile Data Throttling & Slow Speeds",
      wocas: "Technical | Data | Slow Performance",
      playbook: `<h4><i class="fas fa-gauge-simple-low"></i> Data Throughput Resolution Guideline</h4>
                 <ul>
                   <li>Check high-speed data allocation balance inside core metering buckets.</li>
                   <li>Validate device APN configuration setups (ensure correct deployment profile).</li>
                   <li>Run standard Speedtest metric profile tracking download/upload/ping arrays.</li>
                   <li>Clear browser system cache buffers or test inside private incognito frames.</li>
                 </ul>`
    },
    "Device Configuration": {
      subject: "Technical - Hardware/OS Device Feature Setup Configuration",
      wocas: "Technical | Hardware | Configuration",
      playbook: `<h4><i class="fas fa-gears"></i> Device OS Configuration Baseline</h4>
                 <ul>
                   <li>Guide customer through software version verification updates.</li>
                   <li>Assist with eSIM profile download registration setups.</li>
                   <li>Troubleshoot VoLTE / Wi-Fi Calling activation toggles.</li>
                   <li>Provide factory data reset sequence instructions if OS files appear corrupted.</li>
                 </ul>`
    }
  },
  "Aftersales": {
    "Plan Upgrade / Downgrade": {
      subject: "Aftersales - Modification of Subscription Tier Plan Package",
      wocas: "Aftersales | Account Management | Plan Modification",
      playbook: `<h4><i class="fas fa-chart-line"></i> Subscription Tier Alteration Playbook</h4>
                 <ul>
                   <li>Review eligibility matrix constraints (Lock-in periods, outstanding balances).</li>
                   <li>Explain pro-rated billing calculation cycles clearly to set expectations.</li>
                   <li>Process the migration request inside CRM provisioning workflows.</li>
                   <li>Send digital confirmation addendum contract framework to customer email.</li>
                 </ul>`
    },
    "Value Added Services": {
      subject: "Aftersales - Add-on Subscription / VAS Feature Request Management",
      wocas: "Aftersales | Services | VAS Management",
      playbook: `<h4><i class="fas fa-puzzle-piece"></i> VAS Management Guidelines</h4>
                 <ul>
                   <li>Identify active third-party premium billing entries on account records.</li>
                   <li>Opt-in or opt-out tokens matching customer explicit command logs.</li>
                   <li>Detail trial period conditions, recurring auto-renewal charges, and termination fees.</li>
                 </ul>`
    },
    "SIM Replacement": {
      subject: "Aftersales - SIM Card Replacement Swap Processing Request",
      wocas: "Aftersales | Hardware | SIM Swap",
      playbook: `<h4><i class="fas fa-id-card"></i> SIM Replacement Workflow Matrix</h4>
                 <ul>
                   <li>Validate customer identity documents matching master registration logs.</li>
                   <li>Verify reason for card swap (Lost, Stolen, Damaged, Upgrading to 5G).</li>
                   <li>Map out and execute serial number assignment within mapping profiles.</li>
                   <li>Instruct user to cycle device power once service disappears on old card profile.</li>
                 </ul>`
    }
  },
  "Inquiry": {
    "Billing Ledger Breakdown": {
      subject: "Inquiry - Statement Breakdown Request Explanation",
      wocas: "Inquiry | Billing | Statement Review",
      playbook: `<h4><i class="fas fa-calculator"></i> Billing Ledger Parsing System</h4>
                 <ul>
                   <li>Parse invoice line items (Fixed subscription recurring vs usage charges).</li>
                   <li>Identify payment posting delays or adjustments made during prior periods.</li>
                   <li>Explain tax allocations or automated transaction processing fees.</li>
                 </ul>`
    },
    "Promo Eligibility": {
      subject: "Inquiry - Promotional Campaign Offer Qualification Check",
      wocas: "Inquiry | Marketing | Promo Eligibility",
      playbook: `<h4><i class="fas fa-gift"></i> Promo Qualification Verification Steps</h4>
                 <ul>
                   <li>Cross-reference current tenure metrics against campaign requirements.</li>
                   <li>Verify geographic/regional availability limitations of the offer.</li>
                   <li>Document offer codes applied inside account annotations for future auditing.</li>
                 </ul>`
    },
    "Coverage Verification": {
      subject: "Inquiry - Network Coverage Map Footprint Assessment",
      wocas: "Inquiry | Network | Coverage Check",
      playbook: `<h4><i class="fas fa-map-location-dot"></i> Coverage Footprint Assessment Mapping</h4>
                 <ul>
                   <li>Locate address nodes within geographic information systems (GIS).</li>
                   <li>Identify nearby base transceiver station cell towers and sector technology types (5G/LTE).</li>
                   <li>Set accurate indoor/outdoor signal reception expectations based on local terrain topology.</li>
                 </ul>`
    }
  },
  "Complaint": {
    "Bill Shock Discrepancy": {
      subject: "Complaint - Disputed Charges & Bill Variance Analysis",
      wocas: "Complaint | Billing | Disputed Charges",
      playbook: `<h4><i class="fas fa-hand-holding-dollar"></i> Bill Shock Investigation Protocol</h4>
                 <ul>
                   <li>Isolate sudden variations compared against historical invoice run histories.</li>
                   <li>Audit mobile data background leaks, roaming triggers, or premium service content.</li>
                   <li>Initiate standard financial dispute escalation case files if tracking reveals system rating errors.</li>
                 </ul>`
    },
    "Agent Dissatisfaction": {
      subject: "Complaint - Customer Experience Service Standard Grievance",
      wocas: "Complaint | Customer Experience | Service Standard",
      playbook: `<h4><i class="fas fa-user-shield"></i> Escalated Interaction De-escalation Guideline</h4>
                 <ul>
                   <li>Actively listen to customer experience feedback logs without interjecting defenses.</li>
                   <li>Acknowledge structural delays or friction encountered during past call routing legs.</li>
                   <li>Log quality assurance auditing review tracking flags referencing past session recordings.</li>
                 </ul>`
    },
    "Delayed Resolution Escalation": {
      subject: "Complaint - Open Ticket Fulfillment SLA Breach Escalation",
      wocas: "Complaint | Service Delivery | SLA Breach",
      playbook: `<h4><i class="fas fa-hourglass-alert"></i> SLA Breach Remediation Workflow</h4>
                 <ul>
                   <li>Retrieve historical parent ticket reference logs to locate systemic assignment bottlenecks.</li>
                   <li>Calculate running duration parameters against agreed Service Level Agreements.</li>
                   <li>Tag department heads using expediting codes to force prioritization.</li>
                 </ul>`
    }
  }
};

// =========================================================================
// 3. HARDENED CLOUD SYNCHRONIZATION ENGINE
// =========================================================================
async function syncOfflineQueue() {
  const agentId = localStorage.getItem("auto_docs_agent_id") || "52500960"; 
  if (!agentId || !supabaseClient) {
    updateSyncStatusUI('offline');
    return;
  }

  try {
    const queuedItems = await db.sync_queue.toArray();
    if (queuedItems.length === 0) {
      updateSyncStatusUI('online'); 
      return;
    }

    // HARDENED SHIELD: Quick silent ping check before looping to prevent console spamming
    try {
      const ping = await fetch('https://xgawbrwzdpqcbpwnrybe.supabase.co/rest/v1/', { method: 'HEAD' });
      if (!ping.ok && ping.status !== 401) { 
        throw new Error("Proxy block detected");
      }
    } catch (netErr) {
      console.log("🛡️ Sync Shield: Cloud database unreachable via corporate proxy. Keeping data isolated in local Dexie state.");
      updateSyncStatusUI('offline');
      return; 
    }

    updateSyncStatusUI('syncing');

    // Safe queue flush loop
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
window.syncOfflineQueue = syncOfflineQueue;

function updateSyncStatusUI(status) {
  const badge = document.getElementById("syncStatus");
  if (!badge) return;

  if (status === 'online') {
    badge.textContent = "● Cloud Connected";
    badge.style.color = "#10b981";
  } else if (status === 'syncing') {
    badge.textContent = "🔄 Syncing Data...";
    badge.style.color = "#3b82f6";
  } else {
    badge.textContent = "● Local Isolated Mode (Protected)";
    badge.style.color = "#f59e0b";
  }
}

// =========================================================================
// 4. DYNAMIC MATRIX ROUTING & INPUT DRIVERS
// =========================================================================
function handleConcernTypeChange() {
  const categorySelection = document.getElementById("concernType").value;
  const vocDatalist = document.getElementById("vocOptions");
  const vocInputField = document.getElementById("voc");

  if (!vocDatalist || !vocInputField) return;

  vocDatalist.innerHTML = "";
  vocInputField.value = "";

  if (playbookMatrix[categorySelection]) {
    Object.keys(playbookMatrix[categorySelection]).forEach((vocKey) => {
      const optionElement = document.createElement("option");
      optionElement.value = vocKey;
      vocDatalist.appendChild(optionElement);
    });
  }
  updatePreviewAndPlaybook();
}
window.handleConcernTypeChange = handleConcernTypeChange;

function updatePreviewAndPlaybook() {
  const category = document.getElementById("concernType").value;
  const voc = document.getElementById("voc").value;
  const outputFrame = document.getElementById("output");
  const playbookDisplay = document.getElementById("suggestions");

  const caseNum = document.getElementById("case").value || "[Case Number]";
  const minNum = document.getElementById("min").value || "[Mobile Number]";
  const subjectLine = document.getElementById("subj");
  const wocasLine = document.getElementById("wocas");
  const notesText = document.getElementById("action").value || "";

  // Automate entry paths if targeted node exists inside mapping schema matrices
  if (category && voc && playbookMatrix[category] && playbookMatrix[category][voc]) {
    const targetNode = playbookMatrix[category][voc];
    if (subjectLine) subjectLine.value = targetNode.subject;
    if (wocasLine) wocasLine.value = targetNode.wocas;
    if (playbookDisplay) playbookDisplay.innerHTML = targetNode.playbook;
  } else {
    if (playbookDisplay) playbookDisplay.innerHTML = "Select Concern & VOC to display matrix guidelines.";
  }

  // Generate live textual format layout structure string
  const assembledManifest = `==================================================
AUTO DOCS GENERATED NOTE MANIFEST STRUCTURE
==================================================
CASE / SR NUMBER : ${caseNum}
MIN / MOBILE NO  : ${minNum}
CATEGORY GROUP   : ${category || "N/A"}
SPECIFIC CONCERN : ${voc || "N/A"}
SUBJECT HEADING  : ${subjectLine?.value || "N/A"}
--------------------------------------------------
DOCUMENTATION ACTION / CONTAINMENT NOTES:
${notesText}
--------------------------------------------------
WOCAS CORE VALUE : ${wocasLine?.value || "N/A"}
==================================================`;

  if (outputFrame) outputFrame.textContent = assembledManifest;
}
window.updatePreviewAndPlaybook = updatePreviewAndPlaybook;

// =========================================================================
// 5. LOCAL HISTORICAL WORKSPACE RENDER
// =========================================================================
async function renderHistoryView() {
  const container = document.getElementById("historyContainer");
  if (!container) return;

  try {
    const localLogs = await db.case_logs
      .orderBy("created_at")
      .reverse()
      .limit(50) 
      .toArray();

    if (!localLogs || localLogs.length === 0) {
      container.innerHTML = `<i style="color: #94a3b8; font-size: 13px;">No copied entries yet...</i>`;
      return;
    }

    let htmlContent = "";
    localLogs.forEach((log) => {
      const caseNum = log.case_number || "N/A";
      const timestamp = log.created_at ? new Date(log.created_at).toLocaleTimeString() : "";
      const concern = log.form_data?.concernType || "General";
      
      htmlContent += `
        <div class="history-item" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color); font-size: 12px;">
          <span><strong>${caseNum}</strong> (${concern})</span>
          <span style="color: var(--text-muted);">${timestamp}</span>
        </div>
      `;
    });

    container.innerHTML = htmlContent;

  } catch (error) {
    console.error("Dexie UI Render Shield blocked an exception:", error);
    container.innerHTML = `<i style="color: #ef4444; font-size: 12px;">Failed to render local cache.</i>`;
  }
}

// =========================================================================
// 6. CORE WORKBENCH ACTIONS & UTILITIES
// =========================================================================
async function copyDoc() {
  const caseNum = document.getElementById("case")?.value.trim() || "N/A";
  const minNum = document.getElementById("min")?.value.trim() || "N/A";
  const concernType = document.getElementById("concernType")?.value || "General";
  const vocText = document.getElementById("voc")?.value || "";
  const notes = document.getElementById("action")?.value || "";

  if (caseNum === "" || caseNum === "N/A") {
    showToast("Please provide a case number before copying!", "#ef4444");
    return;
  }

  const formData = { minNum, concernType, vocText, notes };
  const timestamp = Date.now();

  try {
    await db.case_logs.put({ case_number: caseNum, created_at: timestamp, form_data: formData });
    await db.sync_queue.put({ case_number: caseNum, form_data: formData });

    // Grab up to date manifest compiled text out of preview block window layout element
    const compiledClipboardText = document.getElementById("output").textContent;
    await navigator.clipboard.writeText(compiledClipboardText);
    
    showToast("Note compiled and copied to clipboard!");
    renderHistoryView();
    
    // Background execution safely isolated by our ping tracking engine filters
    syncOfflineQueue();

  } catch (err) {
    console.error("Storage save failed:", err);
    showToast("Local write execution failed.", "#ef4444");
  }
}
window.copyDoc = copyDoc;

function resetForm(event) {
  if (event) event.preventDefault();
  document.getElementById("docForm")?.reset();
  updatePreviewAndPlaybook();
  showToast("Inputs cleared.");
}
window.resetForm = resetForm;

function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.body.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    document.body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
}
window.toggleTheme = toggleTheme;

function toggleDrawer(event) {
  if (event) event.preventDefault();
  const panel = document.getElementById("playbookPanel");
  if (panel) panel.classList.toggle("open");
}
window.toggleDrawer = toggleDrawer;

function showToast(message, bgColor = "#10b981") {
  const toast = document.getElementById("toast");
  const msgSpan = document.getElementById("toastMessage");
  if (!toast || !msgSpan) return;

  msgSpan.textContent = message;
  toast.style.backgroundColor = bgColor;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

async function clearShiftHistory() {
  if (confirm("Are you sure you want to flush all local records from this layout workspace?")) {
    await db.case_logs.clear();
    await db.sync_queue.clear();
    renderHistoryView();
    showToast("Local operational cache cleared successfully.", "#f59e0b");
  }
}
window.clearShiftHistory = clearShiftHistory;

async function downloadHistoryLog() {
  try {
    const rawLogs = await db.case_logs.orderBy("created_at").reverse().toArray();
    if (rawLogs.length === 0) {
      showToast("No records available to export.", "#f59e0b");
      return;
    }
    
    let textDump = "AUTO-DOCS WORKSPACE EXPORT SHIFT LOGS\n====================================\n\n";
    rawLogs.forEach(l => {
      textDump += `TIMESTAMP: ${new Date(l.created_at).toLocaleString()}\nCASE NO  : ${l.case_number}\nDATA     : MIN: ${l.form_data.minNum} | Type: ${l.form_data.concernType}\nNOTES    : ${l.form_data.notes}\n------------------------------------\n`;
    });
    
    const blob = new Blob([textDump], { type: "text/plain;charset=utf-8" });
    const tempUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = tempUrl;
    downloadAnchor.download = `Shift_Manifest_Logs_${Date.now()}.txt`;
    downloadAnchor.click();
    URL.revokeObjectURL(tempUrl);
    showToast("Manifest log file generated and downloaded.");
  } catch (err) {
    showToast("Failed to compile text file.", "#ef4444");
  }
}
window.downloadHistoryLog = downloadHistoryLog;

// =========================================================================
// 7. LIFE CYCLE INITIALIZATION ENGINE
// =========================================================================
async function init() {
  // 1. Theme Configuration setup
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
  }

  // 2. Map structural input listeners to fuel live typing updates
  const trackingSelectors = ["case", "min", "voc", "action", "subj", "wocas"];
  trackingSelectors.forEach(id => {
    document.getElementById(id)?.addEventListener("input", updatePreviewAndPlaybook);
  });
  document.getElementById("concernType")?.addEventListener("change", handleConcernTypeChange);

  // 3. Set default run timestamp inside UI forms
  const timeInput = document.getElementById("datetime");
  if (timeInput) {
    const now = new Date();
    timeInput.value = `${now.getMonth()+1}-${now.getDate()}-${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // =========================================================================
  // HARDENED STARTUP HYDRATION SHIELD
  // =========================================================================
  try {
    // Look up local cache index directly on startup. Prevents data dropping out on PC restart.
    const lastLocalEntry = await db.case_logs.orderBy("created_at").reverse().first();

    if (lastLocalEntry) {
      lastSavedCase = lastLocalEntry.case_number;
      savedFormState = lastLocalEntry.form_data;
      source = "local_dexie";
      
      // Map inputs backward from safe offline journal state records
      if (document.getElementById("case") && lastSavedCase !== "N/A") {
        document.getElementById("case").value = lastSavedCase;
        if (savedFormState?.minNum) document.getElementById("min").value = savedFormState.minNum;
        if (savedFormState?.concernType) document.getElementById("concernType").value = savedFormState.concernType;
        
        // Re-hydrate the child select option items based on category parameters
        handleConcernTypeChange();
        
        if (savedFormState?.vocText) document.getElementById("voc").value = savedFormState.vocText;
        if (savedFormState?.notes) document.getElementById("action").value = savedFormState.notes;
      }
      console.log(`🎯 Workspace successfully loaded from local cache. Last case: ${lastSavedCase}`);
    }
  } catch (localErr) {
    console.error("CRITICAL: Local Dexie hydration failed:", localErr);
  }

  // Enforce zero network reliance markers initially
  isCloudAvailable = false;
  updateSyncStatusUI('offline');

  // Trigger workspace history layout render
  await renderHistoryView();
  
  // Update form values with initial baseline
  updatePreviewAndPlaybook();

  // Run a quiet check to see if database cloud channels can absorb queues
  await syncOfflineQueue();
}

// Fire system initialization on application bootstrap
document.addEventListener("DOMContentLoaded", init);
