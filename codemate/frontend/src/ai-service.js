/**
 * CodeMate AI Engine
 * Specialized in Socratic DSA Pedagogy using Open-Weight Gemma 2
 */

export const GEMMA_SOCRATIC_SYSTEM_PROMPT = `You are CodeMate, a specialized Socratic AI DSA & C++ coding mentor built for students (like Rohan) who get stuck on LeetCode problems.

CRITICAL MENTORSHIP RULES:
1. NEVER blurt out the complete working solution code right away. That robs the student of the mental breakthrough.
2. Guide through the Socratic method: Ask leading questions, offer physical analogies, and encourage them to reason about line-by-line state.
3. If the user is in "Progressive Hint" mode:
   - Hint Level 1: Mental model, physical analogy, high-level pattern (e.g., Two Pointers, Hash Table, Stack).
   - Hint Level 2: Algorithmic direction, edge-case warning, or C++ STL container advice.
   - Hint Level 3: Pseudocode structure and logic checkpoints.
   - Level 4 (Only if explicitly confirmed "Reveal Solution"): Show the optimal C++ solution with detailed Time/Space complexity analysis.
4. If in "Code Doctor / Logic Bug" mode:
   - Do NOT rewrite their code for them.
   - Point out the suspicious line numbers or loops and ask what happens to variable values across iterations.
   - Highlight potential C++ pitfalls like integer overflow, infinite loops, empty stack access, or dangling pointers.
5. If in "Mock Interviewer" mode:
   - Evaluate their current approach's Big-O time and space complexity.
   - Challenge them with edge cases (empty inputs, negative numbers, duplicates).
   - Ask them how they would optimize if memory or time was constrained.
6. Tone: Friendly, encouraging, concise, technical yet accessible. Use markdown formatting and bold keywords.`;

