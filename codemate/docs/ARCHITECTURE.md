# CodeMate Architecture Specification

> **A local, privacy-first Socratic AI coding mentor built for a friend learning C++ and DSA.**

---

## 1. System Overview

CodeMate is engineered around a single core pedagogy: **Never blurt out the answer; guide the student to reach it through Socratic reasoning.**

```
                        ┌──────────────────────────────┐
                        │      Browser Client (UI)     │
                        │   • C++ Editor + Diagnostics │
                        │   • 4-Tier Scaffolding       │
                        │   • "Don't Give Answer" Mode │
                        └──────────────┬───────────────┘
                                       │
                      REST API Calls   │ (JSON)
                                       ▼
                        ┌──────────────────────────────┐
                        │    FastAPI Gateway (:8000)   │
                        │   • Mode & Prompt Router     │
                        │   • Strict Socratic Guard    │
                        │   • Zero-Leakage Filter      │
                        └──────────────┬───────────────┘
                                       │
                     Local HTTP (:11434)
                                       ▼
                        ┌──────────────────────────────┐
                        │     Local Ollama Instance    │
                        │   • Qwen2.5-Coder / Gemma 2  │
                        │   • 100% Offline Inference   │
                        │   • Zero Cloud Leakage       │
                        └──────────────────────────────┘
```

---

## 2. Component Breakdown

### A. Frontend (React / Vite)
- **Path**: `codemate/frontend/`
- **Responsibilities**:
  - Live C++ code editor with line numbering and bug diagnostics.
  - Interactive progressive hint ladder (Steps 1 to 4).
  - Mode switcher: `Hint Mode`, `Code Doctor`, `Explain`, `Practice`.
  - Privacy status indicator: `🟢 100% Local AI (No Cloud API Required)`.

### B. Backend (Python + FastAPI)
- **Path**: `codemate/backend/`
- **Responsibilities**:
  - Manages prompt engineering templates (`prompts.py`).
  - Connects to local Ollama via high-performance async HTTP (`httpx`).
  - Socratic Safeguard: Intercepts responses in Hint mode to guarantee code solutions are withheld.
  - Fallback Engine: Provides instant heuristic guidance if Ollama is starting or downloading models.

### C. AI Engine (Ollama)
- **Host**: `http://localhost:11434`
- **Recommended Open-Weight Models**:
  - `qwen2.5-coder:7b` (Optimal for C++ and algorithmic nuance)
  - `llama3.2:3b` (Ultra-fast CPU inference on 16GB RAM)
  - `gemma2:2b` (Compact, lightweight open weights)

---

## 3. The 4-Tier Socratic Scaffolding Ladder

```
[Level 1: Mental Model] ──► Physical analogy / pattern identification
         │
         ▼
[Level 2: Direction]    ──► STL container recommendation & edge-case warning
         │
         ▼
[Level 3: Pseudocode]   ──► Loop invariants & structural skeleton
         │
         ▼
[Level 4: Full Reveal]  ──► Unlocked ONLY upon explicit user confirmation
```
