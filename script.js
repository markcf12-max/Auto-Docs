function $(id) {
  return document.getElementById(id);
}

/* AUTO SAVE KEY */
const KEY = "auto_docs_v2";

/* SAVE */
function save() {
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

  localStorage.setItem(KEY, JSON.stringify(data));
}

/* LOAD */
function load() {
  const data = JSON.parse(localStorage.getItem(KEY));
  if (!data) return;

  Object.keys(data).forEach(k => {
    const el = $(k);
    if (el) el.value = data[k];
  });
}

/* LISTENERS */
window.addEventListener("input", save);

/* GENERATE */
function generateDoc() {

  if (!$("case").value.trim()) {
    alert("CASE is required");
    return;
  }

  const output =
`CASE: ${$("case").value}
CONCERN TYPE: ${$("concernType").value}
VOC: ${$("voc").value}

DETAILS OF THE CONCERN: ${$("details").value}

NAME: ${$("name").value}
MIN: ${$("min").value}
COMPANY NAME: ${$("company").value}
EMAIL ADDRESS: ${$("email").value}
THREAD CASE NUMBER: ${$("thread").value}
DATE & TIME EMAIL RECEIVED: ${$("datetime").value}
ACTION TAKEN: ${$("action").value}
WOCAS: ${$("wocas").value}`;

  $("output").textContent = output;
}

/* COPY */
function copyDoc() {
  navigator.clipboard.writeText($("output").textContent || "");
}

/* DOWNLOAD */
function downloadTxt() {
  const blob = new Blob([$("output").textContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "AutoDoc.txt";
  a.click();
}

/* RESET */
function resetForm() {
  document.querySelectorAll("input, textarea, select").forEach(el => el.value = "");
  $("output").textContent = "";
  localStorage.removeItem(KEY);
}

/* INIT */
window.addEventListener("load", load);