export class CodeMateAIService {
  constructor() {
    this.config = {
      backend: localStorage.getItem("codemate_backend") || "offline", // "ollama" | "groq" | "custom" | "offline"
      ollamaUrl: localStorage.getItem("codemate_ollama_url") || "http://localhost:11434",
      ollamaModel: localStorage.getItem("codemate_ollama_model") || "gemma2:9b",
      apiKey: localStorage.getItem("codemate_api_key") || "",
      cloudModel: localStorage.getItem("codemate_cloud_model") || "gemma2-9b-it",
      customEndpoint: localStorage.getItem("codemate_custom_endpoint") || "https://api.groq.com/openai/v1"
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("codemate_backend", this.config.backend);
    localStorage.setItem("codemate_ollama_url", this.config.ollamaUrl);
    localStorage.setItem("codemate_ollama_model", this.config.ollamaModel);
    localStorage.setItem("codemate_api_key", this.config.apiKey);
    localStorage.setItem("codemate_cloud_model", this.config.cloudModel);
    localStorage.setItem("codemate_custom_endpoint", this.config.customEndpoint);
  }

  async sendQuery({ mode, currentProblem, userCode, queryText, hintLevel, chatHistory = [] }) {
    if (this.config.backend === "ollama") {
      return this._queryOllama({ mode, currentProblem, userCode, queryText, hintLevel, chatHistory });
    } else if (this.config.backend === "groq" || this.config.backend === "custom") {
      return this._queryCloud({ mode, currentProblem, userCode, queryText, hintLevel, chatHistory });
    } else {
      return this._queryOfflineSimulator({ mode, currentProblem, userCode, queryText, hintLevel });
    }
  }

  // --- Local Ollama Integration (gemma2) ---
  async _queryOllama({ mode, currentProblem, userCode, queryText, hintLevel, chatHistory }) {
    const prompt = this._buildPrompt({ mode, currentProblem, userCode, queryText, hintLevel });
    const messages = [
      { role: "system", content: GEMMA_SOCRATIC_SYSTEM_PROMPT },
      ...chatHistory.slice(-4),
      { role: "user", content: prompt }
    ];

    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.ollamaModel,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.4
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama connection error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.message?.content || "No response received from local Gemma 2 model.",
        modelUsed: `Local Ollama (${this.config.ollamaModel})`,
        provider: "Local Open-Weights"
      };
    } catch (err) {
      console.warn("Ollama failed, falling back to Socratic offline engine:", err);
      const fallback = await this._queryOfflineSimulator({ mode, currentProblem, userCode, queryText, hintLevel });
      return {
        ...fallback,
        notice: `⚠️ Could not reach Ollama at ${this.config.ollamaUrl}. Ensure Ollama is running ('ollama run ${this.config.ollamaModel}'). Showing CodeMate Socratic response:`
      };
    }
  }

  // --- Cloud Open-Weights (Groq / OpenRouter / HuggingFace with Gemma 2) ---
  async _queryCloud({ mode, currentProblem, userCode, queryText, hintLevel, chatHistory }) {
    if (!this.config.apiKey) {
      console.warn("No API key provided. Using Offline Socratic simulation.");
      const fallback = await this._queryOfflineSimulator({ mode, currentProblem, userCode, queryText, hintLevel });
      return {
        ...fallback,
        notice: `💡 No Groq/Custom API key configured. Switch to Local Ollama or add an API key in Settings. Showing CodeMate response:`
      };
    }

    const endpoint = this.config.customEndpoint.endsWith("/chat/completions") 
      ? this.config.customEndpoint 
      : `${this.config.customEndpoint.replace(/\/+$/, '')}/chat/completions`;

    const prompt = this._buildPrompt({ mode, currentProblem, userCode, queryText, hintLevel });
    const messages = [
      { role: "system", content: GEMMA_SOCRATIC_SYSTEM_PROMPT },
      ...chatHistory.slice(-4),
      { role: "user", content: prompt }
    ];

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.cloudModel,
          messages: messages,
          temperature: 0.4,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "No response content.";
      return {
        text: content,
        modelUsed: `Cloud Open-Weights (${this.config.cloudModel})`,
        provider: "Open-Weights Gemma 2"
      };
    } catch (err) {
      console.warn("Cloud query failed, falling back to simulator:", err);
      const fallback = await this._queryOfflineSimulator({ mode, currentProblem, userCode, queryText, hintLevel });
      return {
        ...fallback,
        notice: `⚠️ Cloud request failed (${err.message}). Showing CodeMate Socratic response:`
      };
    }
  }

  // --- Offline Socratic Simulation Engine ---
  async _queryOfflineSimulator({ mode, currentProblem, userCode, queryText, hintLevel }) {
    // Artificial slight delay for realistic typing feel
    await new Promise(r => setTimeout(r, 600));

    // 1. If problem is in catalog and asking for progressive hints
    if (mode === "hints" && currentProblem?.hints) {
      const targetHint = currentProblem.hints.find(h => h.level === hintLevel) || currentProblem.hints[0];
      return {
        text: `### 💡 ${targetHint.title} (Level ${targetHint.level}/4)\n\n${targetHint.content}`,
        modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
        provider: "Open-Weights Socratic Core"
      };
    }

    // 2. Code Doctor mode
    if (mode === "doctor") {
      // Analyze user code for typical mistakes
      if (userCode.includes("temp > 0") && !userCode.includes("temp /=")) {
        return {
          text: `### 🩺 Code Doctor Diagnostic\n\n**Potential Infinite Loop Detected on \`while (temp > 0)\`**\n\nTake a close look at your loop:\n\`\`\`cpp\nwhile (temp > 0) {\n    reversed = reversed * 10 + (temp % 10);\n    // temp is never reduced!\n}\n\`\`\`\n\n**Socratic Question:**\nIf \`temp\` starts as \`121\`, what value does \`temp\` hold on iteration 2? And iteration 100?  \n👉 *What operation will remove the rightmost digit from \`temp\` in each iteration so it eventually reaches 0?*`,
          modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
          provider: "Open-Weights Socratic Core"
        };
      }

      if (userCode.includes("curr->next = prev") && userCode.includes("curr = curr->next")) {
        return {
          text: `### 🩺 Code Doctor Diagnostic\n\n**Pointers Overwrite / Pointer Cycle Warning**\n\nLook at this sequence in your loop:\n\`\`\`cpp\ncurr->next = prev; // You just pointed curr backward!\nprev = curr;\ncurr = curr->next; // You're now jumping to prev instead of the forward node!\n\`\`\`\n\n**Socratic Question:**\nOnce you overwrite \`curr->next\`, how can you ever reach the next node in the original list?  \n👉 *How could a temporary pointer (\`nextTemp\`) bookmark the next node before you cut the wire?*`,
          modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
          provider: "Open-Weights Socratic Core"
        };
      }

      if (userCode.includes("st.top()") && !userCode.includes("st.empty()")) {
        return {
          text: `### 🩺 Code Doctor Diagnostic\n\n**Unchecked Stack Access (Potential Crash / SigFault)**\n\nLook at your closing bracket branch:\n\`\`\`cpp\nchar top = st.top();\nst.pop();\n\`\`\`\n\n**Socratic Question:**\nWhat happens if the input string is \`")"\` or \`"}{"\`?  \nIn C++, what does the standard say happens when you call \`st.top()\` or \`st.pop()\` on an empty \`std::stack\`?  \n👉 *What condition must you verify before touching the top of the stack?*`,
          modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
          provider: "Open-Weights Socratic Core"
        };
      }

      return {
        text: `### 🩺 Code Doctor Diagnostic\n\nI reviewed your C++ logic. Here are 3 targeted questions to check:\n\n1. **Loop Termination:** Trace your loop with the smallest possible test case. Are all loop variables moving strictly towards their exit condition?\n2. **Boundary Values:** What happens if the input is \`0\`, negative, empty, or size 1?\n3. **Memory & Types:** Are you modifying pointers or values in an order that might overwrite data you need later?\n\n*Tell me which line feels most uncertain to you, and we'll break down the state step-by-step!*`,
        modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
        provider: "Open-Weights Socratic Core"
      };
    }

    // 3. Visual Concept Breakdown mode
    if (mode === "visual") {
      return {
        text: `### 🧠 Mental Model & State Simulation\n\nLet's trace how the digits or pointers move for **${currentProblem?.title || "your problem"}**:\n\n\`\`\`text\nInitial State:  [x = 121]  |  [reversed = 0]\n------------------------------------------------\nStep 1: Extract (121 % 10 = 1)\n        Build:  reversed = (0 * 10) + 1  => 1\n        Chop:   121 / 10 => 12\n\nStep 2: Extract (12 % 10 = 2)\n        Build:  reversed = (1 * 10) + 2  => 12\n        Chop:   12 / 10 => 1\n\nStep 3: Extract (1 % 10 = 1)\n        Build:  reversed = (12 * 10) + 1 => 121\n        Chop:   1 / 10 => 0 (Loop ends!)\n\nFinal Check: 121 == 121 -> TRUE!\n\`\`\`\n\nSee how \`reversed\` builds from left to right while the original number sheds digits from right to left?`,
        modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
        provider: "Open-Weights Socratic Core"
      };
    }

    // 4. Mock Interviewer mode
    if (mode === "interview") {
      return {
        text: `### 🎯 Mock DSA Interviewer Probe\n\nGood attempt! Let's analyze your solution from an interviewer's lens:\n\n1. **Complexity Check:**\n   - What is the precise **Time Complexity** of your approach? Is it $O(N)$ or $O(N^2)$?\n   - What is the **Space Complexity**? Are you allocating extra buffers or modifying in-place?\n\n2. **Constraint Stress-Testing:**\n   - What happens if the input is at the extreme limit (e.g. $2^{31} - 1$ or negative)?\n   - Can an integer overflow occur during the arithmetic operations in C++?\n\n3. **Optimization Challenge:**\n   - Can we solve this problem by processing **only half** of the input rather than the entire data structure?\n\n*How would you defend your time complexity to an interviewer?*`,
        modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
        provider: "Open-Weights Socratic Core"
      };
    }

    // Default conversational reply
    return {
      text: `### 💡 CodeMate Response\n\nYou asked: *"${queryText}"*\n\nLet's break this down together. Before writing more code:\n- What is the simplest input case you can test by hand?\n- What invariant needs to remain true after every iteration of your logic?\n\nLet's solve it step by step. What do you think the first action should be?`,
      modelUsed: "Gemma 2 Socratic Engine (Offline Demo)",
      provider: "Open-Weights Socratic Core"
    };
  }

  _buildPrompt({ mode, currentProblem, userCode, queryText, hintLevel }) {
    return `Current Problem: ${currentProblem?.title || "Custom Problem"}
Problem Description:
${currentProblem?.description || "Not provided"}

Current Student's C++ Code:
\`\`\`cpp
${userCode || "// No code entered yet"}
\`\`\`

Active Mode: ${mode}
Requested Hint Level: ${hintLevel}
Student's Question/Input: ${queryText || "Guide me through this problem using Socratic hints."}`;
  }
}
