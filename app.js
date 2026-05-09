let candidates = [];
let activeCandidate = null;
let latestEvaluation = null;
let hasTranscript = false;

const $ = (selector) => document.querySelector(selector);

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function setLoading(isLoading, message = "Running specialist agents") {
  const buttons = ["#uploadTopButton", "#uploadHeroButton", "#demoButton", "#unlockButton"].map($);
  buttons.forEach((button) => {
    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
  });

  $("#packetStatus").textContent = isLoading ? message : hasTranscript ? "Transcript analyzed" : "Waiting for transcript";
  $("#packetStatus").classList.toggle("is-ready", hasTranscript && !isLoading);

  if (isLoading) {
    $("#dropZone").innerHTML = `
      <span class="upload-glyph is-spinning"></span>
      <strong>Specialist agents are reviewing evidence</strong>
      <p>Conversation, code, verification, agent workflow, communication, and delivery risk agents are running in parallel.</p>
    `;
  }
}

function uploadTranscript() {
  $("#transcriptInput").click();
}

async function handleTranscriptFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  await submitEvidence({
    candidate: {
      name: file.name.replace(/\.[^.]+$/, "") || "Uploaded Candidate",
      title: "Uploaded transcript"
    },
    role: $("#roleSelect").value,
    mode: $("#modeSelect").value,
    evidence: {
      aiTranscript: text,
      finalExplanation: "Transcript uploaded through InterviewOS UI."
    }
  });

  event.target.value = "";
}

async function runDemoPacket() {
  try {
    setLoading(true, "Loading demo packet");
    const response = await fetch("/api/demo-evidence");
    if (!response.ok) throw new Error("Could not load demo evidence.");
    const payload = await response.json();
    payload.role = $("#roleSelect").value;
    payload.mode = $("#modeSelect").value;
    await submitEvidence(payload);
  } catch (error) {
    handleBackendError(error);
  }
}

async function submitEvidence(payload) {
  try {
    setLoading(true);
    const response = await fetch("/api/evaluations", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || errorBody.error || "Evaluation request failed.");
    }

    latestEvaluation = await response.json();
    candidates = [latestEvaluation.candidate];
    activeCandidate = candidates[0];
    revealAnalysis();
    showToast(`Agent run complete in ${latestEvaluation.durationMs}ms`);
  } catch (error) {
    handleBackendError(error);
  } finally {
    setLoading(false);
  }
}

function handleBackendError(error) {
  const detail = error instanceof Error ? error.message : String(error);
  showToast(`Backend unavailable: ${detail}`);
  $("#dropZone").innerHTML = `
    <span class="upload-glyph"></span>
    <strong>Backend not reachable</strong>
    <p>Start the backend with npm start, then upload the transcript again.</p>
  `;
  setLoading(false);
}

function revealAnalysis() {
  hasTranscript = true;
  $("#lockedState").style.display = "none";
  $("#analysis").classList.remove("is-hidden");
  $("#analysis").classList.add("is-revealing");
  $("#packetStatus").textContent = "Transcript analyzed";
  $("#packetStatus").classList.add("is-ready");
  $("#dropZone").innerHTML = `
    <span class="upload-glyph"></span>
    <strong>Evidence packet analyzed</strong>
    <p>${latestEvaluation?.agents?.length || 7} specialist agents reviewed transcript, diff, tests, and process signals.</p>
  `;
  renderAll();
  $("#analysis").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTabs() {
  $("#candidateTabs").innerHTML = candidates
    .map(
      (candidate) => `
        <button class="${candidate.id === activeCandidate.id ? "is-active" : ""}" data-candidate="${candidate.id}">
          ${candidate.name}
        </button>
      `
    )
    .join("");

  document.querySelectorAll("[data-candidate]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCandidate = candidates.find((candidate) => candidate.id === button.dataset.candidate);
      renderAll();
      showToast(`${activeCandidate.name} readout loaded`);
    });
  });
}

