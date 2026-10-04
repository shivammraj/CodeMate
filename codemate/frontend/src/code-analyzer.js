/**
 * CodeMate Socratic Code Analyzer
 * Proactively inspects student C++ code to provide:
 * 1. Line-specific Socratic markers (gutter badges & warnings)
 * 2. Conceptual invariants validation
 * 3. Misconception detection across iterative attempts
 * 4. Next recommended conceptual step (NO SPOILERS)
 */

export class CodeAnalyzer {
  constructor() {
    this.attemptHistory = [];
  }

  /**
   * Record an attempt to track student learning trajectory
   */
  recordAttempt(problemId, code) {
    this.attemptHistory.push({
      timestamp: Date.now(),
      problemId,
      code,
      linesCount: code.split('\n').length
    });
  }

  /**
   * Perform comprehensive Socratic analysis of the current code
   */
  analyze(problemId, code) {
    this.recordAttempt(problemId, code);
    const lines = code.split('\n');

    let analysisResult = null;
    switch (problemId) {
      case "palindrome-number":
        analysisResult = this.analyzePalindrome(lines, code);
        break;
      case "two-sum":
        analysisResult = this.analyzeTwoSum(lines, code);
        break;
      case "reverse-linked-list":
        analysisResult = this.analyzeReverseList(lines, code);
        break;
      case "valid-parentheses":
        analysisResult = this.analyzeValidParentheses(lines, code);
        break;
      default:
        analysisResult = this.analyzeGenericCpp(lines, code);
        break;
    }

    // Enhance with attempt-based trajectory analysis
    analysisResult.attemptCount = this.attemptHistory.filter(a => a.problemId === problemId).length;
    analysisResult.trajectoryNote = this.calculateTrajectory(analysisResult.attemptCount, analysisResult.invariants);

    return analysisResult;
  }

