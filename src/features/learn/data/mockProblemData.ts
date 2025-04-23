interface ProblemData {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  testCases: {
    input: string;
    output: string;
  }[];
  initialCode: Record<string, string>;
}

export const mockProblems: ProblemData[] = [
  {
    id: "p1",
    title: "Two Sum Problem",
    description: `
    <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to the <code>target</code>.</p>
    <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
    <p>You can return the answer in any order.</p>
    
    <h4>Example 1:</h4>
    <pre>
    Input: nums = [2,7,11,15], target = 9
    Output: [0,1]
    Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
    </pre>
    
    <h4>Example 2:</h4>
    <pre>
    Input: nums = [3,2,4], target = 6
    Output: [1,2]
    </pre>
    
    <h4>Constraints:</h4>
    <ul>
      <li>2 <= nums.length <= 10<sup>4</sup></li>
      <li>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></li>
      <li>-10<sup>9</sup> <= target <= 10<sup>9</sup></li>
      <li>Only one valid answer exists.</li>
    </ul>
    `,
    difficulty: "Easy",
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        output: "[0,1]"
      },
      {
        input: "[3,2,4]\n6",
        output: "[1,2]"
      },
      {
        input: "[3,3]\n6",
        output: "[0,1]"
      }
    ],
    initialCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your code here
    
}`,
      python: `def twoSum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Your code here
    
`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        
    }
};`
    }
  },
  {
    id: "p2",
    title: "Longest Substring Without Repeat",
    description: `
    <p>Given a string <code>s</code>, find the length of the longest substring without repeating characters.</p>
    
    <h4>Example 1:</h4>
    <pre>
    Input: s = "abcabcbb"
    Output: 3
    Explanation: The answer is "abc", with the length of 3.
    </pre>
    
    <h4>Example 2:</h4>
    <pre>
    Input: s = "bbbbb"
    Output: 1
    Explanation: The answer is "b", with the length of 1.
    </pre>
    
    <h4>Example 3:</h4>
    <pre>
    Input: s = "pwwkew"
    Output: 3
    Explanation: The answer is "wke", with the length of 3.
    Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.
    </pre>
    
    <h4>Constraints:</h4>
    <ul>
      <li>0 <= s.length <= 5 * 10<sup>4</sup></li>
      <li><code>s</code> consists of English letters, digits, symbols and spaces.</li>
    </ul>
    `,
    difficulty: "Medium",
    testCases: [
      {
        input: "abcabcbb",
        output: "3"
      },
      {
        input: "bbbbb",
        output: "1"
      },
      {
        input: "pwwkew",
        output: "3"
      }
    ],
    initialCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Your code here
    
}`,
      python: `def lengthOfLongestSubstring(s):
    """
    :type s: str
    :rtype: int
    """
    # Your code here
    
`,
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your code here
        
    }
};`
    }
  },
  {
    id: "p3",
    title: "Binary Search Tree Inorder",
    description: `
    <p>Given the <code>root</code> of a binary tree, return the inorder traversal of its nodes' values.</p>
    
    <h4>Example 1:</h4>
    <pre>
    Input: root = [1,null,2,3]
    Output: [1,3,2]
    </pre>
    
    <h4>Example 2:</h4>
    <pre>
    Input: root = []
    Output: []
    </pre>
    
    <h4>Example 3:</h4>
    <pre>
    Input: root = [1]
    Output: [1]
    </pre>
    
    <h4>Constraints:</h4>
    <ul>
      <li>The number of nodes in the tree is in the range [0, 100].</li>
      <li>-100 <= Node.val <= 100</li>
    </ul>
    `,
    difficulty: "Easy",
    testCases: [
      {
        input: "[1,null,2,3]",
        output: "[1,3,2]"
      },
      {
        input: "[]",
        output: "[]"
      },
      {
        input: "[1]",
        output: "[1]"
      }
    ],
    initialCode: {
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[]}
 */
function inorderTraversal(root) {
    // Your code here
    
}`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def inorderTraversal(self, root):
        """
        :type root: TreeNode
        :rtype: List[int]
        """
        # Your code here
        
`,
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        // Your code here
        
    }
};`
    }
  }
]; 