function renderAgentRun() {
  const agents = latestEvaluation?.agents || [];
  $("#runMeta").textContent = latestEvaluation
    ? `${agents.length} agents · ${latestEvaluation.durationMs}ms`
    : "Awaiting run";

  $("#agentRunGrid").innerHTML = agents
    .map(
      (agent) => `
        <article class="agent-chip">
          <span class="agent-dot"></span>
          <strong>${agent.label}</strong>
          <small>${agent.findingCount} finding${agent.findingCount === 1 ? "" : "s"} · ${agent.durationMs}ms</small>
        </article>
      `
    )
    .join("");
}

function renderInsights() {
  $("#candidateTitle").textContent = `${activeCandidate.name} · ${activeCandidate.title}`;
  $("#confidenceBadge").textContent = activeCandidate.confidence;

  $("#insightGrid").innerHTML = activeCandidate.insights
    .map(
      (insight) => `
        <article class="insight-card" style="--tone: ${insight.tone}">
          <span class="insight-label">${insight.label}</span>
          <h3>${insight.title}</h3>
          <p>${insight.copy}</p>
          <span class="evidence-line">${insight.evidence}</span>
        </article>
      `
    )
    .join("");
}

function renderSignals() {
  $("#agentSignal").textContent = activeCandidate.signals.agent[0];
  $("#agentSignalCopy").textContent = activeCandidate.signals.agent[1];
  $("#evidenceSignal").textContent = activeCandidate.signals.evidence[0];
  $("#evidenceSignalCopy").textContent = activeCandidate.signals.evidence[1];
  $("#commSignal").textContent = activeCandidate.signals.comm[0];
  $("#commSignalCopy").textContent = activeCandidate.signals.comm[1];
  $("#riskSignal").textContent = activeCandidate.signals.risk[0];
  $("#riskSignalCopy").textContent = activeCandidate.signals.risk[1];
}

function renderTimeline() {
  $("#timeline").innerHTML = activeCandidate.timeline
    .map(
      ([time, title, copy, tone]) => `
        <article class="timeline-item" style="--tone: ${tone}">
          <span class="timeline-time">${time}</span>
          <span>
            <strong>${title}</strong>
            <span>${copy}</span>
          </span>
        </article>
      `
    )
    .join("");
}

function renderQuotes() {
  $("#quoteStack").innerHTML = activeCandidate.quotes
    .map(
      ([speaker, quote]) => `
        <article class="quote-card">
          <p>"${quote}"</p>
          <span>${speaker}</span>
        </article>
      `
    )
    .join("");
}

function renderScores() {
  $("#scoreList").innerHTML = activeCandidate.scores
    .map(
      ([label, value]) => `
        <div class="score-row">
          <span class="score-label">${label}</span>
          <span class="score-value">${value}</span>
          <span class="bar" style="--value: ${value}%"><span></span></span>
        </div>
      `
    )
    .join("");
}

function renderCohort() {
  const rows = candidates.map((candidate) => candidate.cohort);
  $("#cohortTable").innerHTML = rows
    .map(
      (row) => `
        <article class="cohort-row">
          <span>
            <strong>${row[0]}</strong>
            <small>${activeCandidate.title}</small>
          </span>
          <span>${row[1]}</span>
          <span>${row[2]}</span>
          <span>${row[3]}</span>
          <span>${row[4]}</span>
        </article>
      `
    )
    .join("");
}

function renderAll() {
  if (!activeCandidate) return;
  renderTabs();
  renderAgentRun();
  renderInsights();
  renderSignals();
  renderTimeline();
  renderQuotes();
  renderScores();
  renderCohort();
}

["#uploadTopButton", "#uploadHeroButton", "#dropZone"].forEach((selector) => {
  $(selector).addEventListener("click", uploadTranscript);
});

["#demoButton", "#unlockButton"].forEach((selector) => {
  $(selector).addEventListener("click", runDemoPacket);
});

$("#transcriptInput").addEventListener("change", handleTranscriptFile);

$("#roleSelect").addEventListener("change", (event) => {
  showToast(`${event.target.value} rubric selected`);
});

$("#modeSelect").addEventListener("change", (event) => {
  showToast(`${event.target.value} harness selected`);
});
