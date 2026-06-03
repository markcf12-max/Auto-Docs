function $(id) {
  return document.getElementById(id);
}

const STORAGE_KEY = "auto_docs_v4";

/* =========================
   TECH LINKS
========================= */
const TECH_LINKS = {
  "VOICE CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_VOICE.pdf",

  "SMS CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_SMS.pdf",

  "DATA CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_DATA_CONNECTIVITY.pdf",

  "ROAMING CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_ROAMING.pdf",

  "COVERAGE CONNECTIVITY":
    "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F06JUNE%2FLEARNING_SPACE_TECH360_SPS_GUIDE_COVERAGE.pdf"
};

/* =========================
   VOC SWITCHING
========================= */
function updateVocOptions(reset = true) {
const concern = $("concernType").value;
const voc = $("voc");

const currentValue = voc.value;

if (concern === "Technical") {
voc.innerHTML = `       <option value="">Select Connectivity Type</option>       <option value="VOICE CONNECTIVITY">VOICE CONNECTIVITY</option>       <option value="SMS CONNECTIVITY">SMS CONNECTIVITY</option>       <option value="DATA CONNECTIVITY">DATA CONNECTIVITY</option>       <option value="ROAMING CONNECTIVITY">ROAMING CONNECTIVITY</option>       <option value="COVERAGE CONNECTIVITY">COVERAGE CONNECTIVITY</option>
    `;
} else {
voc.innerHTML = `       <option value="">Select</option>       <option value="Positive">Positive</option>       <option value="Neutral">Neutral</option>       <option value="Negative">Negative</option>
    `;
}

if (reset) {
voc.value = "";
} else {
voc.value = currentValue;
}

updateSuggestions();
}
function updateVocOptions() {
  const concern = $("concernType").value;
  const voc = $("voc");

  if (concern === "Technical") {
    voc.innerHTML = `
      <option value="">Select Connectivity Type</option>
      <option value="VOICE CONNECTIVITY">VOICE CONNECTIVITY</option>
      <option value="SMS CONNECTIVITY">SMS CONNECTIVITY</option>
      <option value="DATA CONNECTIVITY">DATA CONNECTIVITY</option>
      <option value="ROAMING CONNECTIVITY">ROAMING CONNECTIVITY</option>
      <option value="COVERAGE CONNECTIVITY">COVERAGE CONNECTIVITY</option>
    `;
  } else {
    voc.innerHTML = `
      <option value="">Select</option>
      <option value="Positive">Positive</option>
      <option value="Neutral">Neutral</option>
      <option value="Negative">Negative</option>
    `;
  }

  voc.value = "";
  updateSuggestions();
}

/* =========================
   SAVE / LOAD
========================= */
function saveData() {
  const data = {
    case: $("case").value,
    concernType: $("concernType").value,
    voc: $("voc").value,
    details: $("details").value,
    name: $("name").value,
    min: $("min").value,
    company: $("company").value,
    email: $("email").value,
    thread: $("thread").value,
    datetime: $("datetime").value,
    action: $("action").value,
    wocas: $("wocas").value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  const data = JSON.parse(saved);

  Object.keys(data).forEach(key => {
    const el = $(key);
    if (el) el.value = data[key];
  });
}

/* =========================
   OUTPUT
========================= */
function formatVoc(concern, voc) {
  if (!voc) return "Not selected";
  return voc;
}

function updateOutput() {
  const concern = $("concernType").value;
  const voc = $("voc").value;

  const output =
`CASE: ${$("case").value}
CONCERN TYPE: ${concern}
VOC: ${formatVoc(concern, voc)}

DETAILS:
${$("details").value}

NAME: ${$("name").value}
MIN: ${$("min").value}
COMPANY: ${$("company").value}
EMAIL: ${$("email").value}
THREAD: ${$("thread").value}
DATE/TIME RECEIVED: ${$("datetime").value}

ACTION:
${$("action").value}

WOCAS:
${$("wocas").value}`.trim();

  $("output").textContent = output;
}

/* =========================
   SUGGESTIONS
========================= */
function updateSuggestions() {
  const concern = $("concernType").value;
  const voc = $("voc").value.trim();

if (concern === "Technical") {

if (!voc) {
$("suggestions").innerHTML =
"Select a Connectivity Type";
return;
}

const link = TECH_LINKS[voc.toUpperCase().trim()];

if (!link) {
$("suggestions").innerHTML =
"No guide available";
return;
}

$("suggestions").innerHTML = ` <div style="margin-bottom:10px;"> <strong>${voc}</strong> </div>

```
<a href="${link}"
   target="_blank"
   rel="noopener noreferrer">
   Open Procedure Guide
</a>
```

`;

return;
}


  let list = [];

  if (concern === "Inquiry")
    list.push("Check account details");

  if (concern === "Complaint")
    list.push("Escalate issue");

  if (concern === "Aftersales")
    list.push("Validate transaction");

  if (concern === "Other")
    list.push("Review manually");

  if (voc === "Negative")
    list.push("Apologize & escalate");

  if (voc === "Positive")
    list.push("Confirm resolution");

  if (voc === "Neutral")
    list.push("Standard processing");

  $("suggestions").innerHTML =
    list.length
      ? list.join("<br>")
      : "Select Concern & VOC";
}

/* =========================
   INPUT HANDLER
========================= */
function handleInput() {
  saveData();
  updateOutput();
  updateSuggestions();
}

/* =========================
   COPY
========================= */
function copyDoc() {
  navigator.clipboard.writeText(
    $("output").textContent
  );

  alert("Copied!");
}

/* =========================
   DOWNLOAD
========================= */
function downloadTxt() {
  const blob = new Blob(
    [$("output").textContent],
    { type: "text/plain" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "auto-docs.txt";
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
   RESET
========================= */
function resetForm() {
  [
    "case",
    "concernType",
    "voc",
    "details",
    "name",
    "min",
    "company",
    "email",
    "thread",
    "datetime",
    "action",
    "wocas"
  ].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });

  $("output").textContent = "";
  $("suggestions").textContent = "Select Concern & VOC";

  localStorage.removeItem(STORAGE_KEY);
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

  loadData();

  updateOutput();
  updateSuggestions();

  const fields = [
    "case",
    "concernType",
    "voc",
    "details",
    "name",
    "min",
    "company",
    "email",
    "thread",
    "datetime",
    "action",
    "wocas"
  ];

window.addEventListener("DOMContentLoaded", () => {

loadData();

updateVocOptions(false);

updateOutput();
updateSuggestions();

const fields = [
"case",
"concernType",
"voc",
"details",
"name",
"min",
"company",
"email",
"thread",
"datetime",
"action",
"wocas"
];

fields.forEach(id => {

```
const el = $(id);

if (!el) return;

el.addEventListener("input", handleInput);

el.addEventListener("change", () => {

  if (id === "concernType") {
    updateVocOptions(true);
  }

  handleInput();
});
```

});

});


});
