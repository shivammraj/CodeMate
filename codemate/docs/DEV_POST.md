---
title: I Built CodeMate for My Friend Who Was Drowning in C++ and LeetCode
published: false
tags: devchallenge, buildforafriend, webdev, ai, cpp
---

# I Built CodeMate for My Friend Who Was Drowning in C++ and LeetCode

## 1. The Friend
My friend Rohan was preparing for upcoming campus placement technical rounds. Every day was the same routine:
1. Open LeetCode.
2. Read a problem on Two Pointers, Linked Lists, or Trees.
3. Get stuck for 15 minutes.
4. Open ChatGPT, paste the problem, and get a 40-line optimal C++ solution.
5. Copy-paste into LeetCode, get "Accepted", feel productive.

The crisis came two weeks later during a mock technical interview: when asked to solve the exact same Palindrome and Two-Sum variants on a plain whiteboard without internet, Rohan completely froze. He hadn't built the **mental muscle** to deduce the solution from first principles.

---

## 2. The Problem
Current AI coding tools act like an overeager tutor who grabs the pencil out of your hand and solves the homework for you.
- They blurt out the answer immediately.
- They rob the learner of the productive struggle ("the AHA! moment").
- They depend entirely on cloud APIs, exposing private code and requiring subscriptions.

---

## 3. The Idea: CodeMate
What if AI acted like a patient professor sitting next to you?
- **Core Axiom**: *Don't give me the answer. Teach me how to reach it.*
- **Progressive Scaffolding**: Deliver hints in 4 discrete tiers:
  1. *Mental Model & Analogy*
  2. *Algorithmic Direction & STL Container*
  3. *Structural Pseudocode*
  4. *Full Solution (Only upon explicit confirmation)*
- **Code Doctor**: Highlight suspicious lines and ask diagnostic questions instead of rewriting the code.
- **100% Local & Private**: Powered by local open-weight models (`Qwen2.5-Coder` / `Llama 3.2`) via Ollama. No data leaves your machine.

---

## 4. How It Works & Architecture
CodeMate pairs a lightweight frontend with a local FastAPI backend and Ollama:

```
[React / Vite Editor] ◄──► [FastAPI Socratic Router] ◄──► [Local Ollama (Qwen2.5)]
```

When Rohan asks: *"How do I check if a linked list has a cycle?"*
Instead of:
```cpp
// Here is the complete Floyd's Cycle-Finding Algorithm...
```
CodeMate responds:
> *"Think about a circular track. If one runner runs at speed 1 and another at speed 2, what eventually happens? How could you represent those two runners using pointers in C++?"*

---

## 5. What Rohan Said
I handed CodeMate to Rohan on his laptop and watched him tackle a problem with deliberate bugs.
> *"At first, not getting the code right away made me anxious. But by Hint 2, I realized I needed a fast and slow pointer myself. When the test passed, I actually understood why it worked."*

---

## 6. How to Run Locally
```bash
# 1. Clone repository
git clone https://github.com/your-username/codemate.git
cd codemate

# 2. Run frontend
npm run dev

# 3. (Optional) Run backend with Ollama
cd backend
pip install -r requirements.txt
python main.py
```
