/* ==========================================================================
   ⚠️ CONFIGURATION: REPLACE THESE WITH YOUR REAL SALESFORCE PICKLIST VALUES
   ==========================================================================
   HIGH_LEVEL_CLASSIFICATIONS below matches what's visible in your Salesforce
   screenshot. TRANSACTION_TAXONOMY is a 3-level cascade (Classification ->
   Transaction Type -> Transaction Sub Type -> Transaction Reason) seeded with
   PLACEHOLDER example values only — swap these arrays for your org's actual
   dependent picklist values. Nothing else in this file needs to change when
   you do that; the cascade logic reads directly from this object.
   ========================================================================== */
const HIGH_LEVEL_CLASSIFICATIONS = [
  "Account Maintenance",
  "Account Maintenance - Internal",
  "Aftersales - Inquiry",
  "Aftersales - Internal",
  "Inquiry - Bill",
  "Inquiry - General",
  "Inquiry - Product/Service"
];

const TRANSACTION_TAXONOMY = {
  "Account Maintenance": {
    "Change of Plan": {
      "Upgrade Request": ["Higher Data Allocation", "Better Voice/SMS Bundle"],
      "Downgrade Request": ["Cost Reduction", "Unused Features"]
    },
    "Change of Ownership": {
      "Transfer to Family Member": ["Death of Original Owner", "Household Consolidation"],
      "Transfer to Third Party": ["Sale of Line", "Business Transfer"]
    },
    "SIM Replacement": {
      "Lost SIM": ["Reported Lost", "Reported Stolen"],
      "Damaged SIM": ["Physical Damage", "Chip Malfunction"]
    }
  },
  "Account Maintenance - Internal": {
    "Internal Adjustment": {
      "System Correction": ["Duplicate Record", "Field Mismatch"],
      "Data Cleanup": ["Stale Record", "Merge Required"]
    },
    "System Correction": {
      "Billing System Fix": ["Incorrect Charge Posted", "Proration Error"],
      "CRM Data Fix": ["Wrong Account Link", "Missing Field"]
    }
  },
  "Aftersales - Inquiry": {
    "Billing Inquiry": {
      "Charge Clarification": ["Unrecognized Charge", "Rate Plan Question"],
      "Payment Due Date": ["Due Date Confirmation", "Grace Period Question"]
    },
    "Service Inquiry": {
      "Feature Availability": ["Add-On Availability", "Roaming Availability"],
      "Coverage Check": ["Signal Strength Area", "New Site Coverage"]
    }
  },
  "Aftersales - Internal": {
    "Internal Escalation": {
      "Tier 2 Escalation": ["Complex Technical Issue", "Repeat Complaint"],
      "Supervisor Review": ["Customer Requested", "Policy Exception"]
    },
    "Internal Review": {
      "Quality Check": ["Random Audit", "Complaint-Triggered Review"],
      "Compliance Review": ["Regulatory Flag", "Data Privacy Concern"]
    }
  },
  "Inquiry - Bill": {
    "Bill Breakdown": {
      "Itemized Charges": ["Data Usage Breakdown", "Add-On Charges Breakdown"],
      "Proration Explanation": ["Mid-Cycle Plan Change", "Mid-Cycle Activation"]
    },
    "Payment Inquiry": {
      "Payment Channels": ["Online Payment Options", "Over-the-Counter Options"],
      "Payment Confirmation": ["Payment Not Reflected", "Duplicate Payment"]
    }
  },
  "Inquiry - General": {
    "General Product Info": {
      "Plan Comparison": ["Postpaid vs Prepaid", "Tier Comparison"],
      "New Offer Info": ["Promo Details", "Eligibility Question"]
    },
    "General Service Info": {
      "Network Coverage": ["Area Coverage Question", "Indoor Signal Question"],
      "Service Hours": ["Support Hours", "Store Hours"]
    }
  },
  "Inquiry - Product/Service": {
    "Plan Details": {
      "Inclusions": ["Data Inclusion", "Call/Text Inclusion"],
      "Validity Period": ["Expiry Question", "Renewal Question"]
    },
    "Add-On Details": {
      "Data Add-On": ["Pricing Question", "Stacking Question"],
      "Call/Text Add-On": ["Pricing Question", "Network Restrictions"]
    }
  }
};