  /* --------------------------------------------------------------------------
     1. PALINDROME NUMBER ANALYSIS
     -------------------------------------------------------------------------- */
  analyzePalindrome(lines, code) {
    const markers = [];
    const invariants = [
      { id: "neg_guard", name: "Negative Number Invariant", description: "Negative integers can never be palindromes due to leading '-'", satisfied: false },
      { id: "loop_progress", name: "Loop Termination Invariant", description: "Input or temp variable must be reduced by / 10 inside while loop", satisfied: false },
      { id: "overflow_safety", name: "Integer Overflow Invariant", description: "Reversing a 32-bit int can exceed INT_MAX; needs long long or half-reversal", satisfied: false },
      { id: "clean_comparison", name: "Comparison Invariant", description: "Compares reversed value against preserved original input", satisfied: false }
    ];

    let hasNegativeGuard = false;
    let hasLoopReduction = false;
    let hasWhileLoop = false;
    let whileLineNumber = -1;
    let reversedVarName = "reversed";

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Check negative check
      if (trimmed.includes("x < 0") || (trimmed.includes("if") && trimmed.includes("< 0"))) {
        hasNegativeGuard = true;
        invariants[0].satisfied = true;
      }

      // Check while loop
      if (trimmed.startsWith("while") && (trimmed.includes("temp > 0") || trimmed.includes("x > 0") || trimmed.includes("> 0"))) {
        hasWhileLoop = true;
        whileLineNumber = lineNum;
      }

      // Check reduction inside loop
      if (trimmed.includes("temp /= 10") || trimmed.includes("temp = temp / 10") || trimmed.includes("x /= 10") || trimmed.includes("x = x / 10")) {
        hasLoopReduction = true;
        invariants[1].satisfied = true;
      }

      // Check long long or half reversal
      if (trimmed.includes("long long") || (trimmed.includes("reversedHalf") || (hasWhileLoop && trimmed.includes("x >")))) {
        invariants[2].satisfied = true;
      }

      // Check return statement
      if (trimmed.startsWith("return") && (trimmed.includes("==") || trimmed.includes("reversed"))) {
        invariants[3].satisfied = true;
      }
    });

    // Detect missing temp reduction (Infinite Loop)
    if (hasWhileLoop && !hasLoopReduction) {
      const targetLine = whileLineNumber !== -1 ? whileLineNumber + 1 : 15;
      markers.push({
        line: targetLine,
        type: "bug",
        title: "Potential Infinite Loop",
        socraticQuestion: "In your while loop, does the loop condition variable ever change its value between iterations?",
        suggestion: "Observe what happens to `temp` on each cycle. How do you shave off the extracted digit?"
      });
    }

    // Detect missing negative guard
    if (!hasNegativeGuard) {
      markers.push({
        line: 8,
        type: "invariant",
        title: "Edge Case Invariant",
        socraticQuestion: "What should `isPalindrome(-121)` return? When reading backwards, `-121` becomes `121-`.",
        suggestion: "Consider whether negative numbers can ever be palindromic."
      });
    }

    // Identify detected misconceptions
    const misconceptions = [];
    if (hasWhileLoop && !hasLoopReduction) {
      misconceptions.push({
        concept: "Loop Invariant Misconception",
        detail: "Extracting digits via `% 10` does NOT automatically mutate or shrink the number. In C++, integer division (`/= 10`) is required to discard the processed digit."
      });
    }

    // Compute progress score
    const satisfiedCount = invariants.filter(i => i.satisfied).length;
    const progressScore = Math.round((satisfiedCount / invariants.length) * 100);

    return {
      conceptTitle: "Digit Extraction & Reversal Invariants",
      status: satisfiedCount === invariants.length ? "Optimal" : (hasWhileLoop && !hasLoopReduction ? "Action Required" : "In Progress"),
      progressScore,
      invariants,
      markers,
      misconceptions,
      nextStep: !hasLoopReduction 
        ? "Address the loop termination condition so your algorithm advances to the next digit without freezing."
        : (!hasNegativeGuard ? "Add a fast-exit guard for negative values." : "Analyze the time and space complexity of your approach.")
    };
  }

  /* --------------------------------------------------------------------------
     2. TWO SUM ANALYSIS
     -------------------------------------------------------------------------- */
  analyzeTwoSum(lines, code) {
    const markers = [];
    const invariants = [
      { id: "complement_math", name: "Complement Arithmetic", description: "Target sum relationship: complement = target - nums[i]", satisfied: false },
      { id: "lookup_efficiency", name: "O(1) Lookup Container", description: "Utilizes std::unordered_map instead of nested O(N) array scanning", satisfied: false },
      { id: "single_pass", name: "Single-Pass Construction", description: "Builds hash map dynamically on the fly to avoid element self-pairing", satisfied: false },
      { id: "index_pair", name: "Index Return Pair", description: "Returns indices {saved_index, current_i} rather than values", satisfied: false }
    ];

    let hasNestedLoop = false;
    let hasUnorderedMap = false;
    let hasComplement = false;
    let innerLoopLine = -1;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (trimmed.includes("for") && trimmed.includes("j = i + 1")) {
        hasNestedLoop = true;
        innerLoopLine = lineNum;
      }
      if (trimmed.includes("unordered_map")) {
        hasUnorderedMap = true;
        invariants[1].satisfied = true;
      }
      if (trimmed.includes("target - nums[i]") || trimmed.includes("target -") || trimmed.includes("complement")) {
        hasComplement = true;
        invariants[0].satisfied = true;
      }
      if (trimmed.includes("return {") || trimmed.includes("return {i,") || trimmed.includes("return {numMap[")) {
        invariants[3].satisfied = true;
      }
    });

    if (hasNestedLoop && !hasUnorderedMap) {
      markers.push({
        line: innerLoopLine !== -1 ? innerLoopLine : 10,
        type: "complexity",
        title: "Quadratic Time Complexity (O(N²))",
        socraticQuestion: "For every element, your inner loop scans the remaining array. If N = 100,000, how many operations will this require?",
        suggestion: "Can you remember previous elements in a data structure that provides instant O(1) lookups?"
      });
    }

    const misconceptions = [];
    if (hasNestedLoop) {
      misconceptions.push({
        concept: "Brute Force Dependence",
        detail: "Assuming we must look forward in the array for pairs, rather than looking backwards into a hash table of previously visited numbers."
      });
    }

    if (hasUnorderedMap && !hasNestedLoop) {
      invariants[2].satisfied = true;
    }

    const satisfiedCount = invariants.filter(i => i.satisfied).length;
    const progressScore = Math.round((satisfiedCount / invariants.length) * 100);

    return {
      conceptTitle: "Hash Map Complement Pattern",
      status: hasUnorderedMap ? "Optimal Architecture" : "Scalability Bottleneck",
      progressScore,
      invariants,
      markers,
      misconceptions,
      nextStep: hasNestedLoop 
        ? "Replace the inner loop by introducing `std::unordered_map<int, int>` to store each number and its index as you visit it."
        : "Verify edge cases such as empty array or when no matching pair exists."
    };
  }

  /* --------------------------------------------------------------------------
     3. REVERSE LINKED LIST ANALYSIS
     -------------------------------------------------------------------------- */
  analyzeReverseList(lines, code) {
    const markers = [];
    const invariants = [
      { id: "forward_bookmark", name: "Forward Bookmark Invariant", description: "Must preserve curr->next in a temporary pointer before breaking the link", satisfied: false },
      { id: "pointer_reversal", name: "Link Reversal Invariant", description: "Redirect curr->next to point backwards to prev", satisfied: false },
      { id: "advancement_order", name: "Pointers Advancement Invariant", description: "Advance prev = curr, then curr = nextTemp in correct sequence", satisfied: false },
      { id: "new_head_return", name: "New Head Invariant", description: "Returns prev (not head or curr) upon loop completion", satisfied: false }
    ];

    let hasNextTemp = false;
    let hasDirectNextOverwrite = false;
    let nextCommandLine = -1;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (trimmed.includes("nextTemp") || (trimmed.includes("next") && trimmed.includes("ListNode*") && !trimmed.includes("head"))) {
        hasNextTemp = true;
        invariants[0].satisfied = true;
      }
      if (trimmed.includes("curr->next = prev")) {
        invariants[1].satisfied = true;
      }
      // Detect overwrite before save
      if (trimmed.includes("curr = curr->next") && !hasNextTemp) {
        hasDirectNextOverwrite = true;
        nextCommandLine = lineNum;
      }
      if (trimmed.includes("return prev")) {
        invariants[3].satisfied = true;
      }
    });

    if (hasDirectNextOverwrite || !hasNextTemp) {
      markers.push({
        line: nextCommandLine !== -1 ? nextCommandLine : 18,
        type: "bug",
        title: "Lost Pointer & Memory Severance",
        socraticQuestion: "If you redirect `curr->next = prev;` first, what happens when you subsequently try to access `curr->next` to move forward?",
        suggestion: "Think of a safety line: establish a temporary pointer to the rest of the list before severing the current bond."
      });
    }

    const misconceptions = [];
    if (!hasNextTemp) {
      misconceptions.push({
        concept: "Pointer Overwrite Sequence",
        detail: "Mutating a pointer in C++ destroys its previous target. In singly linked lists, without a bookmark to `curr->next`, the remainder of the list is severed in memory."
      });
    } else {
      invariants[2].satisfied = true;
    }

    const satisfiedCount = invariants.filter(i => i.satisfied).length;
    const progressScore = Math.round((satisfiedCount / invariants.length) * 100);

    return {
      conceptTitle: "3-Pointer In-Place Reversal",
      status: hasNextTemp ? "Safe Pointer Navigation" : "Memory Disconnection Danger",
      progressScore,
      invariants,
      markers,
      misconceptions,
      nextStep: !hasNextTemp
        ? "Introduce `ListNode* nextTemp = curr->next;` as the very first line inside the while loop."
        : "Check what value `curr` holds when the loop terminates to confirm whether `prev` is the correct new head."
    };
  }

  /* --------------------------------------------------------------------------
     4. VALID PARENTHESES ANALYSIS
     -------------------------------------------------------------------------- */
  analyzeValidParentheses(lines, code) {
    const markers = [];
    const invariants = [
      { id: "lifo_stack", name: "LIFO Container Invariant", description: "Uses std::stack<char> to track open brackets in last-in-first-out order", satisfied: false },
      { id: "empty_check", name: "Stack Underflow Protection", description: "Must check st.empty() before calling st.top() on closing bracket", satisfied: false },
      { id: "matching_pairs", name: "Complement Matching Invariant", description: "Validates (), [], and {} matching pairs", satisfied: false },
      { id: "final_empty", name: "Final Cleared Stack Invariant", description: "Returns st.empty() at end to catch unclosed open brackets", satisfied: false }
    ];

    let hasStack = false;
    let hasEmptyCheck = false;
    let topCallLine = -1;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (trimmed.includes("stack<char>") || trimmed.includes("stack<")) {
        hasStack = true;
        invariants[0].satisfied = true;
      }
      if (trimmed.includes(".empty()") || trimmed.includes("st.empty()")) {
        hasEmptyCheck = true;
        invariants[1].satisfied = true;
      }
      if (trimmed.includes(".top()") && topCallLine === -1) {
        topCallLine = lineNum;
      }
      if (trimmed.includes("return st.empty()") || trimmed.includes("return s.empty()")) {
        invariants[3].satisfied = true;
      }
      if (trimmed.includes("==") && (trimmed.includes(")") || trimmed.includes("]"))) {
        invariants[2].satisfied = true;
      }
    });

    if (hasStack && !hasEmptyCheck && topCallLine !== -1) {
      markers.push({
        line: topCallLine,
        type: "bug",
        title: "Potential Stack Underflow / Segmentation Fault",
        socraticQuestion: "What happens if the input string starts with a closing bracket like `\")\"`? Can you call `.top()` on an empty stack?",
        suggestion: "Always verify whether the stack contains any open brackets before attempting to read its top."
      });
    }

    const misconceptions = [];
    if (!hasEmptyCheck) {
      misconceptions.push({
        concept: "Container Pre-Condition Failure",
        detail: "Calling `.top()` or `.pop()` on an empty C++ `std::stack` results in Undefined Behavior or immediate runtime crash."
      });
    }

    const satisfiedCount = invariants.filter(i => i.satisfied).length;
    const progressScore = Math.round((satisfiedCount / invariants.length) * 100);

    return {
      conceptTitle: "Stack LIFO Bracket Verification",
      status: hasEmptyCheck ? "Robust Underflow Handling" : "Missing Empty Stack Guard",
      progressScore,
      invariants,
      markers,
      misconceptions,
      nextStep: !hasEmptyCheck
        ? "Add a check `if (st.empty()) return false;` before inspecting `st.top()` on closing brackets."
        : "Make sure your function returns `st.empty()` rather than `true` at the end to catch dangling brackets."
    };
  }

  /* --------------------------------------------------------------------------
     5. GENERIC C++ FALLBACK ANALYSIS
     -------------------------------------------------------------------------- */
  analyzeGenericCpp(lines, code) {
    const markers = [];
    const invariants = [
      { id: "compilation_structure", name: "Structural Syntax", description: "Contains balanced braces and return statements", satisfied: true },
      { id: "loop_progress", name: "Loop Advancement", description: "Loops contain state progress to guarantee termination", satisfied: true },
      { id: "complexity", name: "Algorithmic Efficiency", description: "Avoids redundant nested iterations where possible", satisfied: true }
    ];

    let openBraces = 0;
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      for (const char of trimmed) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
      }
      if (trimmed.startsWith("while") && !code.includes("++") && !code.includes("+=") && !code.includes("/=")) {
        markers.push({
          line: lineNum,
          type: "bug",
          title: "Loop Progress Caution",
          socraticQuestion: "Does this while loop body contain an operation that modifies the condition variable?",
          suggestion: "Confirm that every iteration brings the loop closer to its termination condition."
        });
        invariants[1].satisfied = false;
      }
    });

    if (openBraces !== 0) {
      markers.push({
        line: lines.length,
        type: "bug",
        title: "Unbalanced Scope Delimiters",
        socraticQuestion: "Count the opening `{` and closing `}` braces. Does every block properly close?",
        suggestion: "Check your function and block boundaries."
      });
      invariants[0].satisfied = false;
    }

    const satisfiedCount = invariants.filter(i => i.satisfied).length;
    return {
      conceptTitle: "General C++ Algorithmic Structure",
      status: satisfiedCount === invariants.length ? "Clean Structure" : "Syntax / Invariant Incomplete",
      progressScore: Math.round((satisfiedCount / invariants.length) * 100),
      invariants,
      markers,
      misconceptions: [],
      nextStep: "Inspect your loop invariants and ensure all edge cases are handled before optimizing."
    };
  }

  calculateTrajectory(attemptCount, invariants) {
    const satisfied = invariants.filter(i => i.satisfied).length;
    if (attemptCount === 1) {
      return "Initial exploration attempt. Focus on establishing the core mental model first.";
    } else if (satisfied === invariants.length) {
      return `Mastery achieved in ${attemptCount} attempts! All core conceptual invariants satisfied.`;
    } else {
      return `Attempt #${attemptCount}: Progressing steadily. ${satisfied} of ${invariants.length} conceptual invariants validated.`;
    }
  }
}
