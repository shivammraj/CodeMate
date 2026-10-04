import './style.css';
import { marked } from 'marked';
import confetti from 'canvas-confetti';
import { DSA_PROBLEMS } from './problems.js';
import { CodeMateAIService } from './ai-service.js';
import { CodeAnalyzer } from './code-analyzer.js';

// Configure marked for clean, safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

class CodeMateApp {
  constructor() {
    this.aiService = new CodeMateAIService();
    this.codeAnalyzer = new CodeAnalyzer();
    this.currentProblem = DSA_PROBLEMS[0];
    this.currentMode = "hints"; // "hints" | "doctor" | "visual" | "interview"
    this.unlockedHintLevel = 1;
    this.chatHistory = [];
    this.isLoading = false;
    this.currentAnalysis = null;
    this.analysisTimeout = null;

    this.initDOMElements();
    this.initProblemsDropdown();
    this.bindEvents();
    this.loadProblem(this.currentProblem.id);
    this.updateEngineUI();
    this.renderInitialGreeting();
  }

  initDOMElements() {
    // Header
    this.problemSelect = document.getElementById("problem-select");
    this.engineStatusBtn = document.getElementById("engine-status-btn");
    this.engineIndicator = document.getElementById("engine-indicator");
    this.engineLabel = document.getElementById("engine-label");
    this.storyBtn = document.getElementById("story-btn");
    this.settingsBtn = document.getElementById("settings-btn");

    // Left Pane (Editor & Proactive Controls)
    this.problemTitle = document.getElementById("problem-title");
    this.problemDiff = document.getElementById("problem-diff");
    this.problemTags = document.getElementById("problem-tags");
    this.problemDesc = document.getElementById("problem-desc");
    this.codeEditor = document.getElementById("code-editor");
    this.lineNumbers = document.getElementById("line-numbers");
    this.inlineMarkersGutter = document.getElementById("inline-markers-gutter");
    this.markerPopover = document.getElementById("marker-popover");
    this.analyzeApproachBtn = document.getElementById("analyze-approach-btn");
    this.resetCodeBtn = document.getElementById("reset-code-btn");
    this.copyCodeBtn = document.getElementById("copy-code-btn");
    this.modeBtns = document.querySelectorAll(".mode-btn");

    // Right Pane (Proactive Mentor & Socratic Progression)
    this.learningProgressPanel = document.getElementById("learning-progress-panel");
    this.progressScoreVal = document.getElementById("progress-score-val");
    this.progressMiniFill = document.getElementById("progress-mini-fill");
    this.invariantsList = document.getElementById("invariants-list");
    this.attemptTrajectoryBadge = document.getElementById("attempt-trajectory-badge");

    this.aiSuggestionCard = document.getElementById("ai-suggestion-card");
    this.suggestionBadgeText = document.getElementById("suggestion-badge-text");
    this.suggestionStatusPill = document.getElementById("suggestion-status-pill");
    this.suggestionFocus = document.getElementById("suggestion-focus");
    this.suggestionQuestion = document.getElementById("suggestion-question");
    this.suggestionStepText = document.getElementById("suggestion-step-text");
    this.suggestionReflectBtn = document.getElementById("suggestion-reflect-btn");
    this.suggestionFocusMarkerBtn = document.getElementById("suggestion-focus-marker-btn");

    this.currentStepLabel = document.getElementById("current-step-label");
    this.stepCards = document.querySelectorAll(".step-card");
    this.chatStream = document.getElementById("chat-stream");
    this.chatInput = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("send-btn");

    // Quick Action Chips
    this.chipHint = document.getElementById("chip-hint");
    this.chipDoctor = document.getElementById("chip-doctor");
    this.chipExplain = document.getElementById("chip-explain");
    this.chipPractice = document.getElementById("chip-practice");
    this.chipSolved = document.getElementById("chip-solved");
    this.chipSolution = document.getElementById("chip-solution");
    this.teachingToggle = document.getElementById("teaching-toggle");

    // Modals
    this.settingsModal = document.getElementById("settings-modal");
    this.storyModal = document.getElementById("story-modal");
    this.solutionModal = document.getElementById("solution-modal");
    this.saveSettingsBtn = document.getElementById("save-settings-btn");
    this.confirmRevealBtn = document.getElementById("confirm-reveal-btn");
  }

