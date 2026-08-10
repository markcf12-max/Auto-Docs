/* ==========================================================================
   🌐 CLOUD-SYNCED AGENT ARCHIVE & LIVING QUEUE ENGINE (FIRESTORE CORES)
   ========================================================================== */
// Centralized state arrays (No longer falling back exclusively to local hardware cache)
let activeFolderFilterBucket = null;
let activeUrgentQueueItems = [];
let ongoingQueueTrackingLoop = null;
let globalNotificationAcknowledgedLock = false;

/* ==========================================================================
   FIREBASE CONFIGURATION & MODULE INTEGRATION (V12.14.0)
   ========================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  increment,
  orderBy,
  arrayUnion,
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';

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

/* ==========================================================================
   🎯 QUALITY SCORE DASHBOARD — SECOND FIREBASE PROJECT (READ-ONLY LINK)
   Separate Firebase project. Requires signing the agent into THAT project's
   Firebase Auth (matching their Quality dashboard email/password), since its
   Firestore rules only allow an agent to read audit rows tied to their own
   authenticated email.
   ========================================================================== */
const qualityFirebaseConfig = {
  apiKey: "AIzaSyAla_DIUPqhfMPIJQkMLpBIl_evaBbCtZM",
  authDomain: "smartscore-43fa8.firebaseapp.com",
  projectId: "smartscore-43fa8",
  storageBucket: "smartscore-43fa8.firebasestorage.app",
  messagingSenderId: "466358767899",
  appId: "1:466358767899:web:441d3ccd5e31eda083c3be"
};
const qualityApp = initializeApp(qualityFirebaseConfig, "qualityProject");
const qualityDb = getFirestore(qualityApp);
const qualityAuth = getAuth(qualityApp);

// Restores the QA score panel on page refresh if this browser already has a
// linked Quality session — no need to re-enter the password every reload.
onAuthStateChanged(qualityAuth, (user) => {
    if (user && currentAgentId && currentAgentId !== 'SUPERVISOR' && !isSupervisorAuthenticated) {
        qsLoadAndRenderScores(user.email);
    } else {
        qsHidePanel();
    }
});

/* --- Ported from the Quality dashboard's own parameter-flag logic, so audit
   cards here look/behave the same as they do on that dashboard. --- */
const QS_NON_ISSUE_VALUES = new Set(['', 'NO OPPORTUNITY', 'NA', 'N/A', 'NO', 'NONE']);
const QS_HIT_PARAMS = [
    { col: 'IRRELEVANT SOLUTION', category: 'Reliable', label: 'Irrelevant solution given', type: 'descriptive' },
    { col: 'INCOMPLETE SOLUTION', category: 'Reliable', label: 'Incomplete solution given', type: 'descriptive' },
    { col: 'UNTIMELY SOLUTION ( ZTP)', category: 'Reliable', label: 'Untimely solution (ZTP)', type: 'descriptive' },
    { col: 'UNCLEAR SOLUTION', category: 'Reliable', label: 'Unclear solution given', type: 'descriptive' },
    { col: 'Poor Listening Skills?', category: 'Personable', label: 'Poor listening skills', type: 'descriptive' },
    { col: 'Customer Validation and Empathy Gap?', category: 'Personable', label: 'Empathy / validation gap', type: 'descriptive' },
    { col: 'Did not adjust the tone/pace to match the customer?', category: 'Personable', label: 'Tone/pace not matched to customer', type: 'descriptive' },
    { col: 'Did not adjust to the customers language?', category: 'Personable', label: 'Language not adjusted to customer', type: 'descriptive' },
    { col: 'Negative Words, Phrasing and Limitations?', category: 'Personable', label: 'Negative words / phrasing used', type: 'descriptive' },
    { col: 'Unfriendly/discourteous/sarcastic?', category: 'Personable', label: 'Unfriendly, discourteous, or sarcastic tone', type: 'descriptive' },
    { col: 'FAST: Were there other Agent factors observed that affected the customer experience?', category: 'Fast', label: 'Other agent factor slowed the resolution', type: 'descriptive' },
    { col: 'DID WE FOLLOW THE CUSTOMER AUTHENTICATION PROCESS?', category: 'Safe & Secure', label: 'Customer authentication process missed', type: 'boolean', hitValue: 'NO' },
    { col: 'DID WE FOLLOW THE DATA PRIVACY POLICY?', category: 'Safe & Secure', label: 'Data privacy policy not followed', type: 'boolean', hitValue: 'NO' },
    { col: 'DID WE UPDATE THE CUSTOMER INFORMATION IN THE TOOL?', category: 'Safe & Secure', label: 'Customer info not updated in tool', type: 'boolean', hitValue: 'NO' },
    { col: 'DID WE FOLLOW THE CSAT/NPS PROCESS?', category: 'Safe & Secure', label: 'CSAT/NPS process not followed', type: 'boolean', hitValue: 'NO' },
    { col: 'DID WE FOLLOW THE SYSTEM DOCUMENTATION PROCESS?', category: 'Safe & Secure', label: 'System documentation process missed', type: 'boolean', hitValue: 'NO' },
    { col: 'DID WE FOLLOW THE SYSTEM TAGGING PROCESS?', category: 'Safe & Secure', label: 'System tagging process missed', type: 'boolean', hitValue: 'NO' },
    { col: 'DID WE FOLLOW CORRECT GRAMMAR, TECHNICAL WRITING & THE PRESCRIBED LANGUAGE?', category: 'Safe & Secure', label: 'Grammar / prescribed language standard missed', type: 'boolean', hitValue: 'NO' },
    { col: "IS THIS A POTENTIAL CUSTOMER MISTREAT?", category: 'Mistreat', label: 'Potential customer mistreat flagged', type: 'boolean', hitValue: 'YES' }
];
function qsNormVal(v) { return (v === undefined || v === null) ? '' : String(v).trim().toUpperCase(); }
function qsEscapeHtml(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function qsGetRowIssues(row) {
    const issues = [];
    QS_HIT_PARAMS.forEach(p => {
        const raw = row[p.col];
        const v = qsNormVal(raw);
        if (!v) return;
        if (p.type === 'boolean') {
            if (v === p.hitValue) issues.push({ label: p.label, category: p.category });
            return;
        }
        if (!QS_NON_ISSUE_VALUES.has(v)) {
            const detail = v !== 'YES' ? String(raw).trim() : '';
            issues.push({ label: detail ? `${p.label} — ${detail}` : p.label, category: p.category });
        }
    });
    return issues;
}

function qsHidePanel() {
    qsStopListening();
    const compact = document.getElementById('qsCompactCard');
    const expanded = document.getElementById('qsExpandedPanel');
    if (compact) compact.style.display = 'none';
    if (expanded) expanded.style.display = 'none';
}

/* TODO: set this to your actual live Quality dashboard URL */
const QUALITY_DASHBOARD_URL = 'https://markcf12-max.github.io/Smart-Quality-Score-Management/';
const QS_COMPACT_PREVIEW_COUNT = 1;
const QS_EXPANDED_PREVIEW_COUNT = 12;

function qsCardHtml(r) {
    const issues = qsGetRowIssues(r);
    const score = r['OVERALL SCORE'];
    const passed = r['OVERALL PASSRATE'] ? r['OVERALL PASSRATE'] === 'PASSED' : (score !== null && score > 90);
    const tagsHtml = issues.length
        ? issues.map(i => `<span class="qs-tag">${qsEscapeHtml(i.label)}</span>`).join('')
        : `<span class="qs-no-issues">✓ No parameters flagged on this audit.</span>`;
    const caseLabel = qsNormVal(r['BRAND']) === 'SMART EBG' ? 'Call ID' : 'Case #';
    const caseLine = r['CALL ID / CASE NUMBER'] ? ` · ${caseLabel}: ${qsEscapeHtml(r['CALL ID / CASE NUMBER'])}` : '';
    const minLine = r['MIN'] ? ` · ANI: ${qsEscapeHtml(r['MIN'])}` : '';
    return `<div class="qs-audit-card">
        <div class="qs-audit-head">
            <span>${qsEscapeHtml(r['WEEKENDING'])} · ${qsEscapeHtml(r['FORM TYPE'])} · ${qsEscapeHtml(r['BRAND'])}</span>
            <span class="qs-score-pill ${passed ? 'qs-pass' : 'qs-fail'}">${score === null ? '-' : score + '%'}</span>
        </div>
        <div class="qs-audit-meta">Team Leader: ${qsEscapeHtml(r['TEAM LEADER']) || '—'} · Month: ${qsEscapeHtml(r['MONTH']) || '—'}${caseLine}${minLine}</div>
        <div class="qs-tags-row">${tagsHtml}</div>
    </div>`;
}

async function qsRenderPanel(rows) {
    const compactCard = document.getElementById('qsCompactCard');
    const compactBody = document.getElementById('qsCompactBody');
    const expandedPanel = document.getElementById('qsExpandedPanel');
    const expandedBody = document.getElementById('qsExpandedBody');
    if (!compactCard || !compactBody) return;

    if (!rows.length) {
        compactBody.innerHTML = `<div class="qs-empty">No audits found yet under your name in the Quality dashboard.</div>`;
        compactCard.style.display = 'block';
        return;
    }

    const sorted = rows.slice().sort((a, b) => String(b['WEEKENDING'] || '').localeCompare(String(a['WEEKENDING'] || '')));
    const scored = sorted.map(r => r['OVERALL SCORE']).filter(v => v !== null && v !== undefined && !isNaN(v));
    const avgScore = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

    // --- Compact preview (column 3) ---
    const compactPreview = sorted.slice(0, QS_COMPACT_PREVIEW_COUNT).map(qsCardHtml).join('');
    compactBody.innerHTML = `
        <div class="qs-summary">
            <div class="qs-summary-score">${avgScore === null ? '—' : avgScore + '%'}</div>
            <div class="qs-summary-label">Average across ${sorted.length} audit${sorted.length === 1 ? '' : 's'}</div>
        </div>
        ${compactPreview}
        <button type="button" id="qsViewMoreBtn" class="qs-view-more-btn">
            View more (${sorted.length}) <i class="fas fa-chevron-down"></i>
        </button>`;
    compactCard.style.display = 'block';

    // --- Expanded full-width panel (revealed by "View more") ---
    if (expandedPanel && expandedBody) {
        const expandedPreview = sorted.slice(0, QS_EXPANDED_PREVIEW_COUNT).map(qsCardHtml).join('');
        const viewMoreUrl = `${QUALITY_DASHBOARD_URL}?email=${encodeURIComponent(currentAgentEmail || '')}`;
        const fullLinkHtml = `<a href="${viewMoreUrl}" target="_blank" rel="noopener" class="qs-view-more-btn qs-view-more-secondary" style="text-decoration:none; box-sizing:border-box;">
            Open Full Quality Dashboard <i class="fas fa-arrow-up-right-from-square"></i>
        </a>`;
        expandedBody.innerHTML = `${expandedPreview}${fullLinkHtml}`;

        const viewMoreBtn = document.getElementById('qsViewMoreBtn');
        if (viewMoreBtn) {
            viewMoreBtn.onclick = () => {
                expandedPanel.style.display = 'block';
                viewMoreBtn.style.display = 'none';
                expandedPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        }
        const collapseBtn = document.getElementById('qsCollapseBtn');
        if (collapseBtn) {
            collapseBtn.onclick = () => {
                expandedPanel.style.display = 'none';
                if (viewMoreBtn) viewMoreBtn.style.display = 'flex';
                compactCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        }
    }
}

let qsUnsubscribe = null;
let qsKnownAuditIds = null;

function qsStopListening() {
    if (qsUnsubscribe) {
        qsUnsubscribe();
        qsUnsubscribe = null;
    }
    qsKnownAuditIds = null;
}

function qsLoadAndRenderScores(email) {
    qsStopListening();
    try {
        const q = query(collection(qualityDb, 'auditData'), where('agentEmailLower', '==', email.toLowerCase()));
        qsUnsubscribe = onSnapshot(q,
            (snap) => {
                const currentIds = new Set(snap.docs.map(d => d.id));
                if (qsKnownAuditIds === null) {
                    qsKnownAuditIds = currentIds;
                } else {
                    const newIds = [...currentIds].filter(id => !qsKnownAuditIds.has(id));
                    if (newIds.length) {
                        showToast(newIds.length === 1
                            ? 'New quality audit added — check My Quality Score.'
                            : `${newIds.length} new quality audits added — check My Quality Score.`);
                    }
                    qsKnownAuditIds = currentIds;
                }
                qsRenderPanel(snap.docs.map(d => d.data()));
            },
            (err) => { console.warn('Quality Score link: live listener error.', err); qsHidePanel(); }
        );
    } catch (err) {
        console.warn('Quality Score link: could not load scores.', err);
        qsHidePanel();
    }
}

/* Best-effort link: sign the agent into the Quality project using the same
   credentials they just used here. Auto-provisions a Quality account the
   first time, IF their email is on the Quality roster. Never throws — a
   failure here should never block the agent's main Documentation Suite login. */
async function linkQualityScoreAccount(email, password) {
    if (!email) { qsHidePanel(); return; }
    try {
        await signInWithEmailAndPassword(qualityAuth, email, password);
    } catch (signInErr) {
        try {
            await createUserWithEmailAndPassword(qualityAuth, email, password);
        } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
                console.warn('Quality Score link: account exists under a different password than this Documentation Suite login.');
            } else {
                console.warn('Quality Score link: could not create account.', createErr);
            }
            qsHidePanel();
            return;
        }
        try {
            const rosterSnap = await getDoc(doc(qualityDb, 'roster', email));
            if (!rosterSnap.exists()) {
                const strayUser = qualityAuth.currentUser;
                await signOut(qualityAuth);
                if (strayUser) await deleteUser(strayUser).catch(() => {});
                qsHidePanel();
                return;
            }
            const rosterData = rosterSnap.data();
            await setDoc(doc(qualityDb, 'users', qualityAuth.currentUser.uid), {
                email,
                role: 'agent',
                agentName: rosterData.agentName || '',
                agentId: rosterData.agentId || ''
            });
        } catch (provisionErr) {
            console.warn('Quality Score link: provisioning failed.', provisionErr);
            qsHidePanel();
            return;
        }
    }
    await qsLoadAndRenderScores(email);
}

/* ==========================================================================
   🎯 CSAT SURVEY COOLDOWN TRACKER
   Enterprise Support / EBRO agents only. Tracks (does not send) whether a
   CSAT survey was already logged for a customer's email within the last 30
   days. Agents are blocked from re-marking within that window; a Supervisor
   can override with their master credentials.
   ========================================================================== */
const CSAT_ELIGIBLE_LOBS = ['ES', 'EBRO'];
const CSAT_COOLDOWN_DAYS = 30;
let csatOverrideActive = false; // true once a Supervisor has approved an override for the current email

function csatIsLobEligible(lob) {
    return CSAT_ELIGIBLE_LOBS.includes(String(lob || '').trim().toUpperCase());
}

function csatShowSubpaneIfEligible() {
    const subpane = document.getElementById('csatTrackerSubpane');
    if (!subpane) return;
    subpane.style.display = csatIsLobEligible(currentAgentLob) ? 'block' : 'none';
}

function csatNormalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function csatDaysSince(isoString) {
    const then = new Date(isoString).getTime();
    if (isNaN(then)) return Infinity;
    return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

async function csatCheckCooldown() {
    const statusArea = document.getElementById('csatStatusArea');
    const emailField = document.getElementById('email');
    if (!statusArea || !emailField) return;

    csatOverrideActive = false;
    const email = csatNormalizeEmail(emailField.value);

    if (!email || !email.includes('@')) {
        statusArea.innerHTML = `<div class="csat-note csat-jump-link" id="csatJumpToEmail"><i class="fas fa-arrow-up"></i> This isn't a text box — click here to jump to the Email Address field above and fill it in.</div>`;
        const jumpLink = document.getElementById('csatJumpToEmail');
        if (jumpLink) jumpLink.onclick = () => { emailField.focus(); emailField.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
        return;
    }

    statusArea.innerHTML = `<div class="csat-note"><i class="fas fa-spinner fa-spin"></i> Checking survey history...</div>`;

    try {
        const logSnap = await getDoc(doc(firestoreDb, 'csat_survey_log', email));
        if (!logSnap.exists()) {
            csatRenderEligible(email, null);
            return;
        }
        const data = logSnap.data();
        const daysSince = csatDaysSince(data.lastSentAt);
        if (daysSince >= CSAT_COOLDOWN_DAYS) {
            csatRenderEligible(email, data);
        } else {
            csatRenderBlocked(email, data, daysSince);
        }
    } catch (err) {
        console.warn('CSAT tracker: could not check survey log.', err);
        statusArea.innerHTML = `<div class="csat-note csat-note-error">Could not check survey history right now.</div>`;
    }
}

function csatRenderEligible(email, priorData) {
    const statusArea = document.getElementById('csatStatusArea');
    if (!statusArea) return;
    const priorLine = priorData
        ? `<div class="csat-note">Last sent ${csatDaysSince(priorData.lastSentAt)} day(s) ago — cooldown has cleared.</div>`
        : `<div class="csat-note">No survey on record for this email.</div>`;
    statusArea.innerHTML = `
        <div class="csat-status csat-status-ok"><i class="fas fa-circle-check"></i> Eligible to send</div>
        ${priorLine}
        <button type="button" id="csatMarkSentBtn" class="csat-btn csat-btn-primary">
            <i class="fas fa-paper-plane"></i> Mark Survey as Sent
        </button>`;
    document.getElementById('csatMarkSentBtn').onclick = () => csatMarkSurveySent(email, false);
}

function csatRenderBlocked(email, data, daysSince) {
    const statusArea = document.getElementById('csatStatusArea');
    if (!statusArea) return;
    const daysLeft = CSAT_COOLDOWN_DAYS - daysSince;
    const sentByLine = data.sentByAgentName ? ` by ${qsEscapeHtml(data.sentByAgentName)}` : '';
    statusArea.innerHTML = `
        <div class="csat-status csat-status-blocked"><i class="fas fa-ban"></i> Cooldown active</div>
        <div class="csat-note">Survey already sent ${daysSince} day(s) ago${sentByLine}. Eligible again in ${daysLeft} day(s).</div>
        <button type="button" id="csatOverrideBtn" class="csat-btn csat-btn-secondary">
            <i class="fas fa-user-shield"></i> Request Supervisor Override
        </button>`;
    document.getElementById('csatOverrideBtn').onclick = () => csatRequestOverride(email);
}

async function csatRequestOverride(email) {
    const statusArea = document.getElementById('csatStatusArea');
    if (!statusArea) return;
    statusArea.insertAdjacentHTML('beforeend', `
        <div id="csatOverridePrompt" class="csat-override-prompt">
            <input type="text" id="csatSupUser" placeholder="Supervisor username" autocomplete="off">
            <input type="password" id="csatSupPass" placeholder="Supervisor password" autocomplete="off">
            <div style="display:flex; gap:6px; margin-top:6px;">
                <button type="button" id="csatSupConfirm" class="csat-btn csat-btn-primary" style="flex:1;">Confirm</button>
                <button type="button" id="csatSupCancel" class="csat-btn csat-btn-secondary" style="flex:1;">Cancel</button>
            </div>
            <div id="csatSupError" class="csat-note csat-note-error" style="display:none;"></div>
        </div>`);

    document.getElementById('csatSupCancel').onclick = () => {
        document.getElementById('csatOverridePrompt')?.remove();
    };
    document.getElementById('csatSupConfirm').onclick = async () => {
        const user = document.getElementById('csatSupUser').value.trim().toLowerCase();
        const pass = document.getElementById('csatSupPass').value.trim();
        const errEl = document.getElementById('csatSupError');
        try {
            const supervisorSnap = await getDoc(doc(firestoreDb, 'supervisor_profiles', 'master_account'));
            if (supervisorSnap.exists()) {
                const adminData = supervisorSnap.data();
                if (pass === adminData.password && user === String(adminData.username || '').toLowerCase()) {
                    document.getElementById('csatOverridePrompt')?.remove();
                    csatOverrideActive = true;
                    showToast('Supervisor override approved.');
                    csatMarkSurveySent(email, true);
                    return;
                }
            }
            errEl.textContent = 'Incorrect supervisor credentials.';
            errEl.style.display = 'block';
        } catch (err) {
            errEl.textContent = 'Could not verify credentials right now.';
            errEl.style.display = 'block';
        }
    };
}

async function csatMarkSurveySent(email, overridden) {
    try {
        await setDoc(doc(firestoreDb, 'csat_survey_log', email), {
            email,
            lastSentAt: new Date().toISOString(),
            sentByAgentEmail: currentAgentEmail || '',
            sentByAgentName: currentAgentName || '',
            lob: currentAgentLob || '',
            overridden: !!overridden
        });
        showToast(overridden ? 'Survey logged with supervisor override.' : 'Survey logged as sent.');
        csatCheckCooldown();
    } catch (err) {
        console.warn('CSAT tracker: could not log survey.', err);
        showToast('Could not log the survey — try again.', true);
    }
}

const THEME_KEY = "auto_docs_theme";

let csatSupervisorLogRows = [];

// 🪟 Draggable Telemetry Portal panel
let telemetryPanelDragInitialized = false;
let telemetryPanelHasBeenPositioned = false;

function positionTelemetryPanel(panel) {
    if (!panel) return;
    if (!telemetryPanelHasBeenPositioned) {
        // Center it on first open only — subsequent opens remember where the user left it
        requestAnimationFrame(() => {
            const rect = panel.getBoundingClientRect();
            const left = Math.max(10, (window.innerWidth - rect.width) / 2);
            const top = Math.max(10, (window.innerHeight - rect.height) / 2);
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            telemetryPanelHasBeenPositioned = true;
        });
    }
    initTelemetryPanelDrag(panel);
}

function initTelemetryPanelDrag(panel) {
    if (telemetryPanelDragInitialized) return;
    telemetryPanelDragInitialized = true;

    const handle = panel.querySelector('.supervisor-header-row');
    if (!handle) return;

    let dragging = false;
    let offsetX = 0, offsetY = 0;

    handle.addEventListener('mousedown', (e) => {
        if (e.target.closest('#closeTelemetryBtn')) return; // don't drag when clicking Close
        dragging = true;
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const rect = panel.getBoundingClientRect();
        let left = e.clientX - offsetX;
        let top = e.clientY - offsetY;
        // Keep at least 40px of the header on-screen so it's never lost off-viewport
        left = Math.min(Math.max(left, -rect.width + 120), window.innerWidth - 120);
        top = Math.min(Math.max(top, 0), window.innerHeight - 40);
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
    });

    document.addEventListener('mouseup', () => { dragging = false; });
}

// 🎛️ Supervisor panel tab switching
document.querySelectorAll('.sup-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sup-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sup-tab-panel').forEach(p => p.style.display = 'none');
        btn.classList.add('active');
        const panel = document.getElementById('supTab' + btn.dataset.suptab.charAt(0).toUpperCase() + btn.dataset.suptab.slice(1));
        if (panel) panel.style.display = 'block';
        if (btn.dataset.suptab === 'csatlog') csatLoadSupervisorLog();
    });
});

