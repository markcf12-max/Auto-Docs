let generatedText = "";

/* =========================
   FIELDS FOR AUTOSAVE
========================= */
const fields = [
  "case",
  "details",
  "name",
  "min",
  "company",
  "email",
  "thread",
  "datetime",
  "action",
  "wocas",
  "compactMode"
];

/* =========================
   AUTO SAVE
========================= */
function saveToLocal() {

  const data = {};

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    data[id] = el.type === "checkbox" ? el.checked : el.value;
  });

  localStorage.setItem("autoDocsData", JSON.stringify(data));
}

/* =========================
   RESTORE DATA
========================= */
function loadFromLocal() {

  const saved = localStorage.getItem("autoDocsData");
  if (!saved) return;

  const data = JSON.parse(saved);

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el || data[id] === undefined) return;

    if (el.type === "checkbox") {
      el.checked = data[id];
    } else {
      el.value = data[id];
    }
  });
}

/* =========================
   ATTACH LISTENERS
========================= */
function attachListeners() {

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", saveToLocal);
    el.addEventListener("change", saveToLocal);
  });
}

/* =========================
   GENERATE DOC
========================= */
window.generateDoc = function () {

  const compact = document.getElementById("compactMode").checked;

  const caseVal = document.getElementById("case").value.trim();
  const details = document.getElementById("details").value.trim();
  const name = document.getElementById("name").value.trim();
  const min = document.getElementById("min").value.trim();
  const company = document.getElementById("company").value.trim();
  const email = document.getElementById("email").value.trim();
  const thread = document.getElementById("thread").value.trim();
  const datetime = document.getElementById("datetime").value.trim();
  const action = document.getElementById("action").value.trim();
  const wocas = document.getElementById("wocas").value.trim();

  if (compact) {

    generatedText =
`CASE: ${caseVal} | NAME: ${name} | MIN: ${min} | COMPANY: ${company}

DETAILS: ${details}

EMAIL: ${email} | THREAD: ${thread} | DATE/TIME: ${datetime}

ACTION: ${action}

WOCAS: ${wocas}`;

  } else {

    generatedText =
`CASE: ${caseVal}
DETAILS OF THE CONCERN: ${details}
NAME: ${name}
MIN: ${min}
COMPANY NAME: ${company}
EMAIL ADDRESS: ${email}
THREAD CASE NUMBER: ${thread}
DATE & TIME EMAIL RECEIVED: ${datetime}
ACTION TAKEN: ${action}
WOCAS: ${wocas}`;
  }

  document.getElementById("output").textContent = generatedText;
  saveToLocal();
};

/* =========================
   COPY
========================= */
window.copyDoc = function () {
  if (!generatedText) return alert("Nothing to copy yet.");
  navigator.clipboard.writeText(generatedText);
};

/* =========================
   DOWNLOAD
========================= */
window.downloadTxt = function () {

  if (!generatedText) return alert("Nothing to download yet.");

  const blob = new Blob([generatedText], { type: "text/plain" });
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "auto-doc.txt";
  a.click();
};

/* =========================
   CLEAR FORM
========================= */
window.clearForm = function () {

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === "checkbox") {
      el.checked = false;
    } else {
      el.value = "";
    }
  });

  localStorage.removeItem("autoDocsData");
  document.getElementById("output").textContent = "";
  generatedText = "";
};

/* =========================
   INIT
========================= */
loadFromLocal();
attachListeners();