// Smart default: selecting a record type in step 1 pre-fills a sensible
// "Type of Customer Request" value on the form (still fully editable).
const RECORD_TYPE_TO_REQUEST_TYPE = {
  "SMART Complaint": "Complaint",
  "SMART Inquiry": "Inquiry",
  "SMART Service Request": "Service Request"
};

/* ==========================================================================
   FIREBASE (same project as the main app — writes go to an isolated
   training_case_simulator_logs collection, never touching real case data)
   ========================================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyC3I-o7HZQ_UfvlxHOXBWYxPNtCx9Os63I",
  authDomain: "auto-docs-4ad35.firebaseapp.com",
  projectId: "auto-docs-4ad35",
  storageBucket: "auto-docs-4ad35.firebasestorage.app",
  messagingSenderId: "443489031474",
  appId: "1:443489031474:web:403654fc3253841219b32b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ==========================================================================
   STATE + DOM HELPERS
   ========================================================================== */
let selectedRecordType = "SMART Complaint";

function $(id) { return document.getElementById(id); }

function showStatus(msg, isError = false) {
  const el = $("simStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = "sim-status" + (isError ? " error" : "");
}

/* ==========================================================================
   BUILD STATIC DROPDOWN: High Level Transaction Classification
   ========================================================================== */
function populateHighLevelClassifications() {
  const select = $("highLevelClassification");
  HIGH_LEVEL_CLASSIFICATIONS.forEach(value => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

/* ==========================================================================
   CASCADE LOGIC
   ========================================================================== */
function resetSelect(selectEl, placeholderText) {
  selectEl.innerHTML = `<option value="">${placeholderText}</option>`;
  selectEl.disabled = true;
}

function populateSelect(selectEl, values) {
  selectEl.innerHTML = `<option value="">--None--</option>`;
  values.forEach(value => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
  selectEl.disabled = false;
}

function onHighLevelClassificationChange() {
  const classification = $("highLevelClassification").value;
  const typeSelect = $("transactionType");
  const subTypeSelect = $("transactionSubType");
  const reasonSelect = $("transactionReason");

  resetSelect(subTypeSelect, "Select Transaction Type first...");
  resetSelect(reasonSelect, "Select Transaction Sub Type first...");

  if (!classification || !TRANSACTION_TAXONOMY[classification]) {
    resetSelect(typeSelect, "Select Classification first...");
    return;
  }

  populateSelect(typeSelect, Object.keys(TRANSACTION_TAXONOMY[classification]));
}

function onTransactionTypeChange() {
  const classification = $("highLevelClassification").value;
  const type = $("transactionType").value;
  const subTypeSelect = $("transactionSubType");
  const reasonSelect = $("transactionReason");

  resetSelect(reasonSelect, "Select Transaction Sub Type first...");

  const subTypeMap = TRANSACTION_TAXONOMY[classification] && TRANSACTION_TAXONOMY[classification][type];
  if (!type || !subTypeMap) {
    resetSelect(subTypeSelect, "Select Transaction Type first...");
    return;
  }

  populateSelect(subTypeSelect, Object.keys(subTypeMap));
}

function onTransactionSubTypeChange() {
  const classification = $("highLevelClassification").value;
  const type = $("transactionType").value;
  const subType = $("transactionSubType").value;
  const reasonSelect = $("transactionReason");

  const reasons = (TRANSACTION_TAXONOMY[classification] &&
                    TRANSACTION_TAXONOMY[classification][type] &&
                    TRANSACTION_TAXONOMY[classification][type][subType]) || [];

  if (!subType || reasons.length === 0) {
    resetSelect(reasonSelect, "No reasons configured");
    return;
  }

  populateSelect(reasonSelect, reasons);
}

/* ==========================================================================
   STEP 1 -> STEP 2 TRANSITION
   ========================================================================== */
function goToCaseForm() {
  const checkedRadio = document.querySelector('input[name="recordType"]:checked');
  selectedRecordType = checkedRadio ? checkedRadio.value : "SMART Complaint";

  $("recordTypeModal").style.display = "none";
  $("caseFormPanel").style.display = "block";
  $("selectedRecordTypeLabel").textContent = selectedRecordType;

  const defaultRequestType = RECORD_TYPE_TO_REQUEST_TYPE[selectedRecordType] || "";
  if (defaultRequestType) {
    $("typeOfCustomerRequest").value = defaultRequestType;
  }
}

function goBackToRecordType() {
  $("caseFormPanel").style.display = "none";
  $("recordTypeModal").style.display = "flex";
}

/* ==========================================================================
   VALIDATION + SAVE
   ========================================================================== */
function getRequiredFieldValues() {
  return {
    typeOfCustomerRequest: $("typeOfCustomerRequest").value,
    caseOrigin: $("caseOrigin").value,
    caseType: $("caseType").value,
    caseStatus: $("caseStatus").value,
    highLevelClassification: $("highLevelClassification").value,
    transactionType: $("transactionType").value,
    transactionSubType: $("transactionSubType").value,
    subject: $("subject").value.trim()
  };
}

function validateForm() {
  const values = getRequiredFieldValues();
  const missing = Object.keys(values).filter(key => !values[key]);
  return { valid: missing.length === 0, missing };
}

async function saveCase(resetAfter) {
  const attribution = $("attributionInput").value.trim();
  if (!attribution) {
    showStatus("Enter your Name/WinID above before saving a practice case.", true);
    $("attributionInput").focus();
    return;
  }

  const { valid, missing } = validateForm();
  if (!valid) {
    showStatus(`Missing required field(s): ${missing.join(", ")}`, true);
    return;
  }

  const payload = {
    agent_identifier: attribution,
    record_type: selectedRecordType,
    type_of_customer_request: $("typeOfCustomerRequest").value,
    case_origin: $("caseOrigin").value,
    case_type: $("caseType").value,
    status: $("caseStatus").value,
    high_level_classification: $("highLevelClassification").value,
    transaction_type: $("transactionType").value,
    transaction_sub_type: $("transactionSubType").value,
    transaction_reason: $("transactionReason").value || "",
    subject: $("subject").value.trim(),
    description: $("description").value.trim(),
    logged_at_iso: new Date().toISOString(),
    logged_at: firebase.firestore.FieldValue.serverTimestamp()
  };

  showStatus("Saving practice case...");

  try {
    await db.collection("training_case_simulator_logs").add(payload);

    if (resetAfter) {
      resetCaseFormFields();
      showStatus("Practice case logged. Ready for another.");
    } else {
      $("caseFormPanel").style.display = "none";
      $("completionSummary").textContent =
        `${payload.high_level_classification} → ${payload.transaction_type} → ${payload.transaction_sub_type} | "${payload.subject}"`;
      $("completionPanel").style.display = "block";
      showStatus("");
    }
  } catch (err) {
    console.error("Practice case log failed:", err);
    showStatus(`Could not save practice case: ${err.message}`, true);
  }
}

function resetCaseFormFields() {
  $("typeOfCustomerRequest").value = RECORD_TYPE_TO_REQUEST_TYPE[selectedRecordType] || "";
  $("caseOrigin").value = "";
  $("caseType").value = "";
  $("caseStatus").value = "";
  $("highLevelClassification").value = "";
  resetSelect($("transactionType"), "Select Classification first...");
  resetSelect($("transactionSubType"), "Select Transaction Type first...");
  resetSelect($("transactionReason"), "Select Transaction Sub Type first...");
  $("subject").value = "";
  $("description").value = "";
}

function startNewPracticeCase() {
  $("completionPanel").style.display = "none";
  resetCaseFormFields();
  $("recordTypeModal").style.display = "flex";
  showStatus("");
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  populateHighLevelClassifications();

  $("nextRecordTypeBtn").addEventListener("click", goToCaseForm);
  $("cancelRecordTypeBtn").addEventListener("click", () => {
    showStatus("Practice cancelled. Select a record type to start again.");
  });
  $("backToRecordTypeBtn").addEventListener("click", goBackToRecordType);

  $("highLevelClassification").addEventListener("change", onHighLevelClassificationChange);
  $("transactionType").addEventListener("change", onTransactionTypeChange);
  $("transactionSubType").addEventListener("change", onTransactionSubTypeChange);

  $("cancelCaseBtn").addEventListener("click", goBackToRecordType);
  $("saveNewCaseBtn").addEventListener("click", () => saveCase(true));
  $("saveCaseBtn").addEventListener("click", () => saveCase(false));
  $("practiceAnotherBtn").addEventListener("click", startNewPracticeCase);
});