async function csatLoadSupervisorLog() {
    const listEl = document.getElementById('csatLogList');
    if (!listEl) return;
    listEl.innerHTML = `<div class="csat-note"><i class="fas fa-spinner fa-spin"></i> Loading survey log...</div>`;
    try {
        const snap = await getDocs(collection(firestoreDb, 'csat_survey_log'));
        csatSupervisorLogRows = snap.docs.map(d => d.data()).sort((a, b) =>
            String(b.lastSentAt || '').localeCompare(String(a.lastSentAt || '')));
        csatRenderSupervisorLog(csatSupervisorLogRows);
    } catch (err) {
        console.warn('CSAT supervisor log: could not load.', err);
        listEl.innerHTML = `<div class="csat-note csat-note-error">Could not load the survey log.</div>`;
    }
}

function csatRenderSupervisorLog(rows) {
    const listEl = document.getElementById('csatLogList');
    if (!listEl) return;
    if (!rows.length) {
        listEl.innerHTML = `<div class="csat-note">No CSAT surveys logged yet.</div>`;
        return;
    }
    listEl.innerHTML = rows.map(r => {
        const daysSince = csatDaysSince(r.lastSentAt);
        const cooldownActive = daysSince < CSAT_COOLDOWN_DAYS;
        const dateStr = r.lastSentAt ? new Date(r.lastSentAt).toLocaleDateString() : '—';
        return `<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; font-size: 11px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span style="font-weight:700; color:#fff;">${qsEscapeHtml(r.email)}</span>
                <span style="color:${cooldownActive ? '#ef4444' : '#10b981'}; font-weight:700; white-space:nowrap;">
                    ${cooldownActive ? `Cooldown (${CSAT_COOLDOWN_DAYS - daysSince}d left)` : 'Cleared'}
                </span>
            </div>
            <div style="color:#94a3b8; margin-top:3px;">
                Sent ${dateStr} (${daysSince}d ago) by ${qsEscapeHtml(r.sentByAgentName || 'Unknown')} · ${qsEscapeHtml(r.lob || '—')}${r.overridden ? ' · <span style="color:#f59e0b;">Supervisor override</span>' : ''}
            </div>
        </div>`;
    }).join('');
}

document.getElementById('csatLogSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = term ? csatSupervisorLogRows.filter(r => (r.email || '').toLowerCase().includes(term)) : csatSupervisorLogRows;
    csatRenderSupervisorLog(filtered);
});
let bannerTimeout = null; 
let isResetting = false;      
let saveTimeout = null;      
let currentAuthMode = "LOGIN"; 
let globalShiftHistory = []; 

