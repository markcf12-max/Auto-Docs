let generatedText = "";

/* =========================
   GENERATE
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
};


/* =========================
   COPY
========================= */
window.copyDoc = function () {
  if (!generatedText) return alert("Nothing to copy yet.");
  navigator.clipboard.writeText(generatedText);
};


/* =========================
   DOWNLOAD TXT
========================= */
window.downloadTxt = function () {

  if (!generatedText) return alert("Nothing to download yet.");

  const blob = new Blob([generatedText], { type: "text/plain" });
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "auto-doc.txt";
  a.click();
};
