# 🧑‍💻 CodeMate

> **A local, privacy-first AI coding mentor built for a friend learning C++ & Data Structures and Algorithms.**  
> Built for the DEV **"Build for a Friend"** Challenge.

---

## 🎯 The Philosophy
> **"Don't give me the answer. Teach me how to reach it."**

Current AI tools immediately output 50 lines of finished code, robbing learners of the cognitive struggle required to pass technical interviews. CodeMate is built to guide students through Socratic questioning, physical analogies, and progressive hints.

---

## ✨ Features
1. **Proactive Socratic Code Analysis**:
   - Analyzes student code invariants in real-time.
   - Highlights suspicious lines with subtle inline gutter markers (`🐛`, `⚡`, `💡`).
   - Identifies misconceptions and recommends the next conceptual step without revealing the code.
2. **Socratic Hint Mode (4-Tier Scaffolding)**:
   - Level 1: Mental Model & Analogy
   - Level 2: Algorithmic Direction & STL Containers
   - Level 3: Structural Pseudocode
   - Level 4: Full Solution (Locked until explicitly revealed)
3. **Conceptual Invariants Mastery Panel**: Real-time progress tracker verifying loop termination, pointer safety, and edge-case guards.
4. **Code Doctor**: Points out suspicious line numbers and edge-case invariants without rewriting the code.
5. **Code Explainer**: Breaks down complex algorithms into beginner-friendly steps with Big-O analysis.
6. **Practice Generator**: Creates subtle problem variations to test true understanding.
7. **100% Local Privacy**: Runs entirely on your machine via local Ollama models with zero external cloud dependencies.

---

## 🏗️ Architecture

```
[React / Vite Frontend] ◄──► [FastAPI Backend] ◄──► [Local Ollama (Qwen2.5 / Gemma 2)]
```

---

## 🚀 Quickstart

### 1. Run Frontend
```bash
# In the repository root:
npm run dev
# Or inside codemate/frontend:
cd codemate/frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Optional: Run Local Backend with Ollama
```bash
# In backend directory:
cd codemate/backend
pip install -r requirements.txt
python main.py
```

### 3. Setup Ollama (Local AI Model)
```bash
# Install Ollama and pull an open-weight model:
ollama pull qwen2.5-coder:7b
# or lightweight for CPU:
ollama pull llama3.2:3b
```