// Session Management State variables for Email/Database Routing
let isSupervisorAuthenticated = false;
let currentAgentId = null; // Will now store the verified document ID / unique identifier
let currentAgentEmail = null; 
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
      
      // 1. Render the structured workspace guidelines advice + interactive knowledge maps
      let htmlContent = cloudData.htmlContent || "• Follow standard processing vectors designated for this row.";
      
      // If a supervisor attached a hyperlink, append it nicely underneath the advice map
      if (cloudData.hyperlinkUrl && cloudData.hyperlinkUrl.trim() !== "") {
        const label = cloudData.hyperlinkLabel || "Open Related KB Reference / Link";
        htmlContent += `
          <div class="playbook-link-block" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <a href="${cloudData.hyperlinkUrl}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
              <i class="fas fa-external-link-alt"></i> ${label}
            </a>
          </div>`;
      }
      
      target.innerHTML = htmlContent;
      
      // 2. Fetch the template directly from the database snapshot record and inject with the warning sign
      const databaseTemplateText = cloudData.rawSpielText || "";
      updatePlaybookSpiel(concern, voc, databaseTemplateText);
      
      const panel = $('playbookPanel');
      if (panel) {
        panel.classList.add('panel-flash-active');
        setTimeout(() => panel.classList.remove('panel-flash-active'), 600);
      }
    } else {
      // Clean fallback if document doesn't exist in Firestore
      target.innerHTML = html + `• Follow standard processing vectors designated for ${voc}.<br><br><i style="color: var(--text-muted);">Note: Detailed cloud playbook sheet not yet compiled for this row.</i>`;
      updatePlaybookSpiel(concern, voc, ""); // Pass blank if missing to clear the old layout
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
   STRICT WORKSPACE MANAGEMENT & ISOLATION HOOKS (DOM ACCELERATED PURGE)
   ========================================================================== */
function isolateWorkspaceUI(role) {
  const mainWorkspaceLayout = document.querySelector('.layout');
  const viewPlaybooksDrawerBtn = $('drawerToggle') || document.getElementById('drawerToggle');
  const mobileActionDock = document.querySelector('.floating-action-dock');
  const supervisorAdminPanel = $('supervisorAdminPanel') || document.getElementById('supervisorAdminPanel');
  const supervisorPanel = $('supervisorPanel') || document.getElementById('supervisorPanel');
  const outputPanel = document.querySelector('.outputPanel');
  const playbookPanel = $('playbookPanel') || document.getElementById('playbookPanel');
  const supervisorAnalyticsDashboard = document.getElementById('supervisorDashboardCanvas');

  // 🎯 UNCOMPROMISING ELEMENT ARRAY TARGETING
  const agentFormSelectors = [
    document.getElementById('agentMainFormWrapper'),
    document.getElementById('workbenchMainFormContainer'),
    document.querySelector('.inputPanel'),
    document.querySelector('section.inputPanel')
  ];

  const normalizedRole = String(role).toUpperCase();
  console.log(`🎛️ Workspace Transition Fired -> Targeted Profile State: ${normalizedRole}`);

  if (normalizedRole === "SUPERVISOR") {
    // 1. Maintain layout grid positioning architecture
    if (mainWorkspaceLayout) mainWorkspaceLayout.style.setProperty('display', 'grid', 'important');
    // 🎯 Playbooks (and the mobile "View Playbooks" toggle) are an agent-only
    // concept — hide both entirely for supervisors instead of forcing them visible.
    if (viewPlaybooksDrawerBtn) viewPlaybooksDrawerBtn.style.setProperty('display', 'none', 'important');
    if (playbookPanel) playbookPanel.style.setProperty('display', 'none', 'important');

    // 2. 🛡️ RECLAIM SPACE: Aggressively target and overwrite agent input elements
    agentFormSelectors.forEach(element => {
      if (element) {
        element.style.setProperty('display', 'none', 'important');
      }
    });

    // 3. Clear all mobile-specific floating entry elements out of sight
    if (mobileActionDock) mobileActionDock.style.setProperty('display', 'none', 'important');
    if (outputPanel) outputPanel.style.setProperty('display', 'none', 'important');
    if (supervisorAdminPanel) supervisorAdminPanel.style.setProperty('display', 'none', 'important');

    // 4. Reveal Supervisor Controls & Visual Analytics Dashboard Canvas
    if (supervisorPanel) supervisorPanel.style.setProperty('display', 'block', 'important');
    if (supervisorAnalyticsDashboard) {
      supervisorAnalyticsDashboard.style.setProperty('display', 'flex', 'important');
    }

    // 5. Connect real-time active floor intent stream queries
    listenToGlobalIntentAnalytics();

  } else {
    // 🔓 STANDARD AGENT ROUTING LOGIC & RESET SEQUENCE
    if (mainWorkspaceLayout) mainWorkspaceLayout.style.setProperty('display', 'grid');
    if (viewPlaybooksDrawerBtn) viewPlaybooksDrawerBtn.style.removeProperty('display');
    if (playbookPanel) playbookPanel.style.setProperty('display', 'block');

    // Restore full functionality to agent tracking forms
    agentFormSelectors.forEach(element => {
      if (element) {
        element.style.setProperty('display', 'block');
      }
    });

    // Handle responsive layouts cleanly depending on current window dimensions during reload
    if (window.innerWidth <= 1024) {
      if (mobileActionDock) mobileActionDock.style.setProperty('display', 'grid', 'important');
    } else {
      if (mobileActionDock) mobileActionDock.style.setProperty('display', 'none');
    }
    
    if (outputPanel) outputPanel.style.setProperty('display', 'block');

    // Completely lock and isolate admin panels away from agent access layers
    if (supervisorAdminPanel) supervisorAdminPanel.style.setProperty('display', 'none');
    if (supervisorPanel) supervisorPanel.style.setProperty('display', 'none');
    if (supervisorAnalyticsDashboard) supervisorAnalyticsDashboard.style.setProperty('display', 'none');

    // Unsubscribe database pipeline to prevent unneeded background thread cycles
    if (globalDashboardUnsubscribe) {
      globalDashboardUnsubscribe();
      globalDashboardUnsubscribe = null;
      console.log("🛑 Dashboard Snapshot Engine safely unmounted.");
    }
  }
}

/* ==========================================================================
   📊 SUPERVISOR INTENT COMMAND HUB & REAL-TIME SPECTRUM PIPELINE
   ========================================================================== */
let globalDashboardUnsubscribe = null;
let currentActiveDashboardData = []; // Cached snapshot object for standalone spreadsheet processing


/* ==========================================================================
   📘 SUPERVISOR PLAYBOOK INJECTION ENGINE
   ========================================================================== */
document.getElementById('supervisorPlaybookForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const rawVocInput = document.getElementById('newVocId').value.trim();
  const concernTypeForVoc = document.getElementById('newVocConcernType').value;
  const operationalMatrixHtml = document.getElementById('newHtmlContent').value.trim();
  const sampleEmailGuideText = document.getElementById('newRawSpielText').value.trim();

  if (!concernTypeForVoc) {
    alert("❌ Please select which Concern Type this VOC belongs to.");
    return;
  }

  const synchronizedDocId = rawVocInput.replace(/\//g, "-");

  try {
    const playbookDocRef = doc(firestoreDb, "playbooks", synchronizedDocId);
    await setDoc(playbookDocRef, {
      htmlContent: operationalMatrixHtml,
      rawSpielText: sampleEmailGuideText,
      lastUpdated: Date.now()
    });

    // 🎯 THE FIX: register the VOC name itself so it shows up in agents' dropdowns
    const vocListRef = doc(firestoreDb, "voc_lists", concernTypeForVoc);
    await setDoc(vocListRef, {
      options: arrayUnion(rawVocInput)
    }, { merge: true });

      showVocInjectionSuccess(rawVocInput, concernTypeForVoc);
    document.getElementById('supervisorPlaybookForm').reset();

  } catch (error) {
    console.error("🚨 Playbook Injection Module Failure:", error);
    showSystemAlert("Injection Failed", `Execution Error: ${error.message}`);
  }
});

/* ==========================================================================
   📊 SUPERVISOR INTENT REAL-TIME DISTRIBUTION TRACKER (OMNI-PARSER)
   ========================================================================== */
function listenToGlobalIntentAnalytics() {
  if (globalDashboardUnsubscribe) {
    globalDashboardUnsubscribe();
    globalDashboardUnsubscribe = null;
  }

  const chartDeckUI = document.getElementById('dashSpectrumGraphContainer');
  console.log(`📡 Telemetry Bridge Armed: Listening to Case Logs for VOC Specifics...`);

  const liveTrackerRef = collection(firestoreDb, "case_logs");

  globalDashboardUnsubscribe = onSnapshot(liveTrackerRef, (snapshot) => {
    const rawIntentCounts = {};
    let aggregatedTotalShiftVolume = 0;

    snapshot.forEach((doc) => {
      const d = doc.data();
      const targetArrayKey = Object.keys(d).find(key => Array.isArray(d[key]));
      if (!targetArrayKey) return; 

      const caseArray = d[targetArrayKey];
      caseArray.forEach((caseItem) => {
        const rawTextString = caseItem.text || "";
        if (!rawTextString) return;

        const vocTypeMatch = rawTextString.match(/VOC:\s*(.*?)\s*(?:SUBJ:|DATE\/TIME:)/i);
        let extractedIntent = "UNCLASSIFIED VOC";
        if (vocTypeMatch && vocTypeMatch[1]) {
          extractedIntent = vocTypeMatch[1].trim();
        }

        const cleanKey = extractedIntent.toUpperCase().trim();
        if (!cleanKey || cleanKey === "" || cleanKey === "SELECT VOC" || cleanKey === "UNDEFINED") return;

        if (!rawIntentCounts[cleanKey]) {
          rawIntentCounts[cleanKey] = 0;
        }
        rawIntentCounts[cleanKey] += 1;
        aggregatedTotalShiftVolume += 1;
      });
    });

    const baselineAverages = {
      "SIM REPLACEMENT": 10,
      "ADA ENROLLMENT": 8,
      "DATA CONNECTIVITY:INTERMITTENT CONNECTION": 15
    };

    const compiledList = Object.keys(rawIntentCounts).map(intentKey => {
      const activeVolume = rawIntentCounts[intentKey];
      const baselineVal = baselineAverages[intentKey] || 5;
      const deviationDelta = baselineVal > 0 ? ((activeVolume - baselineVal) / baselineVal) * 100 : 0;

      return {
        intent: intentKey,
        volume: activeVolume,
        baseline: baselineVal,
        deviation: deviationDelta
      };
    });

    compiledList.sort((a, b) => b.volume - a.volume);
    currentActiveDashboardData = compiledList;

    if (chartDeckUI) {
      if (compiledList.length === 0) {
        chartDeckUI.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #94a3b8; font-style: italic; font-size: 12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
            No specific VOC case flags parsed during this shift yet.
          </div>`;
        updateKpiTextDisplays(0, "N/A", "NOMINAL");
        return;
      }

      const absoluteHighestPeakVolume = compiledList[0].volume;
      
      // 🎛️ Modern Wrapper: Implements a fixed-height scrollable flexbox canvas grid
      let uiBufferHtml = `
        <div style="
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
          gap: 10px; 
          max-height: 400px; 
          overflow-y: auto; 
          padding-right: 6px;
          scroll-behavior: smooth;
        " class="custom-dashboard-scroll">
      `;

      compiledList.forEach(node => {
        const graphicalWidthPercent = absoluteHighestPeakVolume > 0 ? (node.volume / absoluteHighestPeakVolume) * 100 : 0;
        
        // Modern UI: Blue neon accents for standard lines, soft amber warnings for surges
        let glowAccent = node.volume >= 12 ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)";
        let barColor = node.volume >= 12 ? "#f59e0b" : "#3b82f6";

        uiBufferHtml += `
          <div style="
            background: rgba(30, 41, 59, 0.7); 
            backdrop-filter: blur(8px);
            padding: 10px 12px; 
            border-radius: 6px; 
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: inset 0 0 12px ${glowAccent};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 6px;
          ">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <span style="font-weight: 600; color: #f1f5f9; font-size: 11px; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.3px; word-break: break-word;">
                ${node.intent}
              </span>
              <span style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; color: ${barColor}; white-space: nowrap;">
                Vol: ${node.volume}
              </span>
            </div>
            
            <div style="width: 100%;">
              <div style="background: rgba(0,0,0,0.3); height: 5px; border-radius: 99px; width: 100%; overflow: hidden;">
                <div style="width: ${graphicalWidthPercent}%; background: ${barColor}; height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
            </div>
          </div>
        `;
      });

      uiBufferHtml += `</div>`; // Close grid container

      // Inject custom inline style to make the scrollbar minimal and elegant
      const scrollStyle = `
        <style>
          .custom-dashboard-scroll::-webkit-scrollbar { width: 5px; }
          .custom-dashboard-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 99px; }
          .custom-dashboard-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
          .custom-dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        </style>
      `;

      chartDeckUI.innerHTML = scrollStyle + uiBufferHtml;
      updateKpiTextDisplays(aggregatedTotalShiftVolume, compiledList[0].intent, "ACTIVE SHIFT");
    }
  }, (error) => {
    console.error("🚨 Live Stream Engine Error:", error);
  });
}

/**
 * Helper to update dynamic values inside upper metric blocks
 */
function updateKpiTextDisplays(totalVal, topDriver, floorStatus) {
  const volTxt = document.getElementById('dashTotalVolumeText');
  const driverTxt = document.getElementById('dashTopDriverText');
  const statusTxt = document.getElementById('dashHealthStatusText');

  if (volTxt) volTxt.textContent = totalVal;
  if (driverTxt) {
    driverTxt.textContent = topDriver;
    driverTxt.style.color = floorStatus.includes("SURGING") ? "#ef4444" : "#60a5fa";
  }
  if (statusTxt) {
    statusTxt.textContent = floorStatus;
    statusTxt.style.color = floorStatus.includes("SURGING") ? "#ef4444" : "#10b981";
  }
}

// 🎯 NOTE: The old standalone "Export Intent Matrix (CSV)" button/function that
// used to live here has been removed — superseded by extractIntentDistributionMatrix()
// in the Telemetry Reports modal, which adds date-range + LOB filtering and
// exports real .xlsx instead of an unfiltered live-snapshot CSV.

/* ==========================================================================
   Listen To Dynamic VOC LSIT
   ========================================================================== */

function listenToDynamicVocLists() {
  const vocListsRef = collection(firestoreDb, "voc_lists");
  onSnapshot(vocListsRef, (snapshot) => {
    snapshot.forEach(docSnap => {
      const concernKey = docSnap.id; // "Technical" / "Aftersales" / etc.
      const options = docSnap.data().options || [];
      if (!VOC_OPTIONS[concernKey]) return;
      options.forEach(v => {
        if (v && !VOC_OPTIONS[concernKey].includes(v)) {
          VOC_OPTIONS[concernKey].push(v);
        }
      });
    });
    // Refresh whatever dropdown is currently open so it updates live
    if (typeof updateVocOptions === "function") updateVocOptions(true);
    if (typeof syncSupervisorVocDropdown === "function") syncSupervisorVocDropdown();
  });
}
/* ==========================================================================
   EMAIL-BASED OPERATIONAL ACCOUNT PROVISIONING VIEW TOGGLE
   ========================================================================== */
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  
  if (currentAuthMode === "LOGIN") {
    currentAuthMode = "REGISTER";
    $('authTitle').textContent = "Register Agent Profile";
    $('authSubtitle').textContent = "Configure secure email credentials and workforce details";
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

/* ==========================================================================
   AUTHENTICATION ENTRYWAY & INTEGRATED SESSION STATE ROUTINES (EMAIL CORRECTIONS)
   ========================================================================== */
async function handleAuthSubmission(e) {
  e.preventDefault();
  const agentEmail = $('authEmail').value.trim(); // Reads field value as an Email address string
  const password = $('authPassword').value.trim();
  const fullName = $('authName')?.value.trim().toUpperCase() || "";
  const selectedLob = $('authLob')?.value || "";
  const todayStr = getSystemDateString();

// ==========================================================================
  // SECURE SUPERVISOR PORTAL ACCESSIBILITY CHECKER (DATABASE DRIVEN)
  // ==========================================================================
  const lowerInput = agentEmail.toLowerCase();
  
  if (lowerInput === "admin" || lowerInput === "supervisor" || lowerInput === "admin@domain.com") {
    try {
      // 📡 Fetch the supervisor credentials securely from the cloud database
      const supervisorRef = doc(firestoreDb, "supervisor_profiles", "master_account");
      const supervisorSnap = await getDoc(supervisorRef);

      if (supervisorSnap.exists()) {
        const adminData = supervisorSnap.data();

        // Validate the entered username and password against the database values
        if (password === adminData.password && lowerInput === adminData.username.toLowerCase()) {
          
          // 🔒 ELEVATE STATE CLEARANCE TOKENS
          isSupervisorAuthenticated = true; 
          currentAgentId = "SUPERVISOR";
          currentAgentEmail = agentEmail;
          currentAgentName = "Operations Supervisor";
          currentAgentLob = "MANAGEMENT";
          csatShowSubpaneIfEligible();
          trainingModeActive = false;
          window.trainingModeActive = false;
          localStorage.setItem("active_agent_session_id", "SUPERVISOR");
          document.body.classList.add('role-supervisor');

          // ERASE CREDENTIALS IMMEDIATELY TO SECURE THE GATEWAY SCREEN
          $('authEmail').value = "";
          $('authPassword').value = "";
          if ($('authName')) $('authName').value = "";
          
          $('authModal').style.display = "none";
          if ($('logoutBtn')) $('logoutBtn').style.display = "block";
          
          isolateWorkspaceUI("SUPERVISOR");
          
          if (typeof bypassLockForAuthenticatedSupervisor === "function") {
            bypassLockForAuthenticatedSupervisor();
          }
          
          const telemetryContainer = document.getElementById("supervisorAdminPanel") || $('supervisorAdminPanel');
          if (telemetryContainer) {
            telemetryContainer.style.display = "none";
            telemetryContainer.style.visibility = "hidden";
            telemetryContainer.style.opacity = "0";
          }

          if (typeof window.evaluateShiftCheckInModal === "function") {
            window.evaluateShiftCheckInModal();
          }
          
          showToast("Supervisor Portal Engaged.");
          return;
        }
      }
      
      // Generic error so malicious users don't know if the username or password was wrong
      showSystemAlert("Access Denied", "Invalid administrative supervisor master token.");
      $('authPassword').value = "";
      $('authPassword').focus();
      return;

    } catch (dbError) {
      console.error("Supervisor secure validation error:", dbError);
      showSystemAlert("Security Exception", "Database verification pipeline rejected interaction.");
      return;
    }
  }

// ❌ REMOVE OR COMMENT OUT THIS BLOCK FROM YOUR JS CODE:
/*
if (!agentEmail.includes("@")) {
  showSystemAlert("Format Error", "Please provide a valid agent email address!");
  $('authEmail').focus();
  return;
}
*/

  try {
    // Look up via profile collection by matching the 'email' property
    const agentProfilesRef = collection(firestoreDb, "agent_profiles");
    const profileQuery = query(agentProfilesRef, where("email", "==", agentEmail));
    const profileQuerySnap = await getDocs(profileQuery);

if (currentAuthMode === "LOGIN") {
      // 📡 DUAL-LOGIN ENGINE: Check if the input matches 'email' OR 'winid' (or agent_id)
      const agentProfilesRef = collection(firestoreDb, "agent_profiles");
      
      // Query 1: Try matching by Email
      const emailQuery = query(agentProfilesRef, where("email", "==", agentEmail));
      let profileQuerySnap = await getDocs(emailQuery);

      // Query 2: If no email match, try matching by WinID/Agent ID instead
      if (profileQuerySnap.empty) {
        const idQuery = query(agentProfilesRef, where("agent_id", "==", agentEmail));
        profileQuerySnap = await getDocs(idQuery);
      }

      if (!profileQuerySnap.empty) {
        const profileDoc = profileQuerySnap.docs[0];
        const profileData = profileDoc.data();

      if (profileData.password === password) {
          isSupervisorAuthenticated = false; 
          currentAgentId = profileDoc.id;    
          window.currentAgentId = profileDoc.id;   // 🎯 THE FIX
          currentAgentEmail = profileData.email || "";
          currentAgentName = profileData.full_name || "Agent";
          currentAgentLob = profileData.lob || "UNKNOWN";
          csatShowSubpaneIfEligible();
          trainingModeActive = profileData.training_mode_enabled === true;
          window.trainingModeActive = trainingModeActive;
          localStorage.setItem("active_agent_session_id", currentAgentId);
          document.body.classList.remove('role-supervisor');
          
          $('authEmail').value = "";
          $('authPassword').value = "";

          const agentDocRef = doc(firestoreDb, "agent_profiles", currentAgentId);
          await updateDoc(agentDocRef, { last_active_at: Date.now() }).catch(async () => {
            await setDoc(agentDocRef, { last_active_at: Date.now() }, { merge: true });
          });

          const metricDayRef = doc(firestoreDb, "daily_compliance_telemetry", `${currentAgentId}_${todayStr}`);
          await setDoc(metricDayRef, {
            agent_id: currentAgentId,
            agent_email: currentAgentEmail,
            agent_name: currentAgentName,
            lob: currentAgentLob,
            date: todayStr,
            login_count: increment(1),
            last_activity_at: Date.now()
          }, { merge: true });

          isolateWorkspaceUI("AGENT");
          await handleSessionLoginTransition();
          showToast(`Identity verified. ${currentAgentLob} Session Clear!`);

          // 🎯 Link to Quality Score dashboard (best-effort, never blocks main login)
          linkQualityScoreAccount(currentAgentEmail, password);
        } else {
          showSystemAlert("Authorization Failure", "Incorrect password entered for this security gateway.");
          $('authPassword').value = ""; 
          $('authPassword').focus();
        }
      } else {
        showSystemAlert("Authorization Failure", "No active profile found matching this Email or Agent ID.");
        $('authEmail').focus();
      }
    }else {
      // REGISTER CODE PATH
      if (!profileQuerySnap.empty) {
        showSystemAlert("Profile Error", "This Email address is already registered to an active workspace.");
        $('authEmail').focus();
        return;
      }
      
      // Query official employee roster to ensure domain credentials are authorized
      const rosterRef = collection(firestoreDb, "registered_agents");
      const rosterQuery = query(rosterRef, where("email", "==", agentEmail));
      const rosterQuerySnap = await getDocs(rosterQuery);

      if (rosterQuerySnap.empty) {
        showSystemAlert("Security Warning", `Email [${agentEmail}] is not authorized in the employee database roster.`);
        $('authEmail').focus();
        return;
      }

      const rosterDocData = rosterQuerySnap.docs[0].data();
      const registeredName = rosterDocData.name.trim().toUpperCase();
      
      if (registeredName !== fullName) {
        showSystemAlert("Validation Error", `The full name provided does not match official workplace tracking records.`);
        $('authName').focus();
        return;
      }

      if (!selectedLob) {
        showSystemAlert("Validation Error", "You must assign your designated Line of Business (ES or EBG) profile target.");
        return;
      }
      
      // 🎓 TRAINING MODE SEED: if the roster has Nesting/Prod dates for this
      // agent, default training mode ON until their Prod Date arrives. If
      // either date is missing, this agent registers as a regular (non-training)
      // account. A supervisor can always flip this manually afterward.
      const rosterNestingDate = rosterDocData.nesting_date || null;
      const rosterProdDate = rosterDocData.prod_date || null;
      const todayDateStr = getSystemDateString();
      const initialTrainingModeEnabled = !!(rosterProdDate && todayDateStr < rosterProdDate);

      // Document ID falls back to roster winid mapping or random hash safely auto-generated
      const generatedProfileId = rosterQuerySnap.docs[0].id || "agent_" + Date.now();

      await setDoc(doc(firestoreDb, "agent_profiles", generatedProfileId), {
        agent_id: generatedProfileId,
        email: agentEmail,
        full_name: fullName,
        password: password,
        lob: selectedLob,
        created_at: Date.now(),
        last_active_at: Date.now(),
        training_mode_enabled: initialTrainingModeEnabled,
        nesting_date: rosterNestingDate,
        prod_date: rosterProdDate
      });
      
      showToast("Registration successful! Account provisioned.");
      currentAuthMode = "LOGIN"; 
      toggleAuthMode();
      
      $('authEmail').value = agentEmail;
      $('authPassword').value = "";
      $('authPassword').focus(); 
    }
  } catch (error) {
    console.error("Auth validation error:", error);
    showSystemAlert("Security Exception", "Database verification pipeline rejected interaction.");
  }
}

/* ==========================================================================
   🔑 AUTHENTICATION FLOW & SECURITY LOCK CHANNELS
   ========================================================================== */

async function handleSessionLoginTransition() {
  $('authModal').style.display = "none";
  if ($('logoutBtn')) $('logoutBtn').style.display = "block";
  updateSyncStatusUI('online');

  // 🎓 TRAINING MODE: reflect current state in the persistent banner
  const trainingBanner = $('trainingModeBanner');
  if (trainingBanner) {
    trainingBanner.style.display = trainingModeActive ? "flex" : "none";
  }
  
  updateVocOptions(true);
  updateOutput();
  updateSuggestions();
  
  const orb = document.getElementById('metaTrackerOrb');
  if (orb) {
    orb.style.setProperty('display', 'flex', 'important');
  }
  
  if (typeof window.evaluateShiftCheckInModal === "function") {
    window.evaluateShiftCheckInModal();
  }
  
  // 🎯 FIX: Always restore the main form fields from case_logs,
  // AND separately sync the tracker queue / shift history.
  await pullLiveWorkspace();

  if (window.currentAgentId && typeof window.syncAgentSessionFromCloud === "function") {
    console.log(`⚡ Transition Core: Fetching cloud workbench state for Agent ID: ${window.currentAgentId}`);
    await window.syncAgentSessionFromCloud(window.currentAgentId);
  }
}

// 🎯 SECURE LOGOUT TERMINAL WORKSPACE WIPER
// This interceptor forces the tracking orb to vanish the instant they click sign out.
document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById('logoutBtn');

  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      // 1. Locate all tracking layout surfaces
      const orb = document.getElementById('metaTrackerOrb');
      const bubble = document.getElementById('messengerNotificationBubble');
      const drawer = document.getElementById('metaTrackerDrawer');
      const trainingBanner = document.getElementById('trainingModeBanner');

      // 2. Erase them from the screen completely 
      if (orb) orb.style.setProperty('display', 'none', 'important');
      if (bubble) bubble.style.setProperty('display', 'none', 'important');
      if (drawer) drawer.classList.remove('open-drawer', 'drawer-open');
      if (trainingBanner) trainingBanner.style.display = "none";

      // 3. Kill the background countdown processing engine loop
      if (window.ongoingQueueTrackingLoop) {
        clearInterval(window.ongoingQueueTrackingLoop);
        window.ongoingQueueTrackingLoop = null;
      }

      // 4. Wipe runtime transient state layers
      window.currentAgentId = null;
      window.globalShiftHistory = [];
      window.activeUrgentQueueItems = [];

      // 5. Clear disk caches to ensure absolute privacy for the next user
      localStorage.removeItem('workbench_queue_cache');
      localStorage.removeItem('shift_history_cache_key');

      console.log("🔒 Security Protocol: Station wiped clean. Tracking elements destroyed.");
    });
  }
});

/* ==========================================================================
   👑 SUPERVISOR MATRIX MANAGER MODULE FUNCTIONS (SECURED WITH DATA STATE)
   ========================================================================== */

function bypassLockForAuthenticatedSupervisor() {
  // 🔒 CRITICAL SECURITY CHECK: Ensure the database listener has actually flipped the global switch
  if (!isSupervisorAuthenticated) {
    console.error("CRITICAL ALARM: Direct function execution attempt intercepted. Supervisor token state is FALSE.");
    alert("Security Violation: Action rejected by the application kernel.");
    return; // Kill execution immediately
  }

  // 1. Establish permission verification variable state
  const badge = document.getElementById("authBadge");
  if (badge) {
    badge.innerText = "SYSTEM ADMIN ACTIVE";
    badge.style.background = "#10b981";
  }
  
  // 🎯 UI CHANGE: Bring up the full Supervisor operational wrapper
  const container = document.getElementById("supervisorContent");
  if (container) {
    container.style.display = "block";
    container.style.opacity = "1";
  }
  
  // 2. Build the structural categories list into the first dropdown
  initializeSupervisorDropdowns();
  
  const supeConcernDropdown = document.getElementById("supeConcern");
  const supeVocDropdown = document.getElementById("supeVoc");

  // 3. LINK THE CATEGORY CHANGE EVENT SECURELY IN JAVASCRIPT
  if (supeConcernDropdown) {
    supeConcernDropdown.addEventListener("change", () => {
      syncSupervisorVocDropdown();
      loadCurrentVocMasterData();
    });
  }

  // 4. LINK THE VOC RECONCILIATION SELECTION STRAIGHT TO FIRESTORE READ ENGINE
  if (supeVocDropdown) {
    supeVocDropdown.addEventListener("change", () => {
      loadCurrentVocMasterData();
    });
  }
  
  // 5. Connect primary agent Concern Type choices to reflect in CMS dashboard row automatically
  const primaryConcernDropdown = $("concernType");
  if (primaryConcernDropdown) {
    primaryConcernDropdown.addEventListener("change", (e) => {
      if (supeConcernDropdown) {
        supeConcernDropdown.value = e.target.value;
        syncSupervisorVocDropdown();
        loadCurrentVocMasterData();
      }
    });
  }

  // 6. Connect primary agent VOC manual selections to reflect in CMS inputs
  const primaryVocInput = $("voc");
  if (primaryVocInput) {
    primaryVocInput.addEventListener("input", (e) => {
      const selectedVocValue = e.target.value.trim();
      if (!supeVocDropdown) return;

      const primaryConcernVal = primaryConcernDropdown ? primaryConcernDropdown.value : "";
      if (primaryConcernVal && supeConcernDropdown && supeConcernDropdown.value !== primaryConcernVal) {
        supeConcernDropdown.value = primaryConcernVal;
        syncSupervisorVocDropdown();
      }

      const optionExists = Array.from(supeVocDropdown.options).some(opt => opt.value === selectedVocValue);
      if (optionExists && selectedVocValue !== "") {
        supeVocDropdown.value = selectedVocValue;
        loadCurrentVocMasterData();
      }
    });
  }

  // 7. LINK THE PUBLISH BUTTON SECURELY TO THE FIRESTORE WRITE ENGINE
  const supePublishBtn = document.getElementById("supePublishBtn");
  if (supePublishBtn) {
    // 🎯 RE-UPGRADED: Replaced wrapper with unified engine selector match
    supePublishBtn.addEventListener("click", () => {
      saveMasterPlaybookConfiguration();
    });
  }

  // 8. INSTANT UNLOCK: Force options and active data to populate immediately 
  syncSupervisorVocDropdown();
  loadCurrentVocMasterData();
}

function initializeSupervisorDropdowns() {
  const supeConcern = document.getElementById("supeConcern");
  if (!supeConcern) return;
  
  supeConcern.innerHTML = `
    <option value="">-- Choose Category --</option>
    <option value="Technical">Technical</option>
    <option value="Aftersales">Aftersales</option>
    <option value="Inquiry">Inquiry</option>
    <option value="Complaint">Complaint</option>
  `;
}

function syncSupervisorVocDropdown() {
  const supeConcernEl = document.getElementById("supeConcern");
  if (!supeConcernEl) return;
  
  const concernVal = supeConcernEl.value;
  const supeVoc = document.getElementById("supeVoc");
  if (!supeVoc) return;

  // Added checking block to prevent throwing errors if VOC_OPTIONS is loading asynchronously from database
  if (!concernVal || typeof VOC_OPTIONS === 'undefined' || !VOC_OPTIONS || !VOC_OPTIONS[concernVal]) {
    supeVoc.innerHTML = '<option value="">-- Select Concern First --</option>';
    return;
  }

  const optionsList = VOC_OPTIONS[concernVal];
  supeVoc.innerHTML = optionsList.map(v => `<option value="${v}">${v}</option>`).join("");
  
  loadCurrentVocMasterData();
}

// ==========================================
// CHANNEL A: SYSTEM MASTER SUPERVISOR INPUTS ONLY
// ==========================================
async function loadCurrentVocMasterData() {
  // Directly point ONLY to supervisor editor fields
  const targetVoc = document.getElementById("supeVoc")?.value;
  const htmlInput = document.getElementById("supeHtmlContent");
  const urlInput = document.getElementById("supeUrl");
  const labelInput = document.getElementById("supeLabel");
  const spielInput = document.getElementById("supeSpielText");
  
  const suggestionsContainer = document.getElementById("suggestions");
  const spielContainer = document.getElementById("playbookSpielContainer");
  
  if (!targetVoc) return;

  const cleanDocId = targetVoc.replace(/\//g, "-");
  
  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      
      // 1. Populate Supervisor Edit Panel
      if(htmlInput) htmlInput.value = data.htmlContent || "";
      if(urlInput) urlInput.value = data.hyperlinkUrl || "";
      if(labelInput) labelInput.value = data.hyperlinkLabel || "";
      if(spielInput) spielInput.value = data.rawSpielText || "";

      // 2. Mirror live view layout to the drawer preview cards simultaneously
      if (suggestionsContainer) {
        const advice = data.htmlContent || "No operational advice available for this item.";
        const url = data.hyperlinkUrl || "";
        const label = data.hyperlinkLabel || "Open Related KB Reference / Link";

        let htmlContent = `<div class="playbook-advice-block"><p style="line-height: 1.5; white-space: pre-line; color: #f8fafc; margin: 0;">${advice}</p></div>`;
        if (url && url.trim() !== "") {
          htmlContent += `
            <div class="playbook-link-block" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
              <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
                <i class="fas fa-external-link-alt"></i> ${label}
              </a>
            </div>`;
        }
        suggestionsContainer.innerHTML = htmlContent;
      }

      if (spielContainer) {
        const templateText = data.rawSpielText || "";
        spielContainer.innerHTML = templateText && templateText.trim() !== "" ? `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px; margin-top: 8px;">
            <pre id="spielTextElement" style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; color: #cbd5e1; max-height: 200px; overflow-y: auto; line-height: 1.4;">${templateText}</pre>
          </div>` : `<div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">The corresponding email spiel template will load automatically upon context verification.</div>`;
      }
    } else {
      if(htmlInput) htmlInput.value = "";
      if(urlInput) urlInput.value = "";
      if(labelInput) labelInput.value = "";
      if(spielInput) spielInput.value = "";
    }
  } catch (err) {
    console.error("Supervisor data pull exception:", err);
  }
}

// ==========================================
// CHANNEL B: ISOLATED LIVE AGENT PLAYBOOK READER
// ==========================================
async function loadCurrentVocMasterDataForAgent() {
  // Completely ignore supervisor elements to prevent background locks!
  const agentConcern = document.getElementById("concernType")?.value || $('concernType')?.value;
  const agentVoc = document.getElementById("voc")?.value || $('voc')?.value;
  const suggestionsContainer = document.getElementById("suggestions");
  const spielContainer = document.getElementById("playbookSpielContainer");
  
  if (!suggestionsContainer) return;

  // 🎯 FIX 1: If either field is empty, actively reset the panel layout state instead of exiting silently
  if (!agentConcern || agentConcern.trim() === "" || !agentVoc || agentVoc.trim() === "") {
    suggestionsContainer.innerHTML = "Select Concern & VOC to view matrix playbook options...";
    if (spielContainer) {
      spielContainer.innerHTML = `
        <div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">
          The corresponding email spiel template will load automatically upon context verification.
        </div>`;
    }
    return;
  }

  const cleanDocId = agentVoc.replace(/\//g, "-");
  
  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      
      // Update Agent Drawer UI View ONLY
      const advice = data.htmlContent || "No operational advice available for this item.";
      const url = data.hyperlinkUrl || "";
      const label = data.hyperlinkLabel || "Open Related KB Reference / Link";

      let htmlContent = `<div class="playbook-advice-block"><p style="line-height: 1.5; white-space: pre-line; color: #f8fafc; margin: 0;">${advice}</p></div>`;
      if (url && url.trim() !== "") {
        htmlContent += `
          <div class="playbook-link-block" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
              <i class="fas fa-external-link-alt"></i> ${label}
            </a>
          </div>`;
      }
      suggestionsContainer.innerHTML = htmlContent;

      if (spielContainer) {
        const templateText = data.rawSpielText || "";
        spielContainer.innerHTML = templateText && templateText.trim() !== "" ? `
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px; margin-top: 8px;">
            <pre id="spielTextElement" style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; color: #cbd5e1; max-height: 200px; overflow-y: auto; line-height: 1.4;">${templateText}</pre>
          </div>` : `<div style="padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); border-radius: 4px;">The corresponding email spiel template will load automatically upon context verification.</div>`;
      }
    } else {
      // 🎯 FIX 2: Gracefully handle mismatched categories
      suggestionsContainer.innerHTML = `<div style="padding: 10px; color: #94a3b8; font-style: italic;">No active matrix playbook found for "${agentVoc}".</div>`;
      if (spielContainer) spielContainer.innerHTML = "";
    }
  } catch (err) {
    console.error("Agent playbook background read failed silently:", err);
  }
}

