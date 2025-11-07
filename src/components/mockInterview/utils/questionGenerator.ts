// Question Generator for Mock Interviews

interface QuestionSet {
  [key: string]: {
    [key: string]: string[];
  };
}

export const questionBank: QuestionSet = {
  javascript: {
    easy: [
      "What is JavaScript and what are its main features?",
      "Explain the difference between let, const, and var.",
      "What are the different data types in JavaScript?",
      "How do you create a function in JavaScript?",
      "What is the purpose of the 'this' keyword?",
      "Explain what arrays are and how to use them.",
      "What is the difference between == and ===?",
      "How do you handle errors in JavaScript?",
      "What are template literals and how do you use them?",
      "Explain what JSON is and why it's used.",
    ],
    medium: [
      "Explain closures in JavaScript with an example.",
      "What is hoisting and how does it work?",
      "Describe the event loop in JavaScript.",
      "What are arrow functions and how do they differ from regular functions?",
      "Explain promises and how they handle asynchronous operations.",
      "What is the difference between map, filter, and reduce?",
      "How does prototypal inheritance work in JavaScript?",
      "What are higher-order functions?",
      "Explain the concept of callback functions.",
      "What is destructuring and how do you use it?",
    ],
    hard: [
      "Explain the differences between call, apply, and bind.",
      "What are generators and how do they work?",
      "Describe the module pattern in JavaScript.",
      "How does JavaScript's memory management and garbage collection work?",
      "Explain WeakMap and WeakSet and their use cases.",
      "What are Proxy and Reflect in JavaScript?",
      "Describe the differences between microtasks and macrotasks.",
      "How do async/await work under the hood?",
      "Explain the concept of memoization and implement it.",
      "What are Web Workers and when would you use them?",
    ],
  },
  react: {
    easy: [
      "What is React and why is it used?",
      "Explain what JSX is and how it works.",
      "What are components in React?",
      "What is the difference between functional and class components?",
      "How do you pass data between components using props?",
      "What is state in React?",
      "How do you handle events in React?",
      "What is the virtual DOM?",
      "How do you render lists in React?",
      "What are keys in React and why are they important?",
    ],
    medium: [
      "Explain the useState hook and how to use it.",
      "What is the useEffect hook used for?",
      "Describe the component lifecycle in React.",
      "What is prop drilling and how can you avoid it?",
      "Explain controlled vs uncontrolled components.",
      "What is the useContext hook and when would you use it?",
      "How does React reconciliation work?",
      "What are custom hooks and how do you create them?",
      "Explain the useCallback and useMemo hooks.",
      "What is React Router and how does it work?",
    ],
    hard: [
      "Explain React's reconciliation algorithm in detail.",
      "What are higher-order components (HOCs)?",
      "Describe render props pattern and its use cases.",
      "How does React Fiber work?",
      "Explain React's concurrent mode features.",
      "What are portals in React and when would you use them?",
      "How does server-side rendering (SSR) work in React?",
      "Explain React's batching mechanism.",
      "What are the rules of hooks and why do they exist?",
      "How would you optimize a large React application?",
    ],
  },
  typescript: {
    easy: [
      "What is TypeScript and how does it differ from JavaScript?",
      "What are the basic types in TypeScript?",
      "How do you declare variables with types?",
      "What are interfaces in TypeScript?",
      "Explain what type annotations are.",
      "What is type inference in TypeScript?",
      "How do you create and use functions with types?",
      "What are arrays and tuples in TypeScript?",
      "What is the 'any' type and when should you use it?",
      "How do you handle null and undefined in TypeScript?",
    ],
    medium: [
      "Explain generics in TypeScript with examples.",
      "What are union and intersection types?",
      "Describe type guards and how to use them.",
      "What are enums and when would you use them?",
      "Explain the difference between type and interface.",
      "What are utility types in TypeScript?",
      "How do you work with optional properties?",
      "What is type assertion and when should you use it?",
      "Explain mapped types in TypeScript.",
      "What are decorators in TypeScript?",
    ],
    hard: [
      "Explain conditional types with practical examples.",
      "What are template literal types?",
      "Describe the infer keyword and its use cases.",
      "How do you implement advanced type guards?",
      "Explain variance in TypeScript (covariance, contravariance).",
      "What are branded types and how do you create them?",
      "Describe the type system's soundness and its limitations.",
      "How do you handle complex type transformations?",
      "Explain recursive types and their applications.",
      "What are discriminated unions and how do they work?",
    ],
  },
  nodejs: {
    easy: [
      "What is Node.js and what is it used for?",
      "Explain the event-driven architecture of Node.js.",
      "What is npm and what is it used for?",
      "How do you create a simple HTTP server in Node.js?",
      "What are modules in Node.js?",
      "How do you read and write files in Node.js?",
      "What is the purpose of package.json?",
      "Explain what middleware is in Express.js.",
      "How do you handle routes in Express?",
      "What is the difference between Node.js and browsers?",
    ],
    medium: [
      "Explain the Node.js event loop in detail.",
      "What are streams in Node.js and how do you use them?",
      "Describe the differences between process.nextTick and setImmediate.",
      "How do you handle errors in Node.js applications?",
      "What is clustering in Node.js?",
      "Explain how to use environment variables.",
      "What are buffers in Node.js?",
      "How do you implement authentication in Express?",
      "What is the purpose of the async library?",
      "Explain database connection pooling.",
    ],
    hard: [
      "How would you scale a Node.js application?",
      "Explain memory management and garbage collection in Node.js.",
      "What are worker threads and when would you use them?",
      "Describe strategies for handling CPU-intensive tasks.",
      "How do you implement microservices architecture with Node.js?",
      "Explain the internals of the event loop phases.",
      "What are the best practices for Node.js security?",
      "How do you monitor and profile Node.js applications?",
      "Describe strategies for handling high concurrency.",
      "What are the trade-offs between different Node.js frameworks?",
    ],
  },
  python: {
    easy: [
      "What is Python and what are its main features?",
      "Explain the difference between lists and tuples.",
      "What are dictionaries in Python?",
      "How do you define and call functions?",
      "What is the purpose of the if __name__ == '__main__' statement?",
      "Explain what loops are available in Python.",
      "How do you handle exceptions in Python?",
      "What are list comprehensions?",
      "Explain the difference between append and extend.",
      "What is the purpose of the pass statement?",
    ],
    medium: [
      "Explain decorators in Python with examples.",
      "What are generators and how do they work?",
      "Describe the differences between @staticmethod and @classmethod.",
      "How does Python's memory management work?",
      "What are context managers and the 'with' statement?",
      "Explain multiple inheritance and MRO.",
      "What is the Global Interpreter Lock (GIL)?",
      "How do you work with regular expressions in Python?",
      "Explain lambda functions and their use cases.",
      "What are *args and **kwargs?",
    ],
    hard: [
      "Explain metaclasses in Python.",
      "What are descriptors and how do they work?",
      "Describe the internals of Python's import system.",
      "How do you implement custom iterators and generators?",
      "Explain the differences between multiprocessing and threading.",
      "What are coroutines and how do they differ from generators?",
      "Describe Python's type system and type hints.",
      "How would you optimize Python code for performance?",
      "Explain the abstract base classes (ABC) module.",
      "What are slots in Python classes?",
    ],
  },
  "system-design": {
    easy: [
      "What is system design and why is it important?",
      "Explain the difference between vertical and horizontal scaling.",
      "What is a load balancer and what does it do?",
      "What is caching and why is it used?",
      "Explain what a database is and different types.",
      "What is the difference between SQL and NoSQL databases?",
      "What is an API and how does it work?",
      "Explain what microservices are.",
      "What is a Content Delivery Network (CDN)?",
      "What is the purpose of a message queue?",
    ],
    medium: [
      "How would you design a URL shortening service?",
      "Explain different caching strategies.",
      "What are the CAP theorem trade-offs?",
      "How do you handle database replication?",
      "Describe different load balancing algorithms.",
      "What is database sharding and when would you use it?",
      "How do you implement rate limiting?",
      "Explain the differences between REST and GraphQL.",
      "What are websockets and when would you use them?",
      "How do you ensure data consistency in distributed systems?",
    ],
    hard: [
      "Design a scalable chat application like WhatsApp.",
      "How would you design Twitter's timeline feature?",
      "Explain consensus algorithms like Raft or Paxos.",
      "Design a distributed file storage system.",
      "How would you design a real-time analytics system?",
      "Explain strategies for handling millions of concurrent users.",
      "Design a recommendation system for an e-commerce platform.",
      "How do you implement distributed transactions?",
      "Design a global content delivery system.",
      "Explain strategies for handling eventual consistency.",
    ],
  },
  dsa: {
    easy: [
      "What is an array and what are its characteristics?",
      "Explain what a linked list is.",
      "What is a stack and how does it work?",
      "What is a queue and what are its operations?",
      "Explain the difference between stack and queue.",
      "What is a hash table?",
      "What is recursion and how do you use it?",
      "Explain linear search algorithm.",
      "What is binary search?",
      "What are the time and space complexity basics?",
    ],
    medium: [
      "Explain different types of linked lists.",
      "What is a binary tree and its properties?",
      "Describe tree traversal methods.",
      "What is a binary search tree (BST)?",
      "Explain the heap data structure.",
      "What are hash collision resolution techniques?",
      "Describe the quick sort algorithm.",
      "What is a graph and how is it represented?",
      "Explain depth-first search (DFS).",
      "What is breadth-first search (BFS)?",
    ],
    hard: [
      "Explain AVL trees and balancing operations.",
      "What are red-black trees?",
      "Describe the B-tree data structure.",
      "What is a trie and what are its applications?",
      "Explain dynamic programming with examples.",
      "What are different graph algorithms (Dijkstra, Bellman-Ford)?",
      "Describe the union-find data structure.",
      "What is a segment tree and when would you use it?",
      "Explain topological sorting.",
      "What are different string matching algorithms?",
    ],
  },
  algorithms: {
    easy: [
      "What is Big O notation?",
      "Explain the bubble sort algorithm.",
      "What is selection sort?",
      "Describe the insertion sort algorithm.",
      "What is the time complexity of common operations?",
      "Explain what a greedy algorithm is.",
      "What is two-pointer technique?",
      "Describe the sliding window technique.",
      "What is divide and conquer?",
      "Explain the basics of recursion.",
    ],
    medium: [
      "Explain the merge sort algorithm.",
      "What is quick sort and how does it work?",
      "Describe dynamic programming concepts.",
      "What is memoization and how does it help?",
      "Explain backtracking with examples.",
      "What is the Knapsack problem?",
      "Describe the longest common subsequence problem.",
      "What are greedy algorithms and their applications?",
      "Explain binary search variations.",
      "What is the two-pointer technique used for?",
    ],
    hard: [
      "Explain advanced dynamic programming patterns.",
      "What is the A* search algorithm?",
      "Describe the KMP string matching algorithm.",
      "What are NP-complete problems?",
      "Explain approximation algorithms.",
      "What is the traveling salesman problem?",
      "Describe different tree algorithms (LCA, diameter).",
      "What are bit manipulation tricks?",
      "Explain the Floyd-Warshall algorithm.",
      "What are probabilistic data structures?",
    ],
  },
};

/**
 * Get questions for a specific topic and difficulty
 */
export const getQuestions = (
  topic: string,
  difficulty: string,
  count: number = 5
): string[] => {
  const topicKey = topic.toLowerCase();
  const difficultyKey = difficulty.toLowerCase();

  const questions =
    questionBank[topicKey]?.[difficultyKey] ||
    questionBank.javascript.easy;

  // Shuffle and return requested number of questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Get all available topics
 */
export const getAvailableTopics = (): string[] => {
  return Object.keys(questionBank);
};

/**
 * Get all available difficulties
 */
export const getAvailableDifficulties = (): string[] => {
  return ["easy", "medium", "hard"];
};

