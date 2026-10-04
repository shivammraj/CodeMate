export const DSA_PROBLEMS = [
  {
    id: "palindrome-number",
    title: "Palindrome Number (LeetCode #9)",
    difficulty: "Easy",
    tags: ["Math", "Two Pointers", "C++"],
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

**Follow up:** Could you solve it without converting the integer to a string?

**Example 1:**
- **Input:** \`x = 121\`
- **Output:** \`true\`
- **Explanation:** 121 reads as 121 from left to right and from right to left.

**Example 2:**
- **Input:** \`x = -121\`
- **Output:** \`false\`
- **Explanation:** From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.`,
    starterCode: `// Rohan's Attempt (Stuck on infinite loop & edge cases)
#include <iostream>
using namespace std;

class Solution {
public:
    bool isPalindrome(int x) {
        // Negative numbers can never be palindromes
        if (x < 0) return false;
        
        long long reversed = 0;
        int temp = x;
        
        // Rohan's logic: extract digits and reverse
        while (temp > 0) {
            reversed = reversed * 10 + (temp % 10);
            // Wait, what's missing here?
        }
        
        return reversed == x;
    }
};`,
    hints: [
      {
        level: 1,
        title: "Analogy & Intuition",
        content: `Think about how you reverse a number with a pencil and paper:
- When you look at **121**, how do you extract the last digit? (Modulo \`% 10\`).
- Once you extract that last digit, what needs to happen to the remaining digits so you can inspect the next one?`
      },
      {
        level: 2,
        title: "Algorithmic Nudge",
        content: `Notice your loop in Rohan's attempt:
\`\`\`cpp
while (temp > 0) {
    reversed = reversed * 10 + (temp % 10);
}
\`\`\`
Look at \`temp\`. Does its value ever change inside the loop body? If you don't shrink \`temp\`, what will happen to \`temp > 0\`?`
      },
      {
        level: 3,
        title: "Edge Cases & Optimization",
        content: `Two important nuances:
1. **Division by 10:** You must do \`temp /= 10;\` in each step to chop off the last digit.
2. **Integer Overflow:** What if reversing a 32-bit integer causes it to exceed \`INT_MAX\`? In C++, using \`long long\` or reversing only half the number prevents overflow!`
      },
      {
        level: 4,
        title: "Complete Optimal Solution",
        content: `\`\`\`cpp
class Solution {
public:
    bool isPalindrome(int x) {
        // Special cases:
        // 1. Negative numbers can't be palindromes (e.g. -121 != 121-)
        // 2. Numbers ending in 0 (except 0 itself) cannot be palindromes
        if (x < 0 || (x % 10 == 0 && x != 0)) {
            return false;
        }

        int reversedHalf = 0;
        // Only reverse the second half of the number!
        while (x > reversedHalf) {
            reversedHalf = reversedHalf * 10 + (x % 10);
            x /= 10;
        }

        // When the length is an odd number, we can get rid of the middle digit by reversedHalf/10
        // For example when the input is 12321, at the end of the while loop we get x = 12, reversedHalf = 123,
        // since the middle digit doesn't matter in palindrome (it always equals to itself),
        // we can simply get rid of it.
        return x == reversedHalf || x == reversedHalf / 10;
    }
};
\`\`\`
**Time Complexity:** O(log₁₀(N)) — we divide the input by 10 every step.  
**Space Complexity:** O(1) — no extra memory or string allocation.`
      }
    ],
    doctorBugs: [
      {
        trigger: "infinite loop",
        response: `🩺 **Code Doctor Observation:**  
Look carefully at your \`while (temp > 0)\` loop. You read \`temp % 10\` and add it to \`reversed\`, but what happens to \`temp\` on line 18?  
*Question for you:* If \`temp\` starts as \`121\`, what is \`temp\` on the 2nd iteration? And the 100th iteration? What line of code is needed to reduce \`temp\`?`
      }
    ]
  },
  {
    id: "two-sum",
    title: "Two Sum (LeetCode #1)",
    difficulty: "Easy",
    tags: ["Array", "Hash Table", "C++"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

**Example 1:**
- **Input:** \`nums = [2,7,11,15], target = 9\`
- **Output:** \`[0,1]\`
- **Explanation:** Because \`nums[0] + nums[1] == 9\`, we return \`[0, 1]\`.`,
    starterCode: `// Rohan's Initial Brute Force (O(N^2) - Time Limit Exceeded on big inputs)
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        int n = nums.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`,
    hints: [
      {
        level: 1,
        title: "Analogy & Intuition",
        content: `Imagine you're holding a card with the number **7**, and the target is **9**.  
Before you look through the whole deck, ask yourself: *What exact number are you searching for?*  
It's \`9 - 7 = 2\`.  
Can you remember what numbers you've seen before as you walk through the deck once?`
      },
      {
        level: 2,
        title: "Data Structure Direction",
        content: `Right now, for every element \`nums[i]\`, your inner loop scans the rest of the array in O(N) time.  
Which C++ STL container allows you to look up whether a number has already been seen in **O(1) average time**?  
*(Hint: Think of a key-value structure where the key is the number and the value is its index!)*`
      },
      {
        level: 3,
        title: "Algorithmic Nudge",
        content: `Use \`std::unordered_map<int, int> seen;\`.  
As you iterate through with index \`i\`:
1. Calculate the complement: \`int complement = target - nums[i];\`
2. Check if \`seen.find(complement) != seen.end()\`.
3. If yes, you found the pair! What are the two indices?
4. If no, insert the current number into the map: \`seen[nums[i]] = i;\``
      },
      {
        level: 4,
        title: "Complete Optimal Solution",
        content: `\`\`\`cpp
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> numMap; // value -> index
        
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            
            // Check if complement already exists in map
            if (numMap.count(complement)) {
                return {numMap[complement], i};
            }
            
            // Store current number and its index
            numMap[nums[i]] = i;
        }
        
        return {}; // No solution found
    }
};
\`\`\`
**Time Complexity:** O(N) — single pass with O(1) hash map operations.  
**Space Complexity:** O(N) — stores up to N elements in the map.`
      }
    ],
    doctorBugs: [
      {
        trigger: "O(N^2)",
        response: `🩺 **Code Doctor Observation:**  
Your solution is 100% correct in logic! But look at the two nested loops:  
\`\`\`cpp
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) ...
\`\`\`
If \`nums\` has 100,000 elements, that's up to $10^{10}$ operations. In C++, that will trigger **Time Limit Exceeded (TLE)**.  
*Question:* How can we trade space (memory) to avoid the second nested loop? What STL container allows O(1) lookup?`
      }
    ]
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List (LeetCode #206)",
    difficulty: "Easy / Medium",
    tags: ["Linked List", "Pointers", "C++"],
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.

**Example 1:**
- **Input:** \`head = [1,2,3,4,5]\`
- **Output:** \`[5,4,3,2,1]\``,
    starterCode: `// Rohan's Attempt (Segmentation Fault / Lost Pointer)
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        
        while (curr != nullptr) {
            // Rohan flips the pointer directly:
            curr->next = prev; 
            prev = curr;
            // Uh oh... how do we advance curr now?
            curr = curr->next; 
        }
        
        return prev;
    }
};`,
    hints: [
      {
        level: 1,
        title: "Analogy & Intuition",
        content: `Think of a train where each car holds hands with the next car in front of it.  
If Car 2 lets go of Car 3's hand to hold Car 1's hand, Car 3 is now disconnected and lost into space!  
Before you break the bond to point backwards, who needs to hold onto the remaining train?`
      },
      {
        level: 2,
        title: "Pointers Setup",
        content: `You need **three** pointers:
1. \`prev\`: The node that will become the new next (starts as \`nullptr\`).
2. \`curr\`: The node you are currently redirecting.
3. \`nextTemp\`: A temporary bookmark to remember \`curr->next\` BEFORE you overwrite it!`
      },
      {
        level: 3,
        title: "Step Order Nudge",
        content: `Check the exact order inside your while loop:
\`\`\`cpp
ListNode* nextTemp = curr->next; // 1. Save next node
curr->next = prev;               // 2. Reverse current pointer
prev = curr;                     // 3. Move prev forward
curr = nextTemp;                 // 4. Move curr forward using saved bookmark
\`\`\`
Notice on line 21 of Rohan's code: \`curr = curr->next;\` was called *after* \`curr->next = prev;\`. What was \`curr\` being set to?`
      },
      {
        level: 4,
        title: "Complete Optimal Solution",
        content: `\`\`\`cpp
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        
        while (curr != nullptr) {
            ListNode* nextTemp = curr->next; // Step 1: Save next node
            curr->next = prev;               // Step 2: Reverse pointer
            prev = curr;                     // Step 3: Advance prev
            curr = nextTemp;                 // Step 4: Advance curr
        }
        
        return prev; // prev is now the new head of reversed list
    }
};
\`\`\`
**Time Complexity:** O(N) — single pass through the linked list.  
**Space Complexity:** O(1) — in-place pointer reversal.`
      }
    ],
    doctorBugs: [
      {
        trigger: "curr = curr->next",
        response: `🩺 **Code Doctor Observation:**  
Look at lines 18 and 21:  
\`\`\`cpp
curr->next = prev; // line 18: you changed curr->next to point backwards to prev!
prev = curr;
curr = curr->next; // line 21: now what is curr->next? It's prev!
\`\`\`
By reassigning \`curr->next\` first, you lost the address of the rest of the list! \`curr\` jumps backwards to \`prev\`, creating an infinite cycle or crash.  
*Question:* How can you save the original \`curr->next\` before altering it?`
      }
    ]
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses (LeetCode #20)",
    difficulty: "Easy",
    tags: ["String", "Stack", "C++"],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    starterCode: `// Rohan's Attempt (Forgot empty stack check & mismatch)
#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') {
                st.push(c);
            } else {
                // If closing bracket matches:
                char top = st.top(); // Runtime error if string is just ")"!
                st.pop();
            }
        }
        return st.empty();
    }
};`,
    hints: [
      {
        level: 1,
        title: "Analogy & Intuition",
        content: `Think of a stack of plates. The last plate placed on top is the first one you must pick up (LIFO - Last In, First Out).  
When you see a closing bracket like \`)\`, which bracket must it match? The *most recent unclosed opening bracket*!`
      },
      {
        level: 2,
        title: "Safety & Edge Cases",
        content: `What happens if the input string is just \`")"\` or \`"}{"\`?  
When you encounter a closing bracket, before calling \`st.top()\`, what check MUST you perform to avoid undefined behavior or segmentation fault?`
      },
      {
        level: 3,
        title: "Algorithmic Nudge",
        content: `When you encounter a closing bracket:
1. If \`st.empty()\`, return \`false\` immediately (closing bracket without opener).
2. Check if \`st.top()\` matches the current closing bracket (\`(\` with \`)\`, \`{\` with \`}\`, \`[\` with \`]\`).
3. If it doesn't match, return \`false\`.
4. If it does match, pop it!
5. After the loop ends, what must be true about \`st\`?`
      },
      {
        level: 4,
        title: "Complete Optimal Solution",
        content: `\`\`\`cpp
#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') {
                st.push(c);
            } else {
                if (st.empty()) return false;
                
                char top = st.top();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) {
                    return false;
                }
                st.pop();
            }
        }
        
        return st.empty();
    }
};
\`\`\`
**Time Complexity:** O(N) — inspect each character once.  
**Space Complexity:** O(N) — stack size up to length of string.`
      }
    ],
    doctorBugs: [
      {
        trigger: "st.top()",
        response: `🩺 **Code Doctor Observation:**  
Look at:
\`\`\`cpp
char top = st.top();
st.pop();
\`\`\`
What happens if the user passes \`s = ")"\`?  
The stack is empty! In C++, calling \`.top()\` or \`.pop()\` on an empty \`std::stack\` causes **undefined behavior / segmentation fault**.  
*Question:* What guard condition should you check before touching \`st.top()\`?`
      }
    ]
  }
];