async function saveMasterPlaybookConfiguration() {
  if (!isSupervisorAuthenticated) return;

  const targetVoc = document.getElementById("supeVoc").value;
  const targetHtml = document.getElementById("supeHtmlContent")?.value.trim();
  const targetUrl = document.getElementById("supeUrl")?.value.trim();
  const targetLabel = document.getElementById("supeLabel")?.value.trim();
  const targetSpiel = document.getElementById("supeSpielText")?.value;

  if (!targetVoc) {
    alert("❌ Please select a valid target VOC matrix path profile.");
    return;
  }
  if (!targetHtml) {
    alert("❌ Operational Matrix Advice guidelines cannot remain blank.");
    return;
  }

  const cleanDocId = targetVoc.replace(/\//g, "-");
  
  try {
    const docRef = doc(firestoreDb, "playbooks", cleanDocId);
    
// Ensure your updateData block handles empty fields perfectly like this:
const updateData = {
  htmlContent: targetHtml || "",
  rawSpielText: targetSpiel || "",
  hyperlinkUrl: targetUrl || "",
  hyperlinkLabel: targetUrl.trim() !== "" && (!targetLabel || targetLabel.trim() === "") 
    ? "Open Related KB Reference / Link" 
    : (targetLabel || "")
};

    await setDoc(docRef, updateData, { merge: true });
    alert(`🎉 Success! Master playbook entry for "${targetVoc}" updated globally.`);
    
    if (typeof updateSuggestions === "function") {
      updateSuggestions();
    }
  } catch (err) {
    console.error("Firestore database master layout write block:", err);
    alert("❌ Database Write Failure: Ensure write permissions are granted.");
  }
}

/* ==========================================================================
   🎓 TRAINING MODE MANAGER (SUPERVISOR-ONLY)
   ========================================================================== */
let trainingLookupTargetId = null; // caches the agent_profiles doc id from the last successful lookup

async function executeTrainingModeLookup() {
  if (!isSupervisorAuthenticated) return;

  const rawInput = $('trainingLookupInput')?.value.trim();
  const resultBox = $('trainingLookupResult');
  if (!rawInput) {
    showSystemAlert("Missing Input", "Enter an agent's email or WinID to look them up.");
    return;
  }

  try {
    // Try matching by email first, then fall back to matching by agent_id/WinID
    const profilesRef = collection(firestoreDb, "agent_profiles");
    let snap = await getDocs(query(profilesRef, where("email", "==", rawInput)));
    if (snap.empty) {
      snap = await getDocs(query(profilesRef, where("agent_id", "==", rawInput)));
    }

    if (snap.empty) {
      if (resultBox) resultBox.style.display = "none";
      trainingLookupTargetId = null;
      showSystemAlert("Not Found", `No agent profile found matching "${rawInput}".`);
      return;
    }

    const targetDoc = snap.docs[0];
    const data = targetDoc.data();
    trainingLookupTargetId = targetDoc.id;

    if ($('trainingLookupName')) $('trainingLookupName').textContent = `${data.full_name || 'Unknown'} (${data.lob || 'N/A'})`;
    if ($('trainingLookupNesting')) $('trainingLookupNesting').textContent = data.nesting_date || 'Not on file';
    if ($('trainingLookupProd')) $('trainingLookupProd').textContent = data.prod_date || 'Not on file';
    if ($('trainingLookupToggle')) $('trainingLookupToggle').checked = data.training_mode_enabled === true;

    if (resultBox) resultBox.style.display = "block";
  } catch (err) {
    console.error("Training mode lookup failure:", err);
    showSystemAlert("Lookup Error", `Database query failed: ${err.message}`);
  }
}

async function saveTrainingModeToggle() {
  if (!isSupervisorAuthenticated) return;
  if (!trainingLookupTargetId) {
    showSystemAlert("No Agent Selected", "Look up an agent before saving a training mode change.");
    return;
  }

  const newValue = $('trainingLookupToggle')?.checked === true;

  try {
    const docRef = doc(firestoreDb, "agent_profiles", trainingLookupTargetId);
    await setDoc(docRef, { training_mode_enabled: newValue }, { merge: true });
    showToast(`Training mode ${newValue ? "enabled" : "disabled"} for this agent. Takes effect on their next login.`);
  } catch (err) {
    console.error("Training mode save failure:", err);
    showSystemAlert("Save Error", `Could not update training mode: ${err.message}`);
  }
}


/* ==========================================================================
   🔒 SESSION SYSTEM MONITOR & PORTAL ROUTERS (STATION SYNC FIXES EMBEDDED)
   ========================================================================== */
function listenToSessionState() {
  const cachedId = localStorage.getItem("active_agent_session_id");
  
document.querySelectorAll("input, textarea").forEach(el => {
    const isAuthField = el.id === 'authEmail' || el.id === 'authPassword' || el.id === 'authName';
    const isAgentDraftField = el.id === 'case' || el.id === 'min';
    const isColorField = el.type === 'color';   // 🎯 ADD THIS
    const isSupeField = (
      el.id === 'supeHtmlContent' || 
      el.id === 'supeUrl' || 
      el.id === 'supeLabel' || 
      el.id === 'supeSpielText' ||
      el.id === 'broadcastTextInput' ||
      el.id === 'newVocId' ||
      el.id === 'newHtmlContent' ||
      el.id === 'newRawSpielText'
    );

    if (!isAuthField && !isSupeField && !isAgentDraftField && !isColorField) {
      el.value = "";
      el.classList.remove('val-green', 'val-amber', 'val-crimson');
    }
});

  // 🛡️ PROTECTION FIX: Only force drop-down resets if there is NO active session!
  if (!cachedId) {
    const select = $("concernType");
    if (select) select.selectedIndex = 0;
    if (typeof updateVocOptions === "function") updateVocOptions(false);
  }
  
  if (typeof globalShiftHistory !== 'undefined') {
    globalShiftHistory = [];
  } else {
    window.globalShiftHistory = [];
  }

  if (cachedId) {
    currentAgentId = cachedId;
    window.currentAgentId = cachedId; // Secure global window namespace
    
    // 🔒 EVALUATING CACHED SUPERVISOR ROUTE
    if (cachedId === "SUPERVISOR") {
      currentAgentName = "Operations Supervisor";
      currentAgentLob = "MANAGEMENT";
      csatShowSubpaneIfEligible();
      trainingModeActive = false;
      window.trainingModeActive = false;
      
      isSupervisorAuthenticated = true; 
      qsHidePanel();
      if (typeof isolateWorkspaceUI === "function") isolateWorkspaceUI("SUPERVISOR");
      
      if ($('authModal')) $('authModal').style.display = "none";
      if ($('logoutBtn')) $('logoutBtn').style.display = "block";
      
      if (typeof bypassLockForAuthenticatedSupervisor === "function") {
        bypassLockForAuthenticatedSupervisor();
      }
      
      if (typeof updateSyncStatusUI === "function") {
        updateSyncStatusUI('online');
      }
      return;
    }
    
    // 🔒 EVALUATING CACHED AGENT ROUTE
    isSupervisorAuthenticated = false; // Explicit lock reinforcement
    if (typeof isolateWorkspaceUI === "function") isolateWorkspaceUI("AGENT");
    
    getDoc(doc(firestoreDb, "agent_profiles", cachedId)).then(snap => {
      if(snap.exists()) {
        currentAgentName = snap.data().full_name || "Agent " + cachedId;
        currentAgentLob = snap.data().lob || "UNKNOWN";
        csatShowSubpaneIfEligible();
        trainingModeActive = snap.data().training_mode_enabled === true;
        window.trainingModeActive = trainingModeActive;
        
        localStorage.removeItem('workbench_queue_cache');
        localStorage.removeItem('shift_history_cache_key');
        
        // 🛰️ ROAMING PROFILE TRIGGER: Sync active workbench session from cloud
        if (typeof window.syncAgentSessionFromCloud === "function") {
          window.syncAgentSessionFromCloud(cachedId);
        }
        
        if (typeof handleSessionLoginTransition === "function") {
          handleSessionLoginTransition();
        }

      } else {
        localStorage.removeItem("active_agent_session_id");
        showLoginGateway(false);
      }
    }).catch(err => {
      console.error("Critical gateway failure reading agent database index:", err);
      showLoginGateway(false);
    });
  } else {
    // NO ACTIVE SESSION DETECTED
    isSupervisorAuthenticated = false;
    currentAgentId = null;
    window.currentAgentId = null;
    currentAgentName = "Unknown Agent";
    currentAgentLob = "UNKNOWN";
    csatShowSubpaneIfEligible();
    trainingModeActive = false;
    window.trainingModeActive = false;
    caseTabs = [];
    activeTabId = null;
    if (typeof renderCaseTabsBar === "function") renderCaseTabsBar();
    if (typeof isolateWorkspaceUI === "function") isolateWorkspaceUI("AGENT");
    showLoginGateway(false);
    if (typeof updateOutput === "function") updateOutput();
    if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
    
    const spielPanel = $('playbookSpielContainer');
    if (spielPanel) spielPanel.innerHTML = "";
    if (typeof renderHistoryView === "function") renderHistoryView();
  }
}

function showLoginGateway(isRegisterMode = false) {
  if ($('authModal')) $('authModal').style.display = "flex";
  if ($('logoutBtn')) $('logoutBtn').style.display = "none";
  
  if ($('authEmail')) $('authEmail').value = "";
  if ($('authPassword')) $('authPassword').value = "";
  if ($('authName')) $('authName').value = "";

  if (isRegisterMode) {
    currentAuthMode = "REGISTER";
    if ($('authTitle')) $('authTitle').textContent = "Register Agent Profile";
    if ($('authSubtitle')) $('authSubtitle').textContent = "Configure secure numeric credential tokens";
    if ($('authSubmitBtn')) $('authSubmitBtn').textContent = "Provision Account";
    if ($('authToggleAnchor')) $('authToggleAnchor').textContent = "Already have an assigned profile? Log In";
    if ($('authNameContainer')) $('authNameContainer').style.display = "flex";
    if ($('authLobContainer')) $('authLobContainer').style.display = "flex";
  } else {
    currentAuthMode = "LOGIN";
    if ($('authTitle')) $('authTitle').textContent = "Agent Workbench Sign In";
    if ($('authSubtitle')) $('authSubtitle').textContent = "Enter your credentials to clear network gateway";
    if ($('authSubmitBtn')) $('authSubmitBtn').textContent = "Authorize Session";
    if ($('authToggleAnchor')) $('authToggleAnchor').textContent = "Need a new operational profile? Register here";
    if ($('authNameContainer')) $('authNameContainer').style.display = "none";
    if ($('authLobContainer')) $('authLobContainer').style.display = "none";
  }
}


/* ==========================================================================
   🗂️ MULTI-CASE TAB ENGINE (CLOUD-SYNCED, MAX 5 TABS)
   ========================================================================== */
let caseTabs = [];
let activeTabId = null;
const CASE_TAB_FIELD_IDS = ["case","concernType","voc","subj","name","min","company","email","thread","datetime","action","wocas"];
const MAX_CASE_TABS = 5;

// 🔐 LOB GATE: multi-case tabs and the optional Thread Ref/Email section are
// only exposed to EBG accounts. ES agents keep the classic single-case view.
function isEbgAgent() {
  return currentAgentLob === "EBG";
}

// 🎓 TRAINING MODE: when active, all case content writes route to parallel
// training_* Firestore collections instead of the real production ones.
// Attendance telemetry (daily_compliance_telemetry) is NOT forked — that's
// about login/logout access, not case content, so it always stays real.
let trainingModeActive = false;

function scopedCollectionName(baseName) {
  return trainingModeActive ? `training_${baseName}` : baseName;
}

function createBlankCaseTab() {
  const fields = {};
  CASE_TAB_FIELD_IDS.forEach(id => { fields[id] = ""; });
  return {
    id: "tab_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
    fields
  };
}

// Pulls whatever is currently sitting in the DOM into the active tab's in-memory record.
// Called right before any operation that switches, saves, or serializes tabs.
function captureActiveTabFieldsFromDom() {
  const tab = caseTabs.find(t => t.id === activeTabId);
  if (!tab) return;
  CASE_TAB_FIELD_IDS.forEach(id => {
    const el = $(id);
    if (el) tab.fields[id] = el.value;
  });
}

// Pushes a tab's stored fields back into the live DOM inputs and re-runs the
// dependent UI updates (VOC datalist, output preview, playbook suggestions, validators).
async function applyTabFieldsToDom(tab) {
  if (!tab) return;
  CASE_TAB_FIELD_IDS.forEach(id => {
    const el = $(id);
    if (el) el.value = tab.fields[id] || "";
  });
  // Rebuilds the VOC datalist options for the restored Concern Type, then
  // restores the VOC text value we just set (preserveValue reads it back off the input).
  updateVocOptions(true);
  applyOptionalContactFieldsVisibility(tab);
  updateOutput();
  await updateSuggestions();
  if ($('case')) validateCaseField($('case'));
  if ($('min')) validateMinField($('min'));
}

// 🔐 EBG-only: Thread Ref + Email start collapsed behind a toggle. If the tab
// already has data in either field, auto-expand so nothing looks hidden. For
// non-EBG accounts, both fields stay always-visible (classic behavior).
function applyOptionalContactFieldsVisibility(tab) {
  const toggleBtn = $("toggleOptionalContactBtn");
  const wrapper = $("optionalContactFieldsWrapper");
  if (!toggleBtn || !wrapper) return;

  if (!isEbgAgent()) {
    toggleBtn.style.display = "none";
    wrapper.classList.remove("optional-collapsed");
    return;
  }

  toggleBtn.style.display = "flex";
  const hasContactData = tab && (
    (tab.fields.thread && tab.fields.thread.trim() !== "") ||
    (tab.fields.email && tab.fields.email.trim() !== "")
  );

  if (hasContactData) {
    wrapper.classList.remove("optional-collapsed");
    toggleBtn.innerHTML = '<i class="fas fa-minus"></i> Hide Thread Ref / Email';
  } else {
    wrapper.classList.add("optional-collapsed");
    toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Add Thread Ref / Email (optional)';
  }
}

// A tab counts as having unsaved/meaningful content if any field besides the
// auto-populated datetime has been filled in.
function isTabDirty(tab) {
  if (!tab) return false;
  return CASE_TAB_FIELD_IDS.some(id => id !== "datetime" && tab.fields[id] && tab.fields[id].trim() !== "");
}

function renderCaseTabsBar() {
  const bar = $("caseTabsBar");
  const addBtn = $("addCaseTabBtn");
  const tabsRow = document.querySelector('.case-tabs-row');
  if (!bar) return;

  if (!currentAgentId || currentAgentId === "SUPERVISOR" || caseTabs.length === 0) {
    bar.innerHTML = "";
    if (addBtn) addBtn.style.display = "none";
    if (tabsRow) tabsRow.style.display = "none";
    return;
  }

  // 🔐 ES (or any non-EBG) accounts never see the tab bar — they work the
  // single active tab directly. Any extra tabs stay intact in the cloud
  // record untouched, in case the account is ever reassigned to EBG.
  if (!isEbgAgent()) {
    if (tabsRow) tabsRow.style.display = "none";
    return;
  }
  if (tabsRow) tabsRow.style.display = "flex";

  if (addBtn) addBtn.style.display = "flex";

  let html = "";
  caseTabs.forEach((tab, idx) => {
    const isActive = tab.id === activeTabId;
    const rawLabel = tab.fields.case && tab.fields.case.trim() !== "" ? tab.fields.case.trim() : `Case ${idx + 1}`;
    const dirty = isTabDirty(tab);
    html += `
      <div class="case-tab-item ${isActive ? 'active' : ''}" data-tab-id="${tab.id}" draggable="true" title="${rawLabel}">
        ${dirty ? '<span class="case-tab-dirty-dot" title="Has unsaved entries"></span>' : ''}
        <span class="case-tab-label">${rawLabel}</span>
        <button type="button" class="case-tab-close" data-tab-id="${tab.id}" title="Close Tab" aria-label="Close Tab">&times;</button>
      </div>
    `;
  });
  bar.innerHTML = html;

  if (addBtn) {
    const atCap = caseTabs.length >= MAX_CASE_TABS;
    addBtn.disabled = atCap;
    addBtn.title = atCap ? `Maximum of ${MAX_CASE_TABS} case tabs reached` : "New Case Tab";
  }
}

async function switchToCaseTab(tabId) {
  if (!isEbgAgent()) return; // defensive: tab bar is hidden for non-EBG anyway
  if (!tabId || tabId === activeTabId) return;
  const target = caseTabs.find(t => t.id === tabId);
  if (!target) return;

  captureActiveTabFieldsFromDom(); // preserve whatever's on screen into the tab we're leaving
  activeTabId = tabId;
  await applyTabFieldsToDom(target);
  renderCaseTabsBar();
  saveData(true);
}

async function addNewCaseTab() {
  if (!isEbgAgent()) {
    showToast("Multiple case tabs are only available for EBG accounts.", true);
    return;
  }
  if (caseTabs.length >= MAX_CASE_TABS) {
    showToast(`Maximum of ${MAX_CASE_TABS} case tabs reached. Close one to open another.`, true);
    return;
  }
  captureActiveTabFieldsFromDom();

  const newTab = createBlankCaseTab();
  caseTabs.push(newTab);
  activeTabId = newTab.id;

  await applyTabFieldsToDom(newTab);
  if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC to view matrix playbook options...";
  const spielPanel = $('playbookSpielContainer');
  if (spielPanel) {
    spielPanel.innerHTML = `
      <div style="padding: 12px; color: var(--text-muted); font-style: italic; font-size: 13px; text-align: center; border: 1px dashed var(--border-color); border-radius: 4px;">
        The corresponding email spiel template will load automatically upon context verification.
      </div>`;
  }

  renderCaseTabsBar();
  await saveData(true);
  showToast("New case tab opened.");
}

function closeCaseTab(tabId) {
  if (!isEbgAgent()) return; // defensive: close buttons aren't rendered for non-EBG anyway
  const tab = caseTabs.find(t => t.id === tabId);
  if (!tab) return;

  // If we're closing the currently active tab, make sure we're checking against its freshest values
  if (tabId === activeTabId) captureActiveTabFieldsFromDom();

  const proceedClose = async () => {
    const closingIndex = caseTabs.findIndex(t => t.id === tabId);
    caseTabs = caseTabs.filter(t => t.id !== tabId);

    if (caseTabs.length === 0) {
      caseTabs.push(createBlankCaseTab());
    }

    if (tabId === activeTabId) {
      const fallbackIndex = Math.max(0, closingIndex - 1);
      const fallbackTab = caseTabs[fallbackIndex] || caseTabs[0];
      activeTabId = fallbackTab.id;
      await applyTabFieldsToDom(fallbackTab);
    }

    renderCaseTabsBar();
    await saveData(true);
    showToast("Case tab closed.");
  };

  if (isTabDirty(tab)) {
    showSystemAlert(
      "Unsaved Case Data",
      "This tab still has entries in it. Closing it will remove this tab (your synced shift history is unaffected). Continue?",
      true
    );
    const closeBtn = $('alertModalCloseBtn');
    if (closeBtn) {
      const confirmHandler = () => {
        proceedClose();
        closeBtn.textContent = "Acknowledge & Dismiss";
        closeBtn.removeEventListener('click', confirmHandler);
      };
      closeBtn.textContent = "Confirm Close Tab";
      closeBtn.addEventListener('click', confirmHandler);
    }
  } else {
    proceedClose();
  }
}

// 🖐️ DRAG-TO-REORDER: moves a tab to sit before or after a drop target.
// e.g. dragging Tab 5 and dropping it on Tab 1 (before) gives 5,1,2,3,4.
let draggedTabId = null;

function reorderCaseTabs(draggedId, targetId, dropBefore) {
  if (!isEbgAgent()) return;
  if (!draggedId || !targetId || draggedId === targetId) return;

  captureActiveTabFieldsFromDom(); // preserve any live edits before we shuffle the array

  const fromIndex = caseTabs.findIndex(t => t.id === draggedId);
  if (fromIndex === -1) return;

  const [movedTab] = caseTabs.splice(fromIndex, 1);

  const targetIndex = caseTabs.findIndex(t => t.id === targetId);
  if (targetIndex === -1) {
    caseTabs.push(movedTab); // safety fallback, shouldn't normally happen
  } else {
    const insertIndex = dropBefore ? targetIndex : targetIndex + 1;
    caseTabs.splice(insertIndex, 0, movedTab);
  }

  renderCaseTabsBar();
  saveData(true);
  showToast("Case tab order updated.");
}


/* ==========================================================================
   ☁️ SECURE CLOUD DRAFT WORKSPACE MATRIX (ROAMING PROFILE ENGINE)
   ⚠️ SUPERSEDED: This single-slot draft mechanism has been replaced by the
   multi-case tab engine above, which now owns cloud persistence for case/min/
   concernType/voc (and every other field) per-tab. The functions are left
   here in case anything external still references them, but they are no
   longer called anywhere in this file to avoid racing with tab restoration.
   ========================================================================== */

// 📤 WRITE PIPELINE: Uploads draft states to Firestore securely
async function saveAgentDraftToCloud() {
  const agentId = typeof currentAgentId !== 'undefined' ? currentAgentId : localStorage.getItem("active_agent_session_id");
  if (!agentId || agentId === "SUPERVISOR") return;

  try {
    const draftRef = doc(firestoreDb, "agent_drafts", agentId);
    await setDoc(draftRef, {
      case: $("case")?.value.trim() || "",
      min: $("min")?.value.trim() || "",
      concernType: $("concernType")?.value || "",
      voc: $("voc")?.value || "",
      lastSaved: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error("☁️ Cloud draft matrix synchronizer write error:", err);
  }
}

// 📥 READ PIPELINE: Restores draft states from Firestore securely
async function triggerCloudDraftRecovery(agentId) {
  if (!agentId || agentId === "SUPERVISOR") return;
  console.log(`📡 Recovering cloud desk layouts for agent: ${agentId}`);

  try {
    const draftRef = doc(firestoreDb, "agent_drafts", agentId);
    const snap = await getDoc(draftRef);

    if (snap.exists()) {
      const data = snap.data();

      // 1. Restore plain text variables immediately
      if (data.case && $("case")) $("case").value = data.case;
      if (data.min && $("min")) $("min").value = data.min;

      // 2. Cascade drop-down values sequentially
      if (data.concernType && $("concernType")) {
        $("concernType").value = data.concernType;
        $("concernType").dispatchEvent(new Event('change'));

        // Give the sub-VOC array a solid 400ms buffer to build its menu items over the network
        setTimeout(async () => {
          if (data.voc && $("voc")) {
            $("voc").value = data.voc;
            $("voc").dispatchEvent(new Event('change'));

            if (typeof updateSuggestions === 'function') {
              await updateSuggestions();
            }
          }
        }, 400); 
      }
    }
  } catch (err) {
    console.error("🚨 Cloud recovery extraction failure:", err);
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
    captureActiveTabFieldsFromDom();

    const caseNum = $("case")?.value.trim() || "DRAFT";

    try {
      const docRef = doc(firestoreDb, scopedCollectionName("case_logs"), currentAgentId);
      await setDoc(docRef, {
        agent_id: currentAgentId,
        case_number: caseNum,
        tabs: caseTabs,
        active_tab_id: activeTabId,
        shift_manifest: globalShiftHistory,
        updated_at: Date.now()
      }, { merge: true });
      updateSyncStatusUI('online');
      renderCaseTabsBar();
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
    const docRef = doc(firestoreDb, scopedCollectionName("case_logs"), currentAgentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const docData = docSnap.data();
      globalShiftHistory = docData.shift_manifest || [];

      const cloudTabs = Array.isArray(docData.tabs) ? docData.tabs : [];

      if (cloudTabs.length > 0) {
        // Normalize so every tab has every expected field key, even if the
        // cloud record predates a field being added.
        caseTabs = cloudTabs.map(t => {
          const fields = {};
          CASE_TAB_FIELD_IDS.forEach(id => { fields[id] = (t.fields && t.fields[id]) || ""; });
          return { id: t.id || createBlankCaseTab().id, fields };
        }).slice(0, MAX_CASE_TABS);

        activeTabId = (docData.active_tab_id && caseTabs.some(t => t.id === docData.active_tab_id))
          ? docData.active_tab_id
          : caseTabs[0].id;
      } else if (docData.form_data && Object.keys(docData.form_data).length > 0) {
        // 🎯 ONE-TIME MIGRATION: legacy single-form accounts fold into Tab 1
        // instead of losing whatever they had in progress.
        const legacyTab = createBlankCaseTab();
        CASE_TAB_FIELD_IDS.forEach(id => {
          legacyTab.fields[id] = docData.form_data[id] || "";
        });
        caseTabs = [legacyTab];
        activeTabId = legacyTab.id;
      } else {
        caseTabs = [createBlankCaseTab()];
        activeTabId = caseTabs[0].id;
      }

      // 🔐 LOB GATE: ES (or any non-EBG) accounts only ever work their first
      // tab. Extra tabs stay untouched in `caseTabs` in memory — and get
      // written straight back to Firestore unchanged on the next save — so
      // nothing is lost if the account is later reassigned to EBG.
      if (!isEbgAgent()) {
        activeTabId = caseTabs[0].id;
      }

      const activeTab = caseTabs.find(t => t.id === activeTabId) || caseTabs[0];
      await applyTabFieldsToDom(activeTab);
      renderCaseTabsBar();

      showToast(isEbgAgent()
        ? `Workspace synced live from cloud. ${caseTabs.length} case tab(s) restored.`
        : `Workspace synced live from cloud.`);
    } else {
      caseTabs = [createBlankCaseTab()];
      activeTabId = caseTabs[0].id;
      renderCaseTabsBar();
    }
    
    await renderHistoryView();
    updateFloatingBanner();
  } catch (e) {
    console.error("Critical Cloud Fetch Failure:", e);
    updateSyncStatusUI('error');
  }
}

// 🚀 DEPLOY LIVE BROADCAST TO ALL AGENT TERMINALS (UPDATED TO MATCH SYSTEM_MANAGEMENT)
async function executeLiveBroadcastPublish() {
  const message = $('broadcastTextInput').value.trim();
  // Note: Your current agent banner doesn't handle severity background shifts yet,
  // but we pass it anyway in case you want to style it later!
  const severity = $('broadcastSeveritySelect').value; 

  if (!message) {
    showSystemAlert("Empty Message", "Please input text content before initiating a live system broadcast.");
    return;
  }

  try {
    // 🎯 TARGET MATCHED: Writing directly to the document your agents are streaming!
    const broadcastRef = doc(firestoreDb, "system_management", "broadcast_alerts");
    await setDoc(broadcastRef, {
      message: message,
      active: true, // 🎯 FIELD MATCHED: Sets data.active to true
      severity: severity,
      broadcasted_by: currentAgentName || "Operations Supervisor",
      updated_at: Date.now()
    }, { merge: true }); // Merge ensures we don't accidentally blow away other hidden system settings

    showToast("Live operational broadcast deployed successfully!");
  } catch (error) {
    console.error("Broadcast deployment error:", error);
    showSystemAlert("Database Sync Failure", "Failed to push announcement payload to agents.");
  }
}

// 🧼 WIPE THE ACTIVE BROADCAST FROM ALL AGENT SCREENS INSTANTLY
async function executeClearActiveBroadcast() {
  try {
    // 🎯 TARGET MATCHED: Tells the agent listener to shut down the display toggle
    const broadcastRef = doc(firestoreDb, "system_management", "broadcast_alerts");
    await setDoc(broadcastRef, {
      message: "",
      active: false, // 🎯 FIELD MATCHED: Triggers the else clause to hide banner
      updated_at: Date.now()
    }, { merge: true });

    $('broadcastTextInput').value = "";
    showToast("Active system broadcast terminated.");
  } catch (error) {
    console.error("Broadcast termination error:", error);
    showSystemAlert("Database Sync Failure", "Failed to clear the active broadcast banner.");
  }
}

/* ==========================================================================
   ANALYTICS & OPERATIONAL METRICS COMPILATION ROUTINES
   ========================================================================== */
async function logCaseSubmissionToAnalytics(caseNumber) {
  if (!currentAgentId || currentAgentId === "SUPERVISOR") return;

  const dateString = getSystemDateString();
  const metricDocId = `${currentAgentId}-${Date.now()}`;
  const metricRef = doc(firestoreDb, scopedCollectionName("cases_performance_metrics"), metricDocId);

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
    const docRef = doc(firestoreDb, scopedCollectionName("case_logs"), currentAgentId);
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
    const docRef = doc(firestoreDb, scopedCollectionName("case_logs"), currentAgentId);
    await updateDoc(docRef, { shift_manifest: globalShiftHistory });
    showToast("Selected log deleted from your cloud history container.");
  } catch(err) {
    console.error(err);
  }

  await renderHistoryView();
  updateFloatingBanner();
}

/* ==========================================================================
   UPGRADED CORE RENDERING ROUTINE (GLOBAL ARCHIVE SEARCH & LIGHT-MODE VISIBILITY)
   ========================================================================== */
async function renderHistoryView(searchQuery = "") {
  const container = $('historyContainer');
  if (!container) return;

  if ((!globalShiftHistory || globalShiftHistory.length === 0) && localStorage.getItem('shift_history_cache_key')) {
    globalShiftHistory = JSON.parse(localStorage.getItem('shift_history_cache_key'));
  }

  let visibleRecords = [...globalShiftHistory];

  // 🔍 Layer 1: Live Search Text Matcher (GLOBAL SCOPE BYPASS)
  if (searchQuery !== "") {
    // If user is searching, filter the entire history array completely ignoring date limitations
    visibleRecords = visibleRecords.filter(item => {
      const caseIdMatch = item.id && item.id.toLowerCase().includes(searchQuery);
      const contentMatch = item.text && item.text.toLowerCase().includes(searchQuery);
      return caseIdMatch || contentMatch;
    });
  } else {
    // 📁 Layer 2: Standard Date Bucket Sorting (Only active when NOT searching)
    if (activeFolderFilterBucket) {
      visibleRecords = visibleRecords.filter(item => item.savedDateStamp === activeFolderFilterBucket);
    } else {
      const currentNormalizedKey = getNormalizedSystemDateString();
      visibleRecords = visibleRecords.filter(item => !item.savedDateStamp || item.savedDateStamp === currentNormalizedKey);
    }
  }

  if (visibleRecords.length === 0) {
    container.innerHTML = `<i style="color: var(--text-muted); font-size: 11px; display: block; padding: 12px; text-align: center;">No shift manifest items match current criteria...</i>`;
    return;
  }

  container.innerHTML = visibleRecords.map((item) => {
    const trueIndexInGlobal = globalShiftHistory.findIndex(g => g.text === item.text && g.id === item.id);
    
    return `
      <div style="background: rgba(255,255,255,0.03); padding: 8px 10px; margin-bottom: 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
        <span style="font-size: 12px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 65%;">
          <span style="color: #60a5fa; font-family: monospace; margin-right: 4px;">[${item.time || '00:00'}]</span> 
          <a href="javascript:void(0)" onclick="window.spawnPictureInPictureNotes(${trueIndexInGlobal})" title="Click to view notes in floating PiP HUD" style="color: var(--text-main, currentColor); text-decoration: none; font-weight: bold; border-bottom: 1px dashed var(--text-muted, rgba(128,128,128,0.5)); padding-bottom: 1px; cursor: pointer; transition: color 0.15s, border-color 0.15s;" onmouseover="this.style.color='#60a5fa'; this.style.borderColor='#60a5fa';" onmouseout="this.style.color='var(--text-main, currentColor)'; this.style.borderColor='var(--text-muted, rgba(128,128,128,0.5))';">
            ID: ${item.id || 'N/A'}
          </a>
        </span>
        <div style="display: flex; gap: 4px;">
          <button type="button" data-action="recopy" data-index="${trueIndexInGlobal}" style="background: transparent; color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); padding: 2px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">
            Recopy
          </button>
          <button type="button" data-action="delete" data-index="${trueIndexInGlobal}" style="background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer;">
            <i class="fas fa-trash-alt" style="pointer-events: none;"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
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

/* ==========================================================================
   📏 DENSITY TOGGLE (Compact / Comfortable)
   ========================================================================== */
const DENSITY_KEY = "auto_docs_density";

function applyDensityMode(isCompact) {
  document.body.classList.toggle("density-compact", isCompact);
  const btn = document.getElementById('densityToggleBtn');
  if (btn) {
    btn.title = isCompact ? "Switch to Comfortable Layout" : "Switch to Compact Layout";
  }
}

function toggleDensityMode() {
  const isCompact = !document.body.classList.contains("density-compact");
  applyDensityMode(isCompact);
  localStorage.setItem(DENSITY_KEY, isCompact ? "compact" : "comfortable");
}

function updateThemeIcon(isDark) {
  const icon = document.querySelector("#themeToggle i");
  if (!icon) return;
  
  // 🌓 Corrected Visual Mapping: 
  // Show Moon in dark mode, Sun in light mode
  icon.className = isDark ? "fas fa-moon" : "fas fa-sun";

  // 🎯 THE ADAPTIVE LINK: Toggle the 'light-mode' class directly on the body 
  // so the CSS buttons can instantly switch their colors without refreshing!
  if (isDark) {
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
  }
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
      const docRef = doc(firestoreDb, scopedCollectionName("case_logs"), currentAgentId);
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
function showVocInjectionSuccess(vocName, concernType) {
  let card = document.getElementById('vocSuccessCardInstance');

  if (!card) {
    card = document.createElement('div');
    card.id = 'vocSuccessCardInstance';
    card.className = 'voc-success-card';
    card.innerHTML = `
      <div class="voc-success-icon"><i class="fas fa-check"></i></div>
      <div class="voc-success-body">
        <div class="voc-success-title">Playbook Published</div>
        <div class="voc-success-detail" id="vocSuccessDetailText"></div>
      </div>
      <button type="button" class="voc-success-close" aria-label="Dismiss">&times;</button>
    `;
    document.body.appendChild(card);

    card.querySelector('.voc-success-close').addEventListener('click', () => {
      card.classList.remove('show');
    });
  }

  const detailEl = document.getElementById('vocSuccessDetailText');
  if (detailEl) {
    detailEl.innerHTML = `<strong>${vocName}</strong> added to ${concernType}`;
  }

  // Restart animation cleanly if triggered again while visible
  card.classList.remove('show');
  void card.offsetWidth; // force reflow so the animation replays
  card.classList.add('show');

  clearTimeout(card._autoHideTimer);
  card._autoHideTimer = setTimeout(() => {
    card.classList.remove('show');
  }, 3500);
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
    
    // 📂 1. Push record into your default history stack array
    if (typeof pushToHistory === "function") {
      pushToHistory(caseNum, outputText);
    }
    
    // 🎯 2. Read your actual checkbox node identifier
    const trackCheckbox = document.getElementById('enableCaseTrackingCheck');
    const isTrackingAuthorized = trackCheckbox ? trackCheckbox.checked : false;

    // ⚡ 3. ONLY fire priority tracking if the agent explicitly authorized it!
    if (isTrackingAuthorized) {
      interceptAndRegisterCaseTracking(caseNum, outputText, true);
      
      // 🛰️ 4. Force global badge metrics to refresh on screen immediately
      if (typeof window.refreshGlobalBadgeCounters === "function") {
        window.refreshGlobalBadgeCounters();
      }
    } else {
      // If checkbox is unchecked, just save the standard shift history change globally
      if (typeof dispatchWorkbenchPayloadToCloud === "function") {
        dispatchWorkbenchPayloadToCloud();
      }
    }
    
  }).catch(err => {
    console.error("Clipboard routing restriction:", err);
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

/* ==========================================================================
   📊 INTENT DISTRIBUTION MATRIX (Excel .xlsx export, date + LOB filtered)
   ========================================================================== */
async function extractIntentDistributionMatrix(selectedLobFilter, startDateFilter, endDateFilter) {
  if (typeof XLSX === "undefined") {
    showSystemAlert("Missing Library", "The Excel export library (SheetJS) failed to load. Check your internet connection and reload the page.");
    return;
  }

  showToast(`Compiling intent distribution for ${selectedLobFilter} (${startDateFilter} → ${endDateFilter})...`);

  try {
    const performanceRef = collection(firestoreDb, "cases_performance_metrics");
    const q = query(
      performanceRef,
      where("submission_date", ">=", startDateFilter),
      where("submission_date", "<=", endDateFilter)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showSystemAlert("Data Void", "No case records match this date range query.");
      return;
    }

    const intentCounts = {};
    let totalMatched = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const agentLob = data.lob || "UNKNOWN";
      if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

      const rawVoc = (data.snapshot && data.snapshot.voc) ? data.snapshot.voc.trim() : "";
      const cleanVoc = rawVoc.toUpperCase();
      if (!cleanVoc || cleanVoc === "SELECT VOC" || cleanVoc === "UNDEFINED") return;

      intentCounts[cleanVoc] = (intentCounts[cleanVoc] || 0) + 1;
      totalMatched++;
    });

    if (totalMatched === 0) {
      showSystemAlert("Zero Results", `No VOC-tagged records matched the ${selectedLobFilter} filter within this date range.`);
      return;
    }

    const rows = Object.keys(intentCounts)
      .map(voc => ({
        "Intent / VOC": voc,
        "Volume": intentCounts[voc],
        "% of Total": totalMatched > 0 ? `${((intentCounts[voc] / totalMatched) * 100).toFixed(2)}%` : "0%"
      }))
      .sort((a, b) => b.Volume - a.Volume);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 42 }, { wch: 10 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Intent Distribution");

    const filename = `Intent_Distribution_${selectedLobFilter}_${startDateFilter}_to_${endDateFilter}.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast(`Intent Distribution Matrix exported: ${rows.length} unique VOC(s), ${totalMatched} total case(s).`);
  } catch (error) {
    console.error("Intent distribution extraction failure:", error);
    showSystemAlert("Extraction Error", `Pipeline processing broke: ${error.message}`);
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

    // 📊 INTENT DISTRIBUTION MATRIX: separate pipeline — sourced from
    // cases_performance_metrics (has clean per-record submission_date, lob,
    // and VOC fields already), output as a real .xlsx via SheetJS instead of
    // the CSV pipeline the other two report types use below.
    if (reportType === "INTENT") {
      await extractIntentDistributionMatrix(selectedLobFilter, startDateFilter, endDateFilter);
      return;
    }

    showToast(`Deep Scanning metrics partition query range...`);

    let csvContent = "";
    let recordsCount = 0;
    const trackedCaseIds = new Set(); // Prevents record duplication during extraction merge

    const cleanValue = (val) => {
      if (val === undefined || val === null || val === "") return "";
      let str = val.toString().replace(/[\n\r\t]/g, " ").trim();
      if (str.includes(",") || str.includes('"')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    if (reportType === "CASES") {
      // Establish CSV Layout Headers
      csvContent += "Data Source,Agent ID,Agent Name,Line of Business,Case/SR,Completed Timestamp,Action Taken,WOCAS Notes,Thread ID,Customer Name,Concern Type,MIN / Mobile,Company,Email Address,Subject,VOC Selection\n";

      // Create timestamps from text filters to ensure fallback queries match
      const startDateTime = new Date(new Date(startDateFilter).setHours(0,0,0,0));
      const endDateTime = new Date(new Date(endDateFilter).setHours(23,59,59,999));

// 📡 PATH A: Query Historical Logs
      const performanceRef = collection(firestoreDb, "cases_performance_metrics");
      const q1 = query(
        performanceRef, 
        where("submission_date", ">=", startDateFilter), 
        where("submission_date", "<=", endDateFilter)
      );

      // 📡 PATH B: Query Real-time Case Tracker Logs simultaneously
      const liveTrackerRef = collection(firestoreDb, "case_logs");
      
      // 🎯 FIXED: Re-assigning variables instead of re-declaring them with 'const'
      startDateTime = new Date(new Date(startDateFilter).setHours(0,0,0,0));
      endDateTime = new Date(new Date(endDateFilter).setHours(23,59,59,999));

      // Query B1: Assumes date fields are native Firebase Timestamp/Date objects
      const q2Timestamp = query(
        liveTrackerRef,
        where("timestamp", ">=", startDateTime),
        where("timestamp", "<=", endDateTime)
      );

      // Query B2: Assumes date fields are plain text strings (e.g., "2026-07-01")
      const q2StringDate = query(
        liveTrackerRef,
        where("submission_date", ">=", startDateFilter),
        where("submission_date", "<=", endDateFilter)
      );

      // Execute all three extraction loops concurrently to maximize network performance
      const [performanceSnapshot, liveTimeSnapshot, liveStrSnapshot] = await Promise.all([
        getDocs(q1).catch(err => { console.error("Metrics snapshot failure:", err); return { empty: true }; }),
        getDocs(q2Timestamp).catch(err => { console.error("Live timestamp snapshot failure:", err); return { empty: true }; }),
        getDocs(q2StringDate).catch(err => { console.error("Live string date snapshot failure:", err); return { empty: true }; })
      ]);

      // 🗃️ PARSE PERFORMANCE DATASET
      if (!performanceSnapshot.empty) {
        performanceSnapshot.forEach((docSnap) => {
          const rawDoc = docSnap.data();
          const agentLob = rawDoc.lob || "UNKNOWN";
          if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

          const snap = rawDoc.snapshot || rawDoc.form_data || rawDoc || {};
          const caseNum = rawDoc.case_id || snap.case || snap.field_case || docSnap.id;
          
          trackedCaseIds.add(caseNum);

          csvContent += [
            "Historical Log", cleanValue(rawDoc.agent_id), cleanValue(rawDoc.agent_name || "No Log"), cleanValue(agentLob),
            cleanValue(caseNum), cleanValue(rawDoc.completed_at || rawDoc.updated_at || startDateFilter),
            cleanValue(snap.action       || snap.field_action       || "N/A"),
            cleanValue(snap.wocas        || snap.field_wocas        || "N/A"),
            cleanValue(snap.thread       || snap.field_thread       || "N/A"),
            cleanValue(snap.name         || snap.field_name         || "N/A"),
            cleanValue(snap.concernType  || snap.field_concernType  || "N/A"),
            cleanValue(snap.min          || snap.field_min          || "N/A"),
            cleanValue(snap.company      || snap.field_company      || "N/A"),
            cleanValue(snap.email        || snap.field_email        || "N/A"),
            cleanValue(snap.subj         || snap.field_subj         || "N/A"),
            cleanValue(snap.voc          || snap.field_voc          || "N/A")
          ].join(",") + "\n";
          recordsCount++;
        });
      }

      // 🗃️ COMBINE & PARSE DUAL-SCHEMA LIVE TRACKER RESULTS
      let combinedLiveDocs = [];
      if (!liveTimeSnapshot.empty) liveTimeSnapshot.forEach(doc => combinedLiveDocs.push(doc));
      if (!liveStrSnapshot.empty) liveStrSnapshot.forEach(doc => combinedLiveDocs.push(doc));

// 🗃️ PARSE LIVE FLOOR TRACKER DATASET (Merge & Array De-duplicate records)
      if (combinedLiveDocs.length > 0) {
        combinedLiveDocs.forEach((docSnap) => {
          const d = docSnap.data();
          
          // Locate case array matrix inside document
          const targetArrayKey = Object.keys(d).find(key => Array.isArray(d[key]));
          if (!targetArrayKey) return;

          const caseArray = d[targetArrayKey];
          const agentLob = d.lob || "UNKNOWN";

          if (selectedLobFilter !== "ALL" && agentLob !== selectedLobFilter) return;

          caseArray.forEach((caseItem) => {
            const caseNum = caseItem.id || docSnap.id;
            
            // Guard conditions for duplicates
            if (trackedCaseIds.has(caseNum)) return; 
            trackedCaseIds.add(caseNum);

            const rawTextString = caseItem.text || "";
            
            // Run Regex lookbehinds to map out text fields cleanly into separate columns
            const concernMatch = rawTextString.match(/CONCERN TYPE:\s*(.*?)\s*VOC:/i);
            const vocMatch     = rawTextString.match(/VOC:\s*(.*?)\s*(?:SUBJ:|DATE\/TIME:)/i);
            const subjMatch    = rawTextString.match(/SUBJ:\s*(.*?)\s*NAME:/i);
            const nameMatch    = rawTextString.match(/NAME:\s*(.*?)\s*MIN:/i);
            const minMatch     = rawTextString.match(/MIN:\s*(.*?)\s*COMPANY:/i);

            const extractedConcern = concernMatch ? concernMatch[1].trim() : "N/A";
            const extractedVoc     = vocMatch ? vocMatch[1].trim() : "N/A";
            const extractedSubj    = subjMatch ? subjMatch[1].trim() : "N/A";
            const extractedName    = nameMatch ? nameMatch[1].trim() : "N/A";
            const extractedMin     = minMatch ? minMatch[1].trim() : "N/A";

            let formattedDate = startDateFilter;
            if (d.updated_at) {
              try { formattedDate = new Date(Number(d.updated_at)).toISOString().split('T')[0]; } catch(e){}
            }

            // Write row directly out to the data spreadsheet format content string
            csvContent += [
              "Live Tracker Draft", cleanValue(d.agent_id), cleanValue(d.agent_name || "Active Agent"), cleanValue(agentLob),
              cleanValue(caseNum), cleanValue(formattedDate),
              cleanValue(extractedConcern), // Action/Concern Column
              cleanValue(extractedVoc),     // Specific Tracker VOC Category
              cleanValue("N/A"),            // Thread
              cleanValue(extractedName),    // Customer Name
              cleanValue(extractedVoc),     // Concern Type Match
              cleanValue(extractedMin),     // Mobile/MIN
              cleanValue("N/A"),            // Company
              cleanValue("N/A"),            // Email
              cleanValue(extractedSubj),    // Subject Line
              cleanValue(extractedVoc)      // VOC
            ].join(",") + "\n";
            recordsCount++;
          });
        });
      }

    } else {
      // 🛠️ COMPLIANCE TELEMETRY REPORT TYPE ROUTING ENGINE
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
   AGENTS TERMINATION GATEWAYS & WORKSPACE STATE CLEANERS (STATE-SYNCED)
   ========================================================================== */
function terminateAgentSession() {
  const logoutModal = $('logoutModal');
  const cancelBtn = $('confirmLogoutCancelBtn');
  const confirmBtn = $('confirmLogoutSubmitBtn');

  // 🔒 SECURE SWITCH UPDATED: Use live runtime database flag instead of hardcoded strings
  if (isSupervisorAuthenticated) {
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

  // 🎯 Unlink Quality Score dashboard session too
  qsHidePanel();
  signOut(qualityAuth).catch(() => {});
  
  if (typeof terminateSupervisorSession === "function") {
    terminateSupervisorSession();
  }

  // 🔒 DATABASE SECURITY UPDATED: Ensure exit logs are only sent for real agent IDs
  if (currentAgentId && !isSupervisorAuthenticated) {
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

  // 🎯 NEW SECURITY FIX: Wipe runtime database switches completely
  isSupervisorAuthenticated = false; 
  document.body.classList.remove('role-supervisor');

  // 🎯 PERSISTENT PURGE: Clear disk keys
  localStorage.removeItem("active_agent_session_id");
  localStorage.removeItem("shift_reminder_cleared");
  
  currentAgentId = null;
  currentAgentName = "Unknown Agent";
  currentAgentLob = "UNKNOWN";
  csatShowSubpaneIfEligible();
  trainingModeActive = false;
  window.trainingModeActive = false;

  // 🗂️ Wipe multi-case tab state so the next agent on this station starts clean
  caseTabs = [];
  activeTabId = null;
  if (typeof renderCaseTabsBar === "function") renderCaseTabsBar();
  
  // Reset the permanent Orb back to default ahead of browser reload pass
  const trackingOrbNode = document.getElementById('metaTrackerOrb') || $('metaTrackerOrb');
  if (trackingOrbNode) {
    trackingOrbNode.className = "meta-orb-trigger rgb-mode login-unread";
  }
  
  isolateWorkspaceUI("AGENT"); 
  showLoginGateway(false);
  updateOutput();
  
  if ($("suggestions")) $("suggestions").innerHTML = "Select Concern & VOC";
  const spielPanel = $('playbookSpielContainer');
  if (spielPanel) spielPanel.innerHTML = "";
  
  renderHistoryView();
  showToast("Session closed safely. Workspace locked.");

  window.location.reload();
}

async function resetForm(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  isResetting = true; 

  try {
    // 🎯 SCOPED TO ACTIVE TAB: only clears the case-form fields for the tab
    // currently open, leaving any other open case tabs untouched.
    CASE_TAB_FIELD_IDS.forEach(id => {
      const el = $(id);
      if (el) {
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

    const activeTab = caseTabs.find(t => t.id === activeTabId);
    if (activeTab) {
      CASE_TAB_FIELD_IDS.forEach(id => { activeTab.fields[id] = ""; });
    }
    applyOptionalContactFieldsVisibility(activeTab); // re-collapses Thread Ref/Email for EBG since fields are now empty

    const csatCheckbox = $('enableCsatTrackCheck');
    const csatStatusArea = $('csatStatusArea');
    if (csatCheckbox) csatCheckbox.checked = false;
    if (csatStatusArea) { csatStatusArea.style.display = 'none'; csatStatusArea.innerHTML = ''; }

    // 🔒 CLOUD SYNC UPDATED: Prevent supervisors from overwriting cloud records on reset
    if (currentAgentId && !isSupervisorAuthenticated) {
      const docRef = doc(firestoreDb, scopedCollectionName("case_logs"), currentAgentId);
      await setDoc(docRef, { tabs: caseTabs, active_tab_id: activeTabId }, { merge: true });
    }

    renderCaseTabsBar();
    showToast("Active case tab cleared.");
  } catch(e) {
    console.error("Cloud database reset exception:", e);
    showToast("Error clearing cloud form properties.", true);
  } finally {
    isResetting = false; 
    updateOutput();
  }
}

/* ==========================================================================
   📊 INITIALIZATION ENGINE & LOOPS (WITH DRAFT RECOVERY PROTECTION)
========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  $('authForm')?.addEventListener('submit', handleAuthSubmission);
  $('authToggleAnchor')?.addEventListener('click', toggleAuthMode);
  
  $('logoutBtn')?.addEventListener('click', executeLogOutRoutine);
  $('adminExtractSubmitBtn')?.addEventListener('click', executeSupervisorExtraction);

  $('publishBroadcastBtn')?.addEventListener('click', executeLiveBroadcastPublish);
  $('clearBroadcastBtn')?.addEventListener('click', executeClearActiveBroadcast);
  $('supePublishBtn')?.addEventListener('click', saveMasterPlaybookConfiguration);

  // 🎓 TRAINING MODE MANAGER: lookup + toggle
  $('trainingLookupBtn')?.addEventListener('click', executeTrainingModeLookup);
  $('trainingLookupSaveBtn')?.addEventListener('click', saveTrainingModeToggle);
  $('trainingLookupInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeTrainingModeLookup();
    }
  });

  /* ==========================================================================
     🗂️ MULTI-CASE TAB BAR EVENT WIRING
     ========================================================================== */
  $('caseTabsBar')?.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.case-tab-close');
    if (closeBtn) {
      e.stopPropagation();
      closeCaseTab(closeBtn.getAttribute('data-tab-id'));
      return;
    }
    const tabItem = e.target.closest('.case-tab-item');
    if (tabItem) {
      switchToCaseTab(tabItem.getAttribute('data-tab-id'));
    }
  });
  $('addCaseTabBtn')?.addEventListener('click', addNewCaseTab);

  // 🖐️ DRAG-TO-REORDER: grab a tab and drop it before/after another to reorder.
  $('caseTabsBar')?.addEventListener('dragstart', (e) => {
    const tabItem = e.target.closest('.case-tab-item');
    if (!tabItem) return;
    draggedTabId = tabItem.getAttribute('data-tab-id');
    tabItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTabId);
  });

  $('caseTabsBar')?.addEventListener('dragend', (e) => {
    const tabItem = e.target.closest('.case-tab-item');
    if (tabItem) tabItem.classList.remove('dragging');
    document.querySelectorAll('.case-tab-item.drag-over-before, .case-tab-item.drag-over-after').forEach(el => {
      el.classList.remove('drag-over-before', 'drag-over-after');
    });
    draggedTabId = null;
  });

  $('caseTabsBar')?.addEventListener('dragover', (e) => {
    const tabItem = e.target.closest('.case-tab-item');
    if (!tabItem || !draggedTabId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    document.querySelectorAll('.case-tab-item.drag-over-before, .case-tab-item.drag-over-after').forEach(el => {
      if (el !== tabItem) el.classList.remove('drag-over-before', 'drag-over-after');
    });

    const rect = tabItem.getBoundingClientRect();
    const isBefore = (e.clientX - rect.left) < rect.width / 2;
    tabItem.classList.toggle('drag-over-before', isBefore);
    tabItem.classList.toggle('drag-over-after', !isBefore);
  });

  $('caseTabsBar')?.addEventListener('drop', (e) => {
    const tabItem = e.target.closest('.case-tab-item');
    if (!tabItem || !draggedTabId) return;
    e.preventDefault();

    const targetTabId = tabItem.getAttribute('data-tab-id');
    const rect = tabItem.getBoundingClientRect();
    const dropBefore = (e.clientX - rect.left) < rect.width / 2;

    reorderCaseTabs(draggedTabId, targetTabId, dropBefore);

    document.querySelectorAll('.case-tab-item.drag-over-before, .case-tab-item.drag-over-after').forEach(el => {
      el.classList.remove('drag-over-before', 'drag-over-after');
    });
  });

  // 🔐 EBG-only: manual expand/collapse for the Thread Ref / Email section
  $('toggleOptionalContactBtn')?.addEventListener('click', () => {
    const wrapper = $('optionalContactFieldsWrapper');
    const btn = $('toggleOptionalContactBtn');
    if (!wrapper || !btn) return;
    const isCollapsed = wrapper.classList.toggle('optional-collapsed');
    btn.innerHTML = isCollapsed
      ? '<i class="fas fa-plus"></i> Add Thread Ref / Email (optional)'
      : '<i class="fas fa-minus"></i> Hide Thread Ref / Email';
  });

  // 🛡️ REMAPPED & SECURED: Telemetry Portal Gate (Targeting Your New HTML ID)
  const openTelemetryBtn = document.getElementById('openTelemetryBtn');
  if (openTelemetryBtn) {
    openTelemetryBtn.addEventListener('click', (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      console.log("Telemetry Extraction Event Triggered via ID Selector.");

      const loginModal = document.getElementById('authModal') || $('authModal');
      const telemetryContainer = document.getElementById("supervisorAdminPanel") || $('supervisorAdminPanel');
      
      // 🔍 MULTI-LAYERED GATE CHECK: Validates live states and session strings
      const isSupervisor = (isSupervisorAuthenticated === true) || 
                           (currentAgentId === "SUPERVISOR") || 
                           (localStorage.getItem('active_agent_session_id') === "SUPERVISOR") ||
                           (document.body.classList.contains('role-supervisor'));

      if (!isSupervisor) {
        console.warn(`Extraction Access Blocked: Session lacks authorization tokens.`);
        if (loginModal) {
          loginModal.style.display = "flex";
          if (typeof loginModal.style.opacity !== 'undefined') loginModal.style.opacity = "1";
        } else {
          alert("Access Denied: Supervisor clearance required.");
        }
      } else {
        // 🎯 THE ENGINE FORCE-PASS: Bypasses all layout bottlenecks instantly
        if (telemetryContainer) {
          telemetryContainer.style.setProperty("display", "flex", "important");
          telemetryContainer.style.setProperty("visibility", "visible", "important");
          telemetryContainer.style.setProperty("opacity", "1", "important");
          telemetryContainer.style.setProperty("height", "auto", "important");
          
          console.log(`Access Granted: Extraction panel rendered safely for admin.`);
          positionTelemetryPanel(telemetryContainer);
        } else {
          console.error("FATAL UI ERROR: Target element '#supervisorAdminPanel' missing from DOM tree.");
          alert("System Layout Error: The extraction container element (#supervisorAdminPanel) was not found.");
        }
      }
    });
  } else {
    console.error("Initialization Failure: '#openTelemetryBtn' could not be found in layout.");
  }

  $('closeTelemetryBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const telemetryContainer = document.getElementById("supervisorAdminPanel") || $('supervisorAdminPanel');
    if (telemetryContainer) {
      telemetryContainer.style.display = "none";
      telemetryContainer.style.visibility = "hidden";
      telemetryContainer.style.opacity = "0";
    }
  });

  // 🎯 THE LIVE TOGGLE COUPLING: Connect the checkbox to the dropdown container
  const trackingCheckbox = document.getElementById('enableCaseTrackingCheck');
  const dropdownFieldsContainer = document.getElementById('trackingDropdownFields');

  if (trackingCheckbox && dropdownFieldsContainer) {
    // 1. Check initial state on page boot (in case browser caches form state)
    dropdownFieldsContainer.style.display = trackingCheckbox.checked ? 'grid' : 'none';

    // 2. Listen for clicks to open or close the selector deck in real-time
    trackingCheckbox.addEventListener('change', () => {
      if (trackingCheckbox.checked) {
        dropdownFieldsContainer.style.display = 'grid'; // Instantly slide into view!
      } else {
        dropdownFieldsContainer.style.display = 'none'; // Clear from view
      }
    });
  }

  // 🎯 CSAT SURVEY COOLDOWN TRACKER
  const csatCheckbox = document.getElementById('enableCsatTrackCheck');
  const csatStatusArea = document.getElementById('csatStatusArea');
  const csatEmailField = document.getElementById('email');
  if (csatCheckbox && csatStatusArea) {
    csatCheckbox.addEventListener('change', () => {
      if (csatCheckbox.checked) {
        csatStatusArea.style.display = 'block';
        csatCheckCooldown();
      } else {
        csatStatusArea.style.display = 'none';
        csatStatusArea.innerHTML = '';
      }
    });
    if (csatEmailField) {
      csatEmailField.addEventListener('input', () => {
        if (csatCheckbox.checked) csatCheckCooldown();
      });
    }
  }
   
// 🌓 THE AUTOMATED THEME CHECK: Did the agent choose dark mode during their last shift?
const savedTheme = localStorage.getItem(THEME_KEY) || localStorage.getItem("theme"); 
if (savedTheme === "dark") {
  toggleTheme();
}

// 📏 RESTORE DENSITY PREFERENCE
const savedDensity = localStorage.getItem(DENSITY_KEY);
applyDensityMode(savedDensity === "compact");

  // 📁 Force Sync History State Array Cache
  if (localStorage.getItem('shift_history_cache_key')) {
     globalShiftHistory = JSON.parse(localStorage.getItem('shift_history_cache_key'));
  }

  // ⏱️ Force Sync Running Timer Drawer Queue Cache
  if (localStorage.getItem('workbench_queue_cache')) {
     activeUrgentQueueItems = JSON.parse(localStorage.getItem('workbench_queue_cache'));
     if (activeUrgentQueueItems.length > 0) {
        runActiveQueueCountdownEngine();
     }
  }

  // Paint UI folder layouts
  if (typeof renderChronologicalArchiveGrid === 'function') {
    renderChronologicalArchiveGrid();
  }
}); // 🌟 FIX: Safely closes out your DOMContentLoaded wrapper block

// ==========================================================================
// 🛡️ UNIFIED BLUEPRINT ENGINE: MORNING BRIEFING & PULSING ORB LAYER
// ==========================================================================
const shiftCheckInOrb = document.getElementById('metaTrackerOrb') || $('metaTrackerOrb');
const glassmorphicReminderModal = document.getElementById('loginReminderScreen');
const metaTrackerDrawerSubPane = document.getElementById('metaTrackerDrawer');
const closeMetaDrawerHeaderBtn = document.getElementById('closeMetaDrawerBtn');

function setOrbVisibility(isVisible) {
  if (!shiftCheckInOrb) return;
  if (isVisible) {
    shiftCheckInOrb.style.display = "flex";
    setTimeout(() => {
      shiftCheckInOrb.style.opacity = "1";
      shiftCheckInOrb.style.transform = "scale(1)";
    }, 20);
  } else {
    shiftCheckInOrb.style.opacity = "0";
    shiftCheckInOrb.style.transform = "scale(0.8)";
    setTimeout(() => {
      shiftCheckInOrb.style.display = "none";
    }, 200);
  }
}

if (shiftCheckInOrb) {
  shiftCheckInOrb.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  
  const orbIcon = shiftCheckInOrb.querySelector('i');
  if (orbIcon) {
    orbIcon.className = "fas fa-folder-open meta-orb-icon";
  }
  
  shiftCheckInOrb.className = "meta-orb-trigger rgb-mode login-unread";

  shiftCheckInOrb.addEventListener('click', (e) => {
    e.stopPropagation();
    if (metaTrackerDrawerSubPane) {
      const isOpen = metaTrackerDrawerSubPane.classList.toggle('drawer-open');
      if (isOpen) {
        shiftCheckInOrb.className = "meta-orb-trigger rgb-mode drawer-active-state"; 
      } else {
        shiftCheckInOrb.className = "meta-orb-trigger all-clear";
      }
    }
  });
}

if (closeMetaDrawerHeaderBtn) {
  closeMetaDrawerHeaderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (metaTrackerDrawerSubPane) {
      metaTrackerDrawerSubPane.classList.remove('drawer-open');
      if (shiftCheckInOrb) {
        shiftCheckInOrb.className = "meta-orb-trigger rgb-mode all-clear";
      }
    }
  });
}

if (glassmorphicReminderModal) {
  glassmorphicReminderModal.style.display = 'none';
  glassmorphicReminderModal.style.opacity = '0';
}

window.evaluateShiftCheckInModal = function() {
  if (!glassmorphicReminderModal) return;

  // 🎯 The case-tracking orb + shift check-in reminder are agent-only concepts.
  // Never show either for supervisors.
  if (currentAgentId === "SUPERVISOR") {
    glassmorphicReminderModal.style.display = 'none';
    setOrbVisibility(false);
    return;
  }

  if (localStorage.getItem("shift_reminder_cleared")) {
    glassmorphicReminderModal.style.display = 'none';
    setOrbVisibility(true);
    if (shiftCheckInOrb) shiftCheckInOrb.className = "meta-orb-trigger rgb-mode all-clear";
  } else {
    glassmorphicReminderModal.style.display = 'flex';
    setOrbVisibility(true);
    setTimeout(() => {
      glassmorphicReminderModal.style.transition = 'opacity 0.4s ease';
      glassmorphicReminderModal.style.opacity = '1';
    }, 50);
    if (shiftCheckInOrb) shiftCheckInOrb.className = "meta-orb-trigger rgb-mode login-unread";
  }
};

const trackerActionBtn = document.getElementById('dismissReminderBtn');
if (trackerActionBtn) {
  trackerActionBtn.addEventListener('click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    glassmorphicReminderModal.style.transition = 'opacity 0.35s ease';
    glassmorphicReminderModal.style.opacity = '0';
    localStorage.setItem("shift_reminder_cleared", "true");
    setTimeout(() => {
      glassmorphicReminderModal.style.display = 'none';
      if (metaTrackerDrawerSubPane) {
        metaTrackerDrawerSubPane.classList.add('drawer-open');
        if (shiftCheckInOrb) {
          shiftCheckInOrb.className = "meta-orb-trigger rgb-mode drawer-active-state";
        }
      }
    }, 350);
  });
}

// ==========================================================================
// 🎯 CORE CONFIG: Real-time Pressure Form Logic & Pure Regex Log Stripper
// ==========================================================================
const trackingFields = ["case", "subj", "name", "min", "company", "email", "thread", "datetime", "action", "wocas"];
trackingFields.forEach(id => {
  const el = $(id);
  if (!el) return; 
  
  const freshElement = el.cloneNode(true);
  el.parentNode.replaceChild(freshElement, el);

  freshElement.addEventListener("input", (e) => { 
    if (id === "wocas" && document.getElementById('trackerSystemErrorToggle')?.checked) {
      const rawValue = e.target.value;
      const cleanLog = rawValue.replace(/at\s+.*\(?:\d+:\d+\)?/g, '').replace(/[\r\n]+/g, '\n').trim();
      if (rawValue !== cleanLog) {
        e.target.value = cleanLog;
      }
    }
    updateOutput(); 
    updateSuggestions(); 
    saveData(false); 
  });
  
  freshElement.addEventListener("change", () => { updateOutput(); updateSuggestions(); saveData(true); });
  freshElement.addEventListener("blur", () => { saveData(true); });
});

$('historyContainer')?.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  const action = button.getAttribute('data-action');
  const index = parseInt(button.getAttribute('data-index'), 10);
  
  if (action === 'recopy') {
    if (typeof loadHistoryItem === "function") loadHistoryItem(index);
  } else if (action === 'delete') {
    // 1. Run your original deletion routine to clean the UI table array
    if (typeof deleteHistoryItem === "function") deleteHistoryItem(index);
    
    // 🎯 LOCAL MIRROR FIX: Overwrite the hard storage cache instantly with the updated array
    if (typeof globalShiftHistory !== 'undefined') {
      localStorage.setItem('shift_history_cache_key', JSON.stringify(globalShiftHistory));
    }
    
    // 🛰️ CLOUD SYNC PATCH: Force the deletion up to Firestore immediately so roaming stations match
    if (typeof window.saveDataCloudInterface === 'function') {
      window.saveDataCloudInterface();
    } else if (typeof dispatchWorkbenchPayloadToCloud === 'function') {
      dispatchWorkbenchPayloadToCloud();
    }
    
    // 🔄 REPAINT REVOLUTION: Force the horizontal folder grid to update its numbers immediately
    if (typeof renderChronologicalArchiveGrid === 'function') {
      renderChronologicalArchiveGrid();
    }

    // 📋 UPDATE BADGES: Keep all counter metrics accurate across the screen canvas
    if (typeof window.refreshGlobalBadgeCounters === "function") {
      window.refreshGlobalBadgeCounters();
    }
  }
});

$("case")?.addEventListener("input", (e) => validateCaseField(e.target));
$("min")?.addEventListener("input", (e) => validateMinField(e.target));

$("concernType")?.addEventListener("change", () => {
  const vocInput = $("voc");
  if (vocInput) vocInput.value = ""; 
  updateVocOptions(false);
  updateOutput();
  const suggestionsBox = document.getElementById('suggestions');
  if (suggestionsBox) {
    suggestionsBox.innerHTML = "Select a new VOC option from the dropdown to view its playbook...";
  }
  const spielContainer = document.getElementById('playbookSpielContainer');
  if (spielContainer) {
    spielContainer.innerHTML = `
      <div style="padding: 12px; color: var(--text-muted); font-style: italic; font-size: 13px; text-align: center; border: 1px dashed var(--border-color); border-radius: 4px;">
        The corresponding email spiel template will load automatically upon context verification.
      </div>`;
  }
  saveData(true);
});

$("voc")?.addEventListener("input", () => {
  updateOutput();
  if ($("concernType")?.value && $("voc")?.value) {
    updateSuggestions(); 
  }
});

$("voc")?.addEventListener("change", () => {
  updateOutput();
  saveData(true);
  if ($("concernType")?.value && $("voc")?.value) {
    updateSuggestions(); 
  }
});

$("copyBtn")?.addEventListener("click", copyDoc);
$("mobileCopyBtn")?.addEventListener("click", copyDoc);
$("resetBtn")?.addEventListener("click", resetForm);
$("mobileResetBtn")?.addEventListener("click", resetForm);

$("drawerToggle")?.addEventListener("click", toggleDrawer);
$("drawerCloseBtn")?.addEventListener("click", toggleDrawer);
$("themeToggle")?.addEventListener("click", toggleTheme);
$("densityToggleBtn")?.addEventListener("click", toggleDensityMode);
// Prevent clicks on the color swatch from also triggering the dark/light theme toggle
document.getElementById('agentThemePicker')?.addEventListener('click', (e) => {
  e.stopPropagation();
});

$("downloadHistoryBtn")?.addEventListener("click", downloadHistoryLog);
$("clearHistoryBtn")?.addEventListener("click", clearShiftHistory);

const closeSupervisorBtn = document.getElementById('closeSupervisorBtn');
const exitPortalBtn = document.getElementById('exitPortalBtn');
const supervisorAdminPanel = document.getElementById('supervisorAdminPanel');

const hideExtractionModal = () => {
  if (supervisorAdminPanel) {
    supervisorAdminPanel.style.display = 'none';
    supervisorAdminPanel.style.visibility = 'hidden';
    supervisorAdminPanel.style.opacity = '0';
  }
};

if (closeSupervisorBtn) closeSupervisorBtn.addEventListener('click', hideExtractionModal);
if (exitPortalBtn) exitPortalBtn.addEventListener('click', hideExtractionModal);

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
listenToDynamicVocLists();
if (typeof listenToSessionState === "function") listenToSessionState();


/* ==========================================================================
   VALIDATORS & DRAWERS (Global Access Helper Routines)
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

// 📢 REAL-TIME AGENT OPERATIONAL BROADCAST STREAM PIPELINE
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

        if (data.severity === "critical") {
          banner.style.setProperty("background-color", "#ef4444", "important");
          banner.style.setProperty("background", "#ef4444", "important");
          banner.style.setProperty("color", "#ffffff", "important");
        } else if (data.severity === "warning") {
          banner.style.setProperty("background-color", "#f59e0b", "important");
          banner.style.setProperty("background", "#f59e0b", "important");
          banner.style.setProperty("color", "#000000", "important"); 
        } else {
          banner.style.setProperty("background-color", "#3b82f6", "important");
          banner.style.setProperty("background", "#3b82f6", "important");
          banner.style.setProperty("color", "#ffffff", "important");
        }
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



/**
 * 📥 CORE SYNC: Pull active session data from Firestore on Agent Auth/Login
 * This routine replaces your old localStorage initialization checks.
 */
window.syncAgentSessionFromCloud = async function(agentId) {
  if (!agentId || typeof firestoreDb === 'undefined') {
    console.warn("Cloud sync aborted: Missing Agent ID or Firestore Database reference.");
    return;
  }
  
  try {
    const agentRecordRef = doc(firestoreDb, scopedCollectionName("agent_workbenches"), agentId);
    const docSnap = await getDoc(agentRecordRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Pull and update global tracking arrays instantly across roaming profiles
      if (typeof globalShiftHistory !== 'undefined') {
        globalShiftHistory = data.shiftHistory || [];
      } else {
        window.globalShiftHistory = data.shiftHistory || [];
      }
      activeUrgentQueueItems = data.activeQueue || [];
      
      // Sync local hardware cache as a secondary redundant fallback
      localStorage.setItem('shift_history_cache_key', JSON.stringify(globalShiftHistory));
      localStorage.setItem('workbench_queue_cache', JSON.stringify(activeUrgentQueueItems));
      
      // Repaint user interface matching downloaded cloud metrics
      renderChronologicalArchiveGrid();
      if (typeof renderHistoryView === "function") renderHistoryView();
      runActiveQueueCountdownEngine();
      window.refreshGlobalBadgeCounters(); // 🎯 show correct count right on login
      
      console.log(`📡 Station Hot-Swap Success: Loaded data for Agent: ${agentId}`);
    } else {
      console.log("🆕 No previous cloud session found for this profile. Initializing clean slate.");
      renderChronologicalArchiveGrid();
    }
  } catch (error) {
    console.error("❌ Cloud sync retrieval engine failure:", error);
  }
};

/**
 * 📤 CORE SYNC: Push current workbench mutations directly up to Firestore
 */
async function dispatchWorkbenchPayloadToCloud() {
  const agentId = window.currentAgentId || (typeof currentAgentId !== 'undefined' ? currentAgentId : null);
  if (!agentId || typeof firestoreDb === 'undefined') return;

  try {
    const agentRecordRef = doc(firestoreDb, scopedCollectionName("agent_workbenches"), agentId);
    await setDoc(agentRecordRef, {
      shiftHistory: globalShiftHistory || [],
      activeQueue: activeUrgentQueueItems || [],
      lastSyncedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error("❌ Cloud push sync execution dropped:", error);
  }
}

// Premium hardware notification audio chime generator
function playNotificationHardwareChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine'; osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    osc1.start(); osc1.stop(audioCtx.currentTime + 0.1);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.05); 
    gain2.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.05); osc2.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.warn("Audio context restricted:", e);
  }
}

function triggerHardwarePillNotification(caseId, concernType) {
  let alertToastNode = document.getElementById('hardwareAlertToastInstance');
  if (!alertToastNode) {
    alertToastNode = document.createElement('div');
    alertToastNode.id = 'hardwareAlertToastInstance';
    alertToastNode.className = 'hardware-toast-notification';
    alertToastNode.innerHTML = `
      <div class="hardware-toast-icon-wrapper"><i id="hardwareToastBellIcon" class="fas fa-bell"></i></div>
      <div class="hardware-toast-content">
        <p class="hardware-toast-header">🔔 Case Tracking Alert</p>
        <p id="hardwareToastBodyPayload" class="hardware-toast-details"></p>
      </div>
    `;
    document.body.appendChild(alertToastNode);
  }

  const payloadTextContainer = document.getElementById('hardwareToastBodyPayload');
  const bellIconInstance = document.getElementById('hardwareToastBellIcon');
  if (payloadTextContainer) {
    payloadTextContainer.innerHTML = `Case ID <strong>#${caseId}</strong> (${concernType}) requires immediate follow-up check.`;
  }

  playNotificationHardwareChime();
  if (bellIconInstance) bellIconInstance.classList.add('animate-vibrate-bell');
  alertToastNode.classList.add('slide-in');

  setTimeout(() => {
    alertToastNode.classList.remove('slide-in');
    setTimeout(() => {
      if (bellIconInstance) bellIconInstance.classList.remove('animate-vibrate-bell');
    }, 450);
  }, 6000);
}

function getNormalizedSystemDateString() {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function renderChronologicalArchiveGrid() {
  const deckSliderTarget = document.getElementById('horizontalSliderTarget');
  if (!deckSliderTarget) return;

  if (typeof globalShiftHistory === 'undefined' || !globalShiftHistory || globalShiftHistory.length === 0) {
    deckSliderTarget.innerHTML = `<span style="font-size: 10px; color: var(--text-muted); font-style: italic; padding-left: 5px;">Vault clean...</span>`;
    return;
  }

  const currentNormalizedKey = getNormalizedSystemDateString();
  const mappedGroups = {};

  globalShiftHistory.forEach(item => {
    let entryKey = item.savedDateStamp;
    if (!entryKey || entryKey.includes(",") || entryKey.length > 8) {
      entryKey = currentNormalizedKey;
      item.savedDateStamp = currentNormalizedKey;
    }
    if (!mappedGroups[entryKey]) mappedGroups[entryKey] = [];
    mappedGroups[entryKey].push(item);
  });

  let horizontalDeckHtml = ``;
  Object.keys(mappedGroups).forEach(dateKey => {
    const totalVolume = mappedGroups[dateKey].length;
    const isActiveClass = (dateKey === currentNormalizedKey) ? 'active' : '';
    const activeBackground = (dateKey === currentNormalizedKey) 
      ? 'background: rgba(96, 165, 250, 0.15); border: 1px solid #60a5fa;' 
      : 'background: rgba(255,255,255,0.02); border: 1px solid var(--border-color);';

    horizontalDeckHtml += `
      <div class="folder-node-btn ${isActiveClass}" data-date-bucket="${dateKey}" onclick="window.drilldownArchiveFolderEntries('${dateKey}')" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 85px; cursor: pointer; padding: 6px; ${activeBackground} border-radius: 6px;">
        <i class="fas fa-folder" style="font-size: 24px; color: #f59e0b; pointer-events: none;"></i>
        <span style="font-size: 9px; font-weight: bold; margin-top: 4px; color: #fff; pointer-events: none;">${dateKey}</span>
        <span style="font-size: 9px; color: var(--text-muted); pointer-events: none;">(${totalVolume} cases)</span>
      </div>
    `;
  });
  
  deckSliderTarget.innerHTML = horizontalDeckHtml;
}

function initializeHistorySearch() {
  const searchInput = document.getElementById('shiftHistorySearchInput') || $('shiftHistorySearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const queryStr = e.target.value.toLowerCase().trim();
    if (typeof renderHistoryView === "function") {
      renderHistoryView(queryStr);
    }
  });
}


window.drilldownArchiveFolderEntries = function(dateKey) {
  const currentNormalizedKey = getNormalizedSystemDateString();
  
  if (activeFolderFilterBucket === dateKey) {
    activeFolderFilterBucket = null;
    if (typeof showToast === "function") showToast("Returning to active shift view.");
  } else {
    activeFolderFilterBucket = dateKey;
    if (typeof showToast === "function") showToast(`Viewing journal entries for shift: ${dateKey}`);
  }

  document.querySelectorAll('.folder-node-btn').forEach(btn => {
    const bucket = btn.getAttribute('data-date-bucket');
    if (bucket === activeFolderFilterBucket) {
      btn.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
      btn.style.setProperty('border', '1px solid #10b981', 'important');
    } else if (bucket === currentNormalizedKey) {
      btn.style.setProperty('background', 'rgba(96, 165, 250, 0.15)', 'important');
      btn.style.setProperty('border', '1px solid #60a5fa', 'important');
    } else {
      btn.style.setProperty('background', 'rgba(255,255,255,0.02)', 'important');
      btn.style.setProperty('border', '1px solid var(--border-color)', 'important');
    }
  });

  if (typeof renderHistoryView === "function") {
    renderHistoryView();
  }
};

/**
 * ⏱️ UPGRADED PRIORITY MONITOR COUNTDOWN ENGINE
 * Maintains expired cases in view, manages the Messenger orb notification, and calculates 24H SLA markers.
 */


/* ==========================================================================
   🔄 COUNTDOWN ENGINE: PERSISTENT NOTIFICATIONS & DYNAMIC FOLLOW PIPELINE
   ========================================================================== */
function runActiveQueueCountdownEngine() {
  if (ongoingQueueTrackingLoop) clearInterval(ongoingQueueTrackingLoop);

  let cloudSyncTickCounter = 0; // 🎯 THROTTLE: counts local ticks between cloud syncs

  ongoingQueueTrackingLoop = setInterval(async () => {
    const trackingContainerUI = document.getElementById('metaTrackerQueueBox');
    if (!trackingContainerUI) return;

    cloudSyncTickCounter++;

    // 📡 Cross-Station Firestore Sync Gateway — now only every 5 seconds instead of every 1s
    if (cloudSyncTickCounter >= 5) {
      cloudSyncTickCounter = 0;

      const agentId = window.currentAgentId || (typeof currentAgentId !== 'undefined' ? currentAgentId : null);
      if (agentId && typeof firestoreDb !== 'undefined') {
        try {
          const agentRecordRef = doc(firestoreDb, scopedCollectionName("agent_workbenches"), agentId);
          const docSnap = await getDoc(agentRecordRef);
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            const cloudQueue = remoteData.activeQueue || [];
            const localQueueStr = localStorage.getItem('workbench_queue_cache') || "[]";
            if (JSON.stringify(cloudQueue) !== localQueueStr) {
              activeUrgentQueueItems = cloudQueue;
              localStorage.setItem('workbench_queue_cache', JSON.stringify(cloudQueue));
            }
          }
        } catch (e) {
          console.warn("Sync throttled:", e);
        }
      }
    } // 🎯 closes "if (cloudSyncTickCounter >= 5)"

if (localStorage.getItem('workbench_queue_cache')) {
      activeUrgentQueueItems = JSON.parse(localStorage.getItem('workbench_queue_cache'));
    }

    window.refreshGlobalBadgeCounters(); // 🎯 keeps the orb badge in sync every second

    if (activeUrgentQueueItems.length === 0) {
      trackingContainerUI.innerHTML = `<div style="padding:20px; text-align:center; color: var(--text-muted); font-size:11px; font-style:italic;">No active countdown parameters tracking.</div>`;
      dismissMessengerAlertUI(false);
      clearInterval(ongoingQueueTrackingLoop);
      ongoingQueueTrackingLoop = null;
      return;
    }

    let uiBufferHtml = ``;
    const currentTimeStamp = Date.now();
    let priorityExpirationDetected = false;
    let expiredCaseIdentifier = "";

    for (let index = 0; index < activeUrgentQueueItems.length; index++) {
      const item = activeUrgentQueueItems[index];
      const remainingTimeDelta = item.expirationEpochTarget - currentTimeStamp;
      const totalAgeMs = currentTimeStamp - (item.createdEpochTimestamp || currentTimeStamp);
      const isSlaBreached = totalAgeMs > 24 * 60 * 60 * 1000; 

      let countdownClockString = "00:00:00";
      let isExpired = false;

      if (remainingTimeDelta > 0) {
        const hours = Math.floor(remainingTimeDelta / 3600000);
        const minutes = Math.floor((remainingTimeDelta % 3600000) / 60000);
        const seconds = Math.floor((remainingTimeDelta % 60000) / 1000);
        countdownClockString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        isExpired = true;
        countdownClockString = "EXPIRED";
        priorityExpirationDetected = true;
        expiredCaseIdentifier = item.caseId;
      }

      uiBufferHtml += `
        <div class="priority-timer-card ${isExpired ? 'expired-card-highlight' : ''}" style="background: rgba(15, 23, 42, 0.4); border: 1px solid ${isExpired ? '#ef4444' : 'rgba(96, 165, 250, 0.15)'}; border-left: 4px solid ${isExpired ? '#ef4444' : '#60a5fa'}; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div>
              <div style="font-weight:700; color:#60a5fa; font-size:11px; text-transform: uppercase;">${item.concernType}</div>
              <div style="color:#cbd5e1; font-size:12px; font-weight: bold; margin-top: 2px;">ID: #${item.caseId}</div>
              <div style="display: flex; gap: 4px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
                ${isSlaBreached ? `<span class="sla-breached-badge"><i class="fas fa-exclamation-triangle"></i> >24H STALE</span>` : ''}
              </div>
            </div>
            <div style="font-family:monospace; font-size:12px; font-weight:700; background:#0f172a; color:${isExpired ? '#ef4444' : '#10b981'}; padding:4px 8px; border-radius:4px; border:1px solid ${isExpired ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}; display: flex; align-items: center; gap: 6px;">
              <i class="${isExpired ? 'fas fa-bell animate-pulse' : 'fas fa-hourglass-half fa-spin'}" style="font-size:10px;"></i> ${countdownClockString}
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px;">
            <button onclick="resolveCaseQueueNode('${item.caseId}')" style="flex: 1; padding: 6px; background: #10b981; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px;"><i class="fas fa-check"></i> Done</button>
            <button onclick="extendCaseQueueNode('${item.caseId}', 1440)" style="flex: 1; padding: 6px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px;"><i class="fas fa-history"></i> +24H</button>
            <button onclick="extendCaseQueueNode('${item.caseId}', 30)" style="flex: 0.4; padding: 6px; background: #475569; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;" title="Extend 30 Minutes">+30M</button>
          </div>
        </div>
      `;
    }

    trackingContainerUI.innerHTML = uiBufferHtml;

    // 🔔 INTERACTIVE MESSENGER NOTIFICATION HANDLER
    const bubble = document.getElementById('messengerNotificationBubble');
    const txtDisplay = document.getElementById('messengerNotificationText');
    const orbControl = document.getElementById('metaTrackerOrb');
    const orbIcon = orbControl ? orbControl.querySelector('.meta-orb-icon') : null;

    if (priorityExpirationDetected && !globalNotificationAcknowledgedLock) {
      if (txtDisplay) {
        txtDisplay.innerHTML = `
          <div style="font-weight: 700; font-size: 13px; color: #050505; margin-bottom: 2px;">SLA Priority Monitor</div>
          <div style="font-weight: 400; font-size: 12px; color: #65676B; line-height: 1.3;">Case <span style="font-weight: 600; color: #050505;">#${expiredCaseIdentifier}</span> has expired and needs immediate checking.</div>
        `;
      }
      
      if (bubble) {
        // Force display block status flag
        bubble.style.display = "block";
        
        // Pass the live placement update over to our coordinate manager
        const currentOrbLeft = orbControl ? orbControl.offsetLeft : 0;
        if (typeof window.syncBubblePlacementCoordinates === 'function') {
          window.syncBubblePlacementCoordinates(currentOrbLeft);
        }
      }
      
      if (orbControl) orbControl.classList.add('tracker-orb-alert-active');
      if (orbIcon) orbIcon.className = "fas fa-exclamation-triangle meta-orb-icon";
    }

    // 🛡️ CRITICAL FIX: Retain the alerting "!" icon if ANY case in the queue remains expired
    let currentTimestampCheck = Date.now();
    let hasAnyUnresolvedExpiredCases = activeUrgentQueueItems.some(i => i.expirationEpochTarget <= currentTimestampCheck);

    if (hasAnyUnresolvedExpiredCases) {
      if (orbControl) orbControl.classList.add('tracker-orb-alert-active');
      if (orbIcon) orbIcon.className = "fas fa-exclamation-triangle meta-orb-icon";
    } else {
      // Return cleanly to folder icon ONLY when completely caught up
      if (orbControl) orbControl.classList.remove('tracker-orb-alert-active');
      if (orbIcon) orbIcon.className = "fas fa-folder-open meta-orb-icon";
      globalNotificationAcknowledgedLock = false; 
      dismissMessengerAlertUI(false);
    }

  }, 1000);
}

/**
 * Cleanly hides messenger alerts and ensures orb structural layers reset
 */
function dismissMessengerAlertUI(forceDrawerOpen = false) {
  const bubble = document.getElementById('messengerNotificationBubble');
  const orbControl = document.getElementById('metaTrackerOrb');
  const orbIcon = orbControl ? orbControl.querySelector('.meta-orb-icon') : null;
  const drawer = document.getElementById('metaTrackerDrawer');

  if (bubble) {
    bubble.style.transform = "translateY(15px) scale(0.95)";
    bubble.style.opacity = "0";
    setTimeout(() => { bubble.style.display = "none"; }, 300);
  }
  
  if (orbControl) orbControl.classList.remove('tracker-orb-alert-active');
  
  // Safe Fallback: Force reset icon back to folder if no other cases are active
  let cache = JSON.parse(localStorage.getItem('workbench_queue_cache')) || [];
  let currentTimestamp = Date.now();
  let anyExpiredRemaining = cache.some(item => (item.expirationEpochTarget - currentTimestamp) <= 0);

  if (!anyExpiredRemaining && orbIcon) {
    orbIcon.className = "fas fa-folder-open meta-orb-icon";
  }

  // Slide open full case monitoring drawer if bubble text is explicitly clicked
  if (forceDrawerOpen && drawer) {
    drawer.classList.add('open-drawer'); 
  }
}

// 🛫 FIXED GLOBAL CONTEXT WINDOW MAPPINGS FOR INLINE BUTTON HANDLING
window.resolveCaseQueueNode = function(caseId) {
  // 1. Temporarily pause the background engine loop to prevent race conditions
  if (ongoingQueueTrackingLoop) {
    clearInterval(ongoingQueueTrackingLoop);
    ongoingQueueTrackingLoop = null;
  }

  let items = JSON.parse(localStorage.getItem('workbench_queue_cache')) || [];
  items = items.filter(i => i.caseId !== caseId);
  
  // 2. Commit to local storage immediately
  localStorage.setItem('workbench_queue_cache', JSON.stringify(items));
  activeUrgentQueueItems = items; // Force immediate sync of global memory array

  pushUpdatedQueueStateToNetwork();
};

window.extendCaseQueueNode = function(caseId, minutesToExtend) {
  // 1. Temporarily pause the background engine loop to prevent race conditions
  if (ongoingQueueTrackingLoop) {
    clearInterval(ongoingQueueTrackingLoop);
    ongoingQueueTrackingLoop = null;
  }

  let items = JSON.parse(localStorage.getItem('workbench_queue_cache')) || [];
  
  // Calculate the fresh new future expiration target boundary 
  const freshNewEpochTarget = Date.now() + (minutesToExtend * 60 * 1000);
  
  items = items.map(i => {
    if (i.caseId === caseId) {
      i.expirationEpochTarget = freshNewEpochTarget; 
    }
    return i;
  });
  
  // 2. Commit to local storage immediately
  localStorage.setItem('workbench_queue_cache', JSON.stringify(items));
  activeUrgentQueueItems = items; // Force immediate sync of global memory array

  pushUpdatedQueueStateToNetwork();
};

function pushUpdatedQueueStateToNetwork() {
  globalNotificationAcknowledgedLock = false; // Reset visual locks
  
  // Fire data sync up to Firestore for terminal cross-compatibility
  if (typeof dispatchWorkbenchPayloadToCloud === "function") {
    dispatchWorkbenchPayloadToCloud();
  }
  
  if (typeof window.refreshGlobalBadgeCounters === "function") {
    window.refreshGlobalBadgeCounters();
  }
  
  // 3. Safe Restart: Re-run the engine loop cleanly now that memory states match perfectly
  runActiveQueueCountdownEngine();
}

// 🔗 INITIALIZE POPUP OBSERVERS ON APP STARTUP
document.addEventListener("DOMContentLoaded", () => {
  
  // 💬 UPGRADED MESSENGER POPUP CLICK ROUTER
  document.getElementById('messengerNotificationBubble')?.addEventListener('click', (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Stops any event bubbling conflicts
    }

    globalNotificationAcknowledgedLock = true; // Set lock to stop popup until next cycle
    
    // 1. Hide the popup window cleanly
    dismissMessengerAlertUI(true); 

    // 2. 🎯 THE SLIDE OPEN FIX: Instantly force open the side tracking board!
    const drawer = document.getElementById('metaTrackerDrawer') || $('metaTrackerDrawer');
    const orbControl = document.getElementById('metaTrackerOrb') || $('metaTrackerOrb');
    
    if (drawer) {
      drawer.classList.add('drawer-open'); // Forces your tracking panel to slide into view
      
      // Update the Orb's structural state classes to show it's active
      if (orbControl) {
        orbControl.className = "meta-orb-trigger rgb-mode drawer-active-state";
      }
      
      console.log("🎯 Messenger Action: Intercepted bubble click and slid open tracking panel.");
    } else {
      console.error("Layout Error: Target element '#metaTrackerDrawer' missing from DOM.");
    }
  });
  
  // Fire off baseline loop sequence execution
  runActiveQueueCountdownEngine();
});

/**
 * ⚡ Intercept Entry Processor Wrapper - Explicit Element Mapping Version
 */
function interceptAndRegisterCaseTracking(caseId, outputText, isTrackingAuthorized) {
  // Sync the local representation with cloud queue data structures
  if (localStorage.getItem('workbench_queue_cache')) {
    activeUrgentQueueItems = JSON.parse(localStorage.getItem('workbench_queue_cache'));
  }
  
  // 🎯 EXPLICIT FIX: Target the dropdown element IDs straight from your HTML directly
  const channelDropdown = document.getElementById('trackUrgencyChannel');
  const timerDropdown = document.getElementById('urgencyTrackingTimerSelect');
  
  let selectedChannelValue = "Case Monitoring";
  let rawTimerDurationString = "60";

  if (channelDropdown) {
    selectedChannelValue = channelDropdown.value;
  }
  if (timerDropdown) {
    rawTimerDurationString = timerDropdown.value;
  }

  // 📋 CONSOLE EXTRACTION VERIFICATION
  console.log("🛠️ Cloud-Backed Explicit Extraction Trace ->", {
    caseId: caseId,
    extractedChannel: selectedChannelValue,
    extractedMinutes: rawTimerDurationString
  });

  const currentNormalizedKey = getNormalizedSystemDateString();

  if (typeof globalShiftHistory !== 'undefined' && globalShiftHistory.length > 0) {
    const targetIndices = [0, globalShiftHistory.length - 1];
    targetIndices.forEach(idx => {
      if (globalShiftHistory[idx]) {
        if (globalShiftHistory[idx].id === caseId || globalShiftHistory[idx].caseNum === caseId || idx === 0) {
          globalShiftHistory[idx].savedDateStamp = currentNormalizedKey;
          if (!globalShiftHistory[idx].id && caseId !== "N/A") {
            globalShiftHistory[idx].id = caseId;
          }
        }
      }
    });
    localStorage.setItem('shift_history_cache_key', JSON.stringify(globalShiftHistory));
  }

  // Parse out the custom threshold duration
  let parsedMinutesWindow = parseFloat(rawTimerDurationString);
  if (isNaN(parsedMinutesWindow) || parsedMinutesWindow <= 0) {
    parsedMinutesWindow = 60; // Safe ultimate fallback configuration
  }

  const targetExpirationTimestamp = Date.now() + (parsedMinutesWindow * 60 * 1000);
  const normalizedCaseNum = (caseId && caseId !== "N/A") ? caseId.trim().toUpperCase() : "TRACK-CASE";
  
  // De-duplicate existing items matching the current Case/SR payload key
  activeUrgentQueueItems = activeUrgentQueueItems.filter(item => item.caseId !== normalizedCaseNum);

  // 💎 FIXED COUPLING: Appending parameters with locked baseline creation timestamp
  activeUrgentQueueItems.push({
    caseId: normalizedCaseNum,
    concernType: selectedChannelValue,
    createdEpochTimestamp: Date.now(), // 🔒 LOCKED CREATION MARKER (Added for >24H Stale checks!)
    expirationEpochTarget: targetExpirationTimestamp
  });

  localStorage.setItem('workbench_queue_cache', JSON.stringify(activeUrgentQueueItems));
  
  // Fire data sync up to Firestore for terminal cross-compatibility
  if (typeof dispatchWorkbenchPayloadToCloud === "function") {
    dispatchWorkbenchPayloadToCloud();
  }

  if (typeof showToast === 'function') {
    showToast(`Tracked Cloud-Wide: #${normalizedCaseNum} for ${parsedMinutesWindow} min.`);
  }
  
  if (typeof runActiveQueueCountdownEngine === 'function') {
    runActiveQueueCountdownEngine();
  }

  if (typeof renderChronologicalArchiveGrid === 'function') {
    renderChronologicalArchiveGrid();
  }
}

window.spawnPictureInPictureNotes = function(globalIndex) {
  if (typeof globalShiftHistory === 'undefined' || !globalShiftHistory[globalIndex]) return;
  const entry = globalShiftHistory[globalIndex];

  let pipFrame = document.getElementById('workbenchPipOverlayInstance');
  
  if (!pipFrame) {
    pipFrame = document.createElement('div');
    pipFrame.id = 'workbenchPipOverlayInstance';
    pipFrame.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; width: 320px; height: 240px;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      z-index: 99999; display: flex; flex-direction: column; overflow: hidden; resize: both; min-width: 240px; min-height: 180px;
    `;
    
    pipFrame.innerHTML = `
      <div id="pipHeaderDragHandle" style="background: rgba(255,255,255,0.05); padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; cursor: move; border-bottom: 1px solid rgba(255,255,255,0.08); user-select: none;">
        <span id="pipHeaderTitleText" style="font-size: 11px; font-weight: bold; color: #60a5fa; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 80%;"></span>
        <button type="button" onclick="document.getElementById('workbenchPipOverlayInstance').style.display='none'" style="background: transparent; color: #94a3b8; border: none; cursor: pointer; font-size: 12px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="flex: 1; padding: 10px; overflow-y: auto;">
        <pre id="pipBodyContentContainer" style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 11px; color: #e2e8f0; line-height: 1.4;"></pre>
      </div>
    `;
    document.body.appendChild(pipFrame);
    makePipFrameDraggable(pipFrame);
  }

  document.getElementById('pipHeaderTitleText').textContent = `🔲 Case PiP: #${entry.id || 'N/A'}`;
  document.getElementById('pipBodyContentContainer').textContent = entry.text;
  pipFrame.style.display = 'flex';
  if (typeof showToast === "function") showToast("Notes shifted to overlay panel.");
};

function makePipFrameDraggable(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const handle = document.getElementById("pipHeaderDragHandle");
  
  if (handle) {
    handle.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.clientX > (elmnt.offsetLeft + elmnt.offsetWidth - 15) && e.clientY > (elmnt.offsetTop + elmnt.offsetHeight - 15)) return;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.bottom = "auto";
    elmnt.style.right = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Global exposure of save hooks soPart 4 configuration script catches deletions instantly
window.saveDataCloudInterface = function() {
  dispatchWorkbenchPayloadToCloud();
};

document.addEventListener("DOMContentLoaded", () => {
  initializeHistorySearch();
});

/* ==========================================================================
   🕹️ FLOATING ENGINE: DRAGGABLE TRACKER ORB SETUP WITH CLICK THRESHOLD
   ========================================================================== */
function makeOrbFullyDraggable() {
  const orb = document.getElementById('metaTrackerOrb');
  if (!orb) return;

  let posX = 0, posY = 0, mouseX = 0, mouseY = 0;
  let startX = 0, startY = 0; // 🎯 Tracks original click down location
  let isDraggingState = false;

  orb.style.position = "fixed";
  orb.style.cursor = "grab";
  orb.style.zIndex = "999999";

  const currentRect = orb.getBoundingClientRect();
  orb.style.top = currentRect.top + "px";
  orb.style.left = currentRect.left + "px";
  orb.style.bottom = "auto";
  orb.style.right = "auto";

  orb.addEventListener('mousedown', dragStartProcess);
  orb.addEventListener('touchstart', dragStartProcess, { passive: false });

  function dragStartProcess(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.classList.contains('clickable')) return;
    
    isDraggingState = false;
    orb.style.cursor = "grabbing";

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    mouseX = clientX;
    mouseY = clientY;
    
    // 🧠 Store baseline starting pixels
    startX = clientX;
    startY = clientY;

    if (e.type === 'mousedown') {
      document.onmouseup = closeDragRoutine;
      document.onmousemove = elementDragRoutine;
    } else {
      document.addEventListener('touchend', closeDragRoutine);
      document.addEventListener('touchmove', elementDragRoutine, { passive: false });
    }
  }

  function elementDragRoutine(e) {
    if (e) e.preventDefault(); 

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    // 🎯 THRESHOLD SAFETY CHECK: Only flag as a drag if moved more than 3 pixels
    if (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3) {
      isDraggingState = true;
    }

    // Stop calculation processing if user is just clicking down statically
    if (!isDraggingState) return;

    posX = mouseX - clientX;
    posY = mouseY - clientY;
    mouseX = clientX;
    mouseY = clientY;

    let targetTopPosition = parseInt(orb.style.top || 0, 10) - posY;
    let targetLeftPosition = parseInt(orb.style.left || 0, 10) - posX;

    if (targetTopPosition < 10) targetTopPosition = 10;
    if (targetLeftPosition < 10) targetLeftPosition = 10;
    if (targetTopPosition > window.innerHeight - 70) targetTopPosition = window.innerHeight - 70;
    if (targetLeftPosition > window.innerWidth - 70) targetLeftPosition = window.innerWidth - 70;

    orb.style.top = targetTopPosition + "px";
    orb.style.left = targetLeftPosition + "px";

    if (typeof window.syncBubblePlacementCoordinates === 'function') {
      window.syncBubblePlacementCoordinates();
    }
  }

  function closeDragRoutine() {
    orb.style.cursor = "grab";
    
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";

    document.onmouseup = null;
    document.onmousemove = null;
    document.removeEventListener('touchend', closeDragRoutine);
    document.removeEventListener('touchmove', elementDragRoutine);

    // 🛡️ CLICK PROTECTOR TRAP
    if (isDraggingState) {
      const stopPropagationTrap = (captureEvent) => {
        captureEvent.stopImmediatePropagation();
        orb.removeEventListener('click', stopPropagationTrap, true);
      };
      orb.addEventListener('click', stopPropagationTrap, true);
    }
  }
}

/* ==========================================================================
   🔢 FLOATING ORB BADGE COUNTER
   ========================================================================== */
window.refreshGlobalBadgeCounters = function() {
  const badge = document.getElementById('metaOrbBadgeCount');
  if (!badge) return;

  const count = Array.isArray(activeUrgentQueueItems) ? activeUrgentQueueItems.length : 0;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
};

/* ==========================================================================
   📡 GLOBAL COORDINATE SYNC ENGINE (Snaps Bubble Relative to Master Orb)
   ========================================================================== */
window.syncBubblePlacementCoordinates = function() {
  const orb = document.getElementById('metaTrackerOrb');
  const bubble = document.getElementById('messengerNotificationBubble');
  if (!orb || !bubble || bubble.style.display === "none") return;

  let caret = document.getElementById('messengerBubbleCaret');
  if (!caret) {
    caret = document.createElement('div');
    caret.id = 'messengerBubbleCaret';
    bubble.appendChild(caret);
  }

  const orbRect = orb.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  
  // Clean base styles that position the bubble exactly 12px below the orb
  const baseBubbleStyles = "display: block !important; position: absolute !important; width: 280px; padding: 12px 16px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #ef4444; border-radius: 14px; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4); color: #fff; z-index: 99999; top: 62px; transform: none !important;";
  const baseCaretStyles = "position: absolute !important; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 7px solid #ef4444; pointer-events: none; top: -8px; transform: none !important;";

  // Edge detection based on the orb's screen location
  if (orbRect.left > screenWidth - 180) {
    // Snap to the right side of the orb
    bubble.style.cssText = `${baseBubbleStyles} right: 0px; left: auto;`;
    caret.style.cssText = `${baseCaretStyles} right: 16px; left: auto;`;
  } else if (orbRect.left < 180) {
    // Snap to the left side of the orb
    bubble.style.cssText = `${baseBubbleStyles} left: 0px; right: auto;`;
    caret.style.cssText = `${baseCaretStyles} left: 16px; right: auto;`;
  } else {
    // Center alignment
    bubble.style.cssText = `${baseBubbleStyles} left: 50%; right: auto; transform: translateX(-50%) !important;`;
    caret.style.cssText = `${baseCaretStyles} left: 50%; right: auto; transform: translateX(-50%) !important;`;
  }
};

// 🎬 Run tracking engine hook on document layout resolution
document.addEventListener("DOMContentLoaded", () => {
  makeOrbFullyDraggable();
});

/* ==========================================================================
   🎨 DYNAMIC AGENT WORKSPACE STYLING CONTROLLER
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const colorPicker = document.getElementById('agentThemePicker');
  
  // 1. Check if the agent has a preferred background color saved from a prior shift
  const savedThemeColor = localStorage.getItem('agent_custom_theme_color');
  
  if (savedThemeColor) {
    // Apply saved background to the root DOM container element
    document.documentElement.style.setProperty('--workspace-bg', savedThemeColor);
    if (colorPicker) colorPicker.value = savedThemeColor;
  }

  // 2. Monitor real-time adjustments on the fly
  colorPicker?.addEventListener('input', (e) => {
    const selectedColor = e.target.value;
    
    // Dynamically inject the new hue variable to the screen layout engine
    document.documentElement.style.setProperty('--workspace-bg', selectedColor);
    
    // Commit selection to storage so it survives application updates
    localStorage.setItem('agent_custom_theme_color', selectedColor);
  });
});
