function get(id) {
  return document.getElementById(id).value.trim();
}

/* =========================
   GENERATE
========================= */
window.generateDoc = function () {

  if (!get("case")) {
    alert("CASE is required");
    return;
  }

  const output =
`CASE: ${get("case")}
DETAILS OF THE CONCERN: ${get("details")}
NAME: ${get("name")}
MIN: ${get("min")}
COMPANY NAME: ${get("company")}
EMAIL ADDRESS: ${get("email")}
THREAD CASE NUMBER: ${get("thread")}
DATE & TIME EMAIL RECEIVED: ${get("datetime")}
ACTION TAKEN: ${get("action")}
WOCAS: ${get("wocas")}`;

  document.getElementById("output").textContent = output;

  localStorage.setItem("auto_docs", output);
};

/* =========================
   COPY
========================= */
window.copyDoc = function () {
  const text = document.getElementById("output").textContent;
  if (!text) return;
  navigator.clipboard.writeText(text);
};

/* =========================
   DOWNLOAD
========================= */
window.downloadDoc = function () {
  const text = document.getElementById("output").textContent;
  if (!text) return;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "auto-doc.txt";
  a.click();

  URL.revokeObjectURL(url);
};

/* =========================
   RESET
========================= */
window.resetForm = function () {

  ["case","details","name","min","company","email","thread","datetime","action","wocas"]
  .forEach(id => document.getElementById(id).value = "");

  document.getElementById("output").textContent = "";
  localStorage.removeItem("auto_docs");
};

/* =========================
   AUTO RESTORE
========================= */
window.addEventListener("load", () => {
  const saved = localStorage.getItem("auto_docs");
  if (saved) {
    document.getElementById("output").textContent = saved;
  }
});
