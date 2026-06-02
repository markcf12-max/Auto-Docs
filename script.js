/* =========================
   AUTO DOC ENGINE
========================= */

let generatedText = "";

function generateDoc() {

  const caseVal = document.getElementById("case").value;
  const details = document.getElementById("details").value;
  const name = document.getElementById("name").value;
  const min = document.getElementById("min").value;
  const company = document.getElementById("company").value;
  const email = document.getElementById("email").value;
  const thread = document.getElementById("thread").value;
  const datetime = document.getElementById("datetime").value;
  const action = document.getElementById("action").value;
  const wocas = document.getElementById("wocas").value;

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

  document.getElementById("output").textContent = generatedText;
}

function copyDoc() {
  navigator.clipboard.writeText(generatedText);
  alert("Copied to clipboard!");
}

function downloadTxt() {

  const blob = new Blob([generatedText], {
    type: "text/plain"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "auto-doc.txt";
  a.click();
}
