import os
import json
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from prompts import (
    SYSTEM_BASE_SOCRATIC,
    HINT_SYSTEM_PROMPTS,
    DEBUG_SYSTEM_PROMPT,
    EXPLAIN_SYSTEM_PROMPT,
    PRACTICE_SYSTEM_PROMPT,
)

app = FastAPI(
    title="CodeMate Backend API",
    description="Socratic Local AI Mentor API for C++ & DSA",
    version="1.0.0"
)

# Enable CORS for local Vite dev frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")


class ChatMessage(BaseModel):
    role: str
    content: str


class ProblemContext(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "Custom Problem"
    difficulty: Optional[str] = "Medium"
    description: Optional[str] = ""
    starterCode: Optional[str] = ""


class QueryRequest(BaseModel):
    mode: str = Field(default="hints", description="hints | doctor | explain | practice")
    currentProblem: Optional[ProblemContext] = None
    userCode: Optional[str] = ""
    queryText: Optional[str] = ""
    hintLevel: int = Field(default=1, ge=1, le=4)
    chatHistory: List[ChatMessage] = []
    preferredModel: Optional[str] = None


@app.get("/api/health")
async def health_check():
    """Checks Ollama connection status and returns available models."""
    ollama_online = False
    available_models = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OLLAMA_HOST}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                ollama_online = True
                available_models = [m.get("name") for m in data.get("models", [])]
    except Exception:
        ollama_online = False

    return {
        "status": "healthy",
        "ollamaOnline": ollama_online,
        "ollamaHost": OLLAMA_HOST,
        "models": available_models,
        "recommendedModels": ["qwen2.5-coder:7b", "llama3.2:3b", "gemma2:2b", "qwen2.5:3b"]
    }


@app.get("/api/models")
async def get_models():
    """Retrieve list of locally installed Ollama models."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_HOST}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                return {"models": data.get("models", [])}
    except Exception as e:
        return {"models": [], "error": str(e)}


@app.post("/api/chat")
async def chat_endpoint(req: QueryRequest):
    """Processes mentorship queries using Socratic mode prompts and local Ollama."""
    system_instruction = build_system_instruction(req.mode, req.hintLevel)
    user_prompt = build_user_prompt(req)

    messages = [{"role": "system", "content": system_instruction}]
    for msg in req.chatHistory[-4:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": user_prompt})

    model_to_use = req.preferredModel or DEFAULT_MODEL

    # Attempt local Ollama inference
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": model_to_use,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.3
                    }
                }
            )
            if resp.status_code == 200:
                result = resp.json()
                content = result.get("message", {}).get("content", "")
                return {
                    "text": content,
                    "modelUsed": f"Local Ollama ({model_to_use})",
                    "mode": req.mode,
                    "isFallback": False
                }
    except Exception as err:
        # Fallback to local heuristic engine if Ollama is unreachable
        fallback_text = generate_socratic_fallback(req)
        return {
            "text": fallback_text,
            "modelUsed": "CodeMate Offline Pedagogical Engine",
            "mode": req.mode,
            "isFallback": True,
            "notice": f"Ollama not detected at {OLLAMA_HOST}. Showing CodeMate's built-in Socratic guidance."
        }


def build_system_instruction(mode: str, hint_level: int) -> str:
    base = SYSTEM_BASE_SOCRATIC + "\n\n"
    if mode == "hints":
        base += HINT_SYSTEM_PROMPTS.get(hint_level, HINT_SYSTEM_PROMPTS[1])
    elif mode == "doctor":
        base += DEBUG_SYSTEM_PROMPT
    elif mode == "explain":
        base += EXPLAIN_SYSTEM_PROMPT
    elif mode == "practice":
        base += PRACTICE_SYSTEM_PROMPT
    return base


def build_user_prompt(req: QueryRequest) -> str:
    problem_info = ""
    if req.currentProblem:
        problem_info = f"Problem: {req.currentProblem.title} ({req.currentProblem.difficulty})\nDescription: {req.currentProblem.description}\n"

    code_info = ""
    if req.userCode:
        code_info = f"\nCurrent C++ Code:\n```cpp\n{req.userCode}\n```\n"

    query_info = f"User Question/Struggle: {req.queryText or 'I need guidance on this code/problem.'}"
    return f"{problem_info}{code_info}\n{query_info}"


def generate_socratic_fallback(req: QueryRequest) -> str:
    """Built-in deterministic Socratic mentor when Ollama is offline."""
    p_title = req.currentProblem.title if req.currentProblem else "this problem"
    
    if req.mode == "hints":
        hints_map = {
            1: f"💡 **Step 1: The Core Mental Model for {p_title}**\n\nBefore writing code, visualize the problem physically:\n- Are we searching, partitioning, or tracking elements over time?\n- If brute force checks all pairs in $O(N^2)$, what invariant or previous state can we remember in $O(1)$?\n\n*Question for you:* What is the simplest example input, and how would you solve it with pen and paper?",
            2: f"💡 **Step 2: Algorithmic Direction & State Invariant**\n\nThink about the transitions:\n- If you need fast lookups, which C++ STL container gives $O(1)$ average search?\n- If using pointers, what condition determines when left moves vs right moves?\n- Watch out for edge cases: empty input, duplicate values, and integer overflow.",
            3: f"💡 **Step 3: Pseudocode Structure**\n\n```text\nInitialize state (pointers, hash map, or stack)\nWhile condition holds:\n    Inspect current element\n    If target condition met: return answer / update best\n    Else: transition state variables\n```\nTry translating this into C++ syntax using your own logic!",
            4: f"🔓 **Full Solution & Analysis**\n\nMake sure you've worked through the hints first! Check the Solution modal to reveal the optimal C++ implementation with Big-O complexity breakdown."
        }
        return hints_map.get(req.hintLevel, hints_map[1])

    elif req.mode == "doctor":
        return f"🔍 **Code Doctor Inspection for {p_title}**\n\nI scanned your C++ code. Let's trace it carefully without spoiling the fix:\n1. Look at your loop termination conditions: is there a risk of an off-by-one (`<=` vs `<`) or out-of-bounds index?\n2. Check your variable initialization: are all accumulators or pointers reset before each run?\n3. What happens if the input has size 0 or 1?\n\n*Diagnostic challenge:* Trace your inner loop with input `[1, 2]` on paper. Where does execution jump?"

    elif req.mode == "explain":
        return f"📖 **Code Breakdown: {p_title}**\n\n- **Objective**: Solve {p_title} efficiently within memory limits.\n- **Key Mechanics**: Maintains state across elements to avoid recalculating work.\n- **Complexity**: Aiming for $O(N)$ Time and $O(1)$ or $O(N)$ Space.\n- **C++ Tip**: Always pass large collections like `std::vector` by `const &` to avoid costly copies!"

    elif req.mode == "practice":
        return f"🎯 **Follow-Up Challenge for {p_title}**\n\n1. What if the input array could contain negative numbers or duplicates?\n2. What if memory is strictly constrained to $O(1)$ additional space?\nHow would you adapt your approach?"

    return "Let's break this down step-by-step. What specific line or concept is confusing you?"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