  initProblemsDropdown() {
    this.problemSelect.innerHTML = DSA_PROBLEMS.map(p => 
      `<option value="${p.id}">${p.title} (${p.difficulty})</option>`
    ).join("");
  }

  bindEvents() {
    // Problem Selection
    this.problemSelect.addEventListener("change", (e) => {
      this.loadProblem(e.target.value);
    });

    // Proactive Socratic Code Analysis Button
    if (this.analyzeApproachBtn) {
      this.analyzeApproachBtn.addEventListener("click", () => {
        this.runProactiveAnalysis(true);
      });
    }

    // Suggestion Card Actions
    if (this.suggestionReflectBtn) {
      this.suggestionReflectBtn.addEventListener("click", () => {
        if (this.currentAnalysis && this.currentAnalysis.markers.length > 0) {
          const m = this.currentAnalysis.markers[0];
          this.handleUserSubmit(`CodeMate, regarding line ${m.line}: ${m.socraticQuestion}`);
        } else {
          this.handleUserSubmit(`How can I optimize the invariants of my current approach?`);
        }
      });
    }

    if (this.suggestionFocusMarkerBtn) {
      this.suggestionFocusMarkerBtn.addEventListener("click", () => {
        if (this.currentAnalysis && this.currentAnalysis.markers.length > 0) {
          this.highlightLine(this.currentAnalysis.markers[0].line);
        }
      });
    }

    // Editor Line Numbers & Real-Time Proactive Debounce
    this.codeEditor.addEventListener("input", () => {
      this.updateLineNumbers();
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = setTimeout(() => {
        this.runProactiveAnalysis(false);
      }, 700);
    });

    this.codeEditor.addEventListener("scroll", () => {
      this.lineNumbers.scrollTop = this.codeEditor.scrollTop;
      if (this.inlineMarkersGutter) {
        this.inlineMarkersGutter.scrollTop = this.codeEditor.scrollTop;
      }
    });

    // Reset & Copy
    this.resetCodeBtn.addEventListener("click", () => {
      this.codeEditor.value = this.currentProblem.starterCode;
      this.updateLineNumbers();
      this.runProactiveAnalysis(false);
      this.appendMessage("system", "🔄 Code reset to Rohan's original attempt with intentional bugs.");
    });

    this.copyCodeBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(this.codeEditor.value);
      const originalText = this.copyCodeBtn.innerHTML;
      this.copyCodeBtn.innerHTML = `✓ Copied!`;
      setTimeout(() => { this.copyCodeBtn.innerHTML = originalText; }, 1500);
    });

    // Mentorship Mode Switching
    this.modeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.modeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentMode = btn.dataset.mode;
        this.onModeChange();
      });
    });

    // Progressive Hint Stepper Clicks
    this.stepCards.forEach(card => {
      card.addEventListener("click", () => {
        const level = parseInt(card.dataset.level, 10);
        if (level === 4) {
          this.openModal(this.solutionModal);
        } else if (level <= this.unlockedHintLevel) {
          this.requestHint(level);
        }
      });
    });

    // Send Query
    this.sendBtn.addEventListener("click", () => this.handleUserSubmit());
    this.chatInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.handleUserSubmit();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleUserSubmit();
      }
    });

    // Quick Chips
    this.chipHint.addEventListener("click", () => {
      const nextLevel = Math.min(this.unlockedHintLevel + 1, 3);
      this.unlockedHintLevel = nextLevel;
      this.updateStepperUI();
      this.requestHint(nextLevel);
    });

    this.chipDoctor.addEventListener("click", () => {
      this.setMode("doctor");
      this.handleUserSubmit("Why does my code get stuck or produce the wrong output? Probe my logic!");
    });

    if (this.chipExplain) {
      this.chipExplain.addEventListener("click", () => {
        this.setMode("explain");
        this.handleUserSubmit("Can you explain the high-level logic, invariants, and Big-O complexity of this approach?");
      });
    }

    if (this.chipPractice) {
      this.chipPractice.addEventListener("click", () => {
        this.setMode("practice");
        this.handleUserSubmit("Generate a tricky edge case or problem variation to test my understanding.");
      });
    }

    if (this.teachingToggle) {
      this.teachingToggle.addEventListener("change", (e) => {
        const active = e.target.checked;
        this.appendMessage("system", active 
          ? "🔒 **Teaching Mode Activated**: Direct solutions are blocked. CodeMate will guide you via progressive Socratic hints." 
          : "🔓 **Teaching Mode Deactivated**: Direct solutions allowed upon request."
        );
      });
    }

    this.chipSolved.addEventListener("click", () => {
      this.triggerCelebration();
    });

    this.chipSolution.addEventListener("click", () => {
      this.openModal(this.solutionModal);
    });

    this.confirmRevealBtn.addEventListener("click", () => {
      this.closeModal(this.solutionModal);
      this.unlockedHintLevel = 4;
      this.updateStepperUI();
      this.requestHint(4);
    });

    // Modals Control
    this.storyBtn.addEventListener("click", () => this.openModal(this.storyModal));
    this.settingsBtn.addEventListener("click", () => this.openSettingsModal());
    this.engineStatusBtn.addEventListener("click", () => this.openSettingsModal());

    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modalId = e.currentTarget.dataset.close;
        const targetModal = document.getElementById(modalId);
        if (targetModal) this.closeModal(targetModal);
      });
    });

    // Settings Backend Selection
    document.querySelectorAll(".radio-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".radio-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        this.toggleSettingsFields(card.dataset.backend);
      });
    });

    this.saveSettingsBtn.addEventListener("click", () => {
      const selectedBackend = document.querySelector(".radio-card.selected")?.dataset.backend || "offline";
      this.aiService.saveConfig({
        backend: selectedBackend,
        ollamaUrl: document.getElementById("setting-ollama-url")?.value || "http://localhost:11434",
        ollamaModel: document.getElementById("setting-ollama-model")?.value || "gemma2:9b",
        apiKey: document.getElementById("setting-api-key")?.value || "",
        cloudModel: document.getElementById("setting-cloud-model")?.value || "gemma2-9b-it"
      });
      this.updateEngineUI();
      this.closeModal(this.settingsModal);
      this.appendMessage("system", `⚙️ Settings updated! Active engine: **${this.getEngineDisplayName()}**`);
    });
  }

  loadProblem(problemId) {
    const problem = DSA_PROBLEMS.find(p => p.id === problemId) || DSA_PROBLEMS[0];
    this.currentProblem = problem;
    this.unlockedHintLevel = 1;

    this.problemTitle.textContent = problem.title;
    this.problemDiff.textContent = problem.difficulty;
    this.problemDiff.className = `badge-diff ${problem.difficulty.toLowerCase().includes("easy") ? "easy" : "medium"}`;

    this.problemTags.innerHTML = problem.tags.map(t => `<span class="tag-pill">${t}</span>`).join(" ");
    this.problemDesc.innerHTML = marked.parse(problem.description);

    this.codeEditor.value = problem.starterCode;
    this.updateLineNumbers();
    this.updateStepperUI();
    this.runProactiveAnalysis(false);

    this.appendMessage("assistant", `### 🎯 Problem Loaded: ${problem.title}\n\nI'm proactively analyzing your C++ code on the left. Click **"Analyze My Approach"** or inspect the gutter markers anytime for Socratic feedback.\n\n*What part of the problem feels most challenging to start with?*`, "CodeMate");
  }

  /* --------------------------------------------------------------------------
     PROACTIVE SOCRATIC MENTOR METHODS
     -------------------------------------------------------------------------- */
  runProactiveAnalysis(isExplicit = false) {
    if (!this.codeAnalyzer) return;
    const result = this.codeAnalyzer.analyze(this.currentProblem.id, this.codeEditor.value);
    this.currentAnalysis = result;

    this.renderInlineMarkers(result.markers);
    this.updateLearningProgress(result);
    this.updateSuggestionCard(result);

    if (isExplicit) {
      const satisfiedInvariants = result.invariants.filter(i => i.satisfied).length;
      const primaryMarker = result.markers[0];

      let analysisReport = `### ⚡ Socratic Approach Analysis\n\n`;
      analysisReport += `**Focus:** ${result.conceptTitle} (${result.status})\n`;
      analysisReport += `**Conceptual Invariants:** ${satisfiedInvariants} of ${result.invariants.length} verified.\n\n`;

      if (primaryMarker) {
        analysisReport += `🔍 **Diagnostic Question (Line ${primaryMarker.line}):**\n> *"${primaryMarker.socraticQuestion}"*\n\n`;
        analysisReport += `💡 **Recommended Next Step:**\n${primaryMarker.suggestion}\n\n`;
      } else {
        analysisReport += `✨ **Great progress!** All targeted invariants for this phase are validated.\n\n`;
        analysisReport += `💡 **Recommended Next Step:**\n${result.nextStep}\n\n`;
      }

      analysisReport += `*(Full code solution is intentionally withheld to preserve your cognitive breakthrough!)*`;

      this.appendMessage("doctor", analysisReport, "CodeMate Mentor");
    }
  }

  renderInlineMarkers(markers) {
    if (!this.inlineMarkersGutter) return;
    this.inlineMarkersGutter.innerHTML = "";
    this.hideMarkerPopover();

    markers.forEach(m => {
      const markerEl = document.createElement("div");
      markerEl.className = `gutter-marker ${m.type || 'bug'}`;
      // Map marker line to vertical pixel offset (16px padding + line * ~22px)
      const topOffset = 16 + (m.line - 1) * 22;
      markerEl.style.top = `${topOffset}px`;
      
      const icon = m.type === "bug" ? "🐛" : (m.type === "complexity" ? "⚡" : "💡");
      markerEl.textContent = icon;
      markerEl.title = `Line ${m.line}: ${m.title} (Click for Socratic question)`;

      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showMarkerPopover(m, topOffset);
      });

      this.inlineMarkersGutter.appendChild(markerEl);
    });
  }

  showMarkerPopover(marker, topPx) {
    if (!this.markerPopover) return;
    this.markerPopover.style.top = `${topPx}px`;
    this.markerPopover.style.display = "block";
    this.markerPopover.innerHTML = `
      <div class="popover-header">
        <div class="popover-title">
          <span>${marker.type === 'bug' ? '🐛' : (marker.type === 'complexity' ? '⚡' : '💡')}</span>
          <span>Line ${marker.line}: ${marker.title}</span>
        </div>
        <button class="popover-close" id="popover-close-btn">&times;</button>
      </div>
      <div class="popover-question">
        ${marker.socraticQuestion}
      </div>
      <div class="popover-suggestion">
        <strong>Nudge:</strong> ${marker.suggestion}
      </div>
    `;

    document.getElementById("popover-close-btn")?.addEventListener("click", () => {
      this.hideMarkerPopover();
    });
  }

  hideMarkerPopover() {
    if (this.markerPopover) {
      this.markerPopover.style.display = "none";
    }
  }

  updateLearningProgress(result) {
    if (!this.learningProgressPanel) return;

    if (this.progressScoreVal) {
      this.progressScoreVal.textContent = `${result.progressScore}%`;
    }
    if (this.progressMiniFill) {
      this.progressMiniFill.style.width = `${result.progressScore}%`;
    }

    if (this.invariantsList) {
      this.invariantsList.innerHTML = result.invariants.map(inv => `
        <div class="invariant-item ${inv.satisfied ? 'satisfied' : 'pending'}">
          <div class="invariant-info">
            <span class="invariant-status-icon">${inv.satisfied ? '✓' : '○'}</span>
            <span>${inv.name}</span>
          </div>
          <span class="invariant-status-badge">${inv.satisfied ? 'Validated' : 'Pending'}</span>
        </div>
      `).join("");
    }

    if (this.attemptTrajectoryBadge) {
      this.attemptTrajectoryBadge.textContent = result.trajectoryNote;
    }
  }

  updateSuggestionCard(result) {
    if (!this.aiSuggestionCard) return;

    const primaryMarker = result.markers[0];
    if (this.suggestionFocus) {
      this.suggestionFocus.innerHTML = `Focus: <strong>${result.conceptTitle}</strong>`;
    }

    if (this.suggestionStatusPill) {
      if (result.status === "Optimal" || result.progressScore === 100) {
        this.suggestionStatusPill.className = "status-pill success";
        this.suggestionStatusPill.textContent = "All Invariants Met";
      } else {
        this.suggestionStatusPill.className = "status-pill warning";
        this.suggestionStatusPill.textContent = result.status;
      }
    }

    if (this.suggestionQuestion) {
      this.suggestionQuestion.textContent = primaryMarker 
        ? primaryMarker.socraticQuestion 
        : "Your current code successfully satisfies all core pedagogical invariants for this challenge.";
    }

    if (this.suggestionStepText) {
      this.suggestionStepText.textContent = primaryMarker ? primaryMarker.suggestion : result.nextStep;
    }
  }

  highlightLine(lineNum) {
    const lines = this.codeEditor.value.split('\n');
    let startPos = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
      startPos += lines[i].length + 1;
    }
    const endPos = startPos + (lines[lineNum - 1] ? lines[lineNum - 1].length : 0);

    this.codeEditor.focus();
    this.codeEditor.setSelectionRange(startPos, endPos);
    
    // Scroll textarea to line
    const approxLineHeight = 22;
    this.codeEditor.scrollTop = Math.max(0, (lineNum - 3) * approxLineHeight);
  }

  updateLineNumbers() {
    const lines = this.codeEditor.value.split("\n").length;
    this.lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
  }

  setMode(mode) {
    this.currentMode = mode;
    this.modeBtns.forEach(b => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });
  }

  onModeChange() {
    const modeNames = {
      hints: "💡 Progressive Hint Mode: Socratic questioning without spoiling the answer.",
      doctor: "🐛 Debug Mode: Targeted state and logic bug probing without code rewrites.",
      explain: "📖 Explain Mode: Plain English logic walkthrough, invariants, and Big-O analysis.",
      practice: "🎯 Practice Mode: Edge-case challenges and problem variations."
    };
    this.appendMessage("system", `Switched to **${modeNames[this.currentMode] || this.currentMode}**`);
  }

  updateStepperUI() {
    this.currentStepLabel.textContent = `Level ${this.unlockedHintLevel} of 4`;
    this.stepCards.forEach(card => {
      const lvl = parseInt(card.dataset.level, 10);
      card.classList.remove("active", "locked");
      if (lvl === this.unlockedHintLevel) {
        card.classList.add("active");
      } else if (lvl > this.unlockedHintLevel) {
        card.classList.add("locked");
      }
    });
  }

  async requestHint(level) {
    this.setMode("hints");
    this.unlockedHintLevel = level;
    this.updateStepperUI();

    await this.executeAI({
      mode: "hints",
      hintLevel: level,
      queryText: `Give me Hint Level ${level} for this problem.`
    });
  }

  async handleUserSubmit(overrideText = null) {
    const query = overrideText || this.chatInput.value.trim();
    if (!query && this.currentMode !== "doctor") return;

    if (!overrideText) {
      this.chatInput.value = "";
    }

    if (query) {
      this.appendMessage("user", query, "You (Rohan)");
    }

    // Phase 13 Killer Feature: Teaching Mode Safeguard
    if (this.teachingToggle && this.teachingToggle.checked) {
      const lower = query.toLowerCase();
      if ((lower.includes("give me the answer") || lower.includes("just give me the code") || lower.includes("write the solution")) && !query.includes("Hint Level 4")) {
        this.appendMessage("assistant", `🔒 **Teaching Mode is Active!**\n\nI won't give you the complete solution code yet—copy-pasting won't help you build the mental muscle for your coding interviews!\n\n💡 **Let's start with Hint 1:**\nThink about what happens to the state or last digit on each iteration.\n\n*What happens if you trace the first step on paper?*`, "CodeMate");
        return;
      }
    }

    await this.executeAI({
      mode: this.currentMode,
      hintLevel: this.unlockedHintLevel,
      queryText: query
    });
  }

  async executeAI({ mode, hintLevel, queryText }) {
    if (this.isLoading) return;
    this.isLoading = true;
    this.sendBtn.disabled = true;

    const loadingId = this.appendLoadingCard();

    try {
      const response = await this.aiService.sendQuery({
        mode,
        currentProblem: this.currentProblem,
        userCode: this.codeEditor.value,
        queryText,
        hintLevel,
        chatHistory: this.chatHistory
      });

      this.removeLoadingCard(loadingId);

      let cardType = "assistant";
      if (mode === "doctor") cardType = "doctor";
      if (mode === "interview") cardType = "interview";

      if (response.notice) {
        this.appendMessage("system", response.notice);
      }

      this.appendMessage(cardType, response.text, "CodeMate", response.modelUsed);
      this.chatHistory.push({ role: "assistant", content: response.text });
    } catch (err) {
      this.removeLoadingCard(loadingId);
      this.appendMessage("system", `❌ Error: ${err.message}`);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.chatInput.focus();
    }
  }

  appendMessage(type, content, author = "", modelTag = "") {
    const card = document.createElement("div");
    card.className = `message-card ${type}`;

    if (type === "system") {
      card.innerHTML = `<div class="msg-body" style="font-size: 0.85rem; color: #a5b4fc;">${marked.parse(content)}</div>`;
    } else {
      card.innerHTML = `
        <div class="msg-header">
          <div class="msg-author">
            <strong>${author}</strong>
            ${type === "doctor" ? "🩺 Code Doctor" : type === "interview" ? "🎯 Interviewer" : ""}
          </div>
          ${modelTag ? `<span class="msg-model-tag">${modelTag}</span>` : ""}
        </div>
        <div class="msg-body">${marked.parse(content)}</div>
      `;
    }

    this.chatStream.appendChild(card);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
  }

  appendLoadingCard() {
    const id = "loading-" + Date.now();
    const card = document.createElement("div");
    card.id = id;
    card.className = "message-card assistant";
    card.innerHTML = `
      <div class="msg-header">
        <div class="msg-author"><strong>CodeMate</strong> is reasoning...</div>
      </div>
      <div class="msg-body" style="color: var(--text-muted);">
        Analyzing C++ logic with Socratic constraints...
      </div>
    `;
    this.chatStream.appendChild(card);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
    return id;
  }

  removeLoadingCard(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  triggerCelebration() {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    this.appendMessage(
      "assistant",
      `### 🏆 Incredible Work, Rohan!\n\nYou tackled the problem through Socratic reasoning without relying on copy-paste code.\n\n- **Problem Solved:** ${this.currentProblem.title}\n- **Hints Leveraged:** Level ${this.unlockedHintLevel}\n- **Concept Fortified:** Self-debugged logic flow & invariants.\n\n*Ready to take on the next problem? Pick one from the top dropdown!*`,
      "CodeMate"
    );
  }

  renderInitialGreeting() {
    this.appendMessage(
      "assistant",
      `### 👋 Hey Rohan! Welcome to CodeMate.\n\nI won't give away full solutions. Instead, I'm here to give you **guided nudges** so you actually master C++ DSA for your campus interviews.\n\nTry clicking **"💡 Next Hint"** or **"🩺 Why is my loop stuck?"** below to get started!`,
      "CodeMate"
    );
  }

  updateEngineUI() {
    const backend = this.aiService.config.backend;
    if (backend === "ollama") {
      this.engineLabel.textContent = `Local Gemma 2 (${this.aiService.config.ollamaModel})`;
      this.engineStatusBtn.className = "btn-pill active-engine";
    } else if (backend === "groq") {
      this.engineLabel.textContent = `Cloud Gemma 2 (${this.aiService.config.cloudModel})`;
      this.engineStatusBtn.className = "btn-pill active-engine";
    } else {
      this.engineLabel.textContent = `Gemma 2 (Offline Demo Engine)`;
      this.engineStatusBtn.className = "btn-pill active-engine";
    }
  }

  getEngineDisplayName() {
    const b = this.aiService.config.backend;
    if (b === "ollama") return `Local Ollama (${this.aiService.config.ollamaModel})`;
    if (b === "groq") return `Cloud Open-Weights (${this.aiService.config.cloudModel})`;
    return "Offline Socratic Demo Engine";
  }

  openSettingsModal() {
    const b = this.aiService.config.backend;
    document.querySelectorAll(".radio-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.backend === b);
    });
    this.toggleSettingsFields(b);

    const ollamaUrl = document.getElementById("setting-ollama-url");
    if (ollamaUrl) ollamaUrl.value = this.aiService.config.ollamaUrl;
    const ollamaModel = document.getElementById("setting-ollama-model");
    if (ollamaModel) ollamaModel.value = this.aiService.config.ollamaModel;
    const apiKey = document.getElementById("setting-api-key");
    if (apiKey) apiKey.value = this.aiService.config.apiKey;
    const cloudModel = document.getElementById("setting-cloud-model");
    if (cloudModel) cloudModel.value = this.aiService.config.cloudModel;

    this.openModal(this.settingsModal);
  }

  toggleSettingsFields(backend) {
    const ollamaGroup = document.getElementById("ollama-settings-group");
    const cloudGroup = document.getElementById("cloud-settings-group");
    if (ollamaGroup) ollamaGroup.style.display = backend === "ollama" ? "block" : "none";
    if (cloudGroup) cloudGroup.style.display = backend === "groq" ? "block" : "none";
  }

  openModal(modal) {
    if (modal) modal.classList.add("open");
  }

  closeModal(modal) {
    if (modal) modal.classList.remove("open");
  }
}

// Initialize on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  new CodeMateApp();
});
