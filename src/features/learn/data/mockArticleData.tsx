import { ArticleItem } from "../../../commonComponents/sidebar/courseSidebar/component/ArticleContent";

// unifiedMockArticles.ts
export const dummyArticles: ArticleItem[] = [
  {
    id: 1,
    title: "Introduction to Arrays",
    marks: 3,
    completed: false,
    content: `
      <h1>What is an Array?</h1>
      <br/>
      <p>An array is a collection of items of the same variable type stored that are stored at contiguous memory locations. 
      It's one of the most popular and simple data structures and is often used to implement other data structures. 
      Each item in an array is indexed starting with 0.
      The dream of every programmer is to become not just a good, 
      but also a great programmer. We all want to achieve our goals and to achieve our goals, we must have a great plan with us. In this context, we have decided to provide a complete guide for Arrays interview preparation,
      which will help you to tackle the problems that are mostly asked in the interview, such as What is an Array, What is Array in C language, How do you initialize an Array in C, How to sort an Array, etc. 
      We have also covered the topics such as Top Theoretical interview questions and Top interview coding questions in this complete guide for Array interview preparation.</p>
      <br/>
      <p>We can directly access an array element by using its index value.</p>
      <br/>
      <h2><strong>Basic Terminologies of Array</strong></h2>
      <ul>
        <li>&bull; Array Index: In an array, elements are identified by their indexes. Array index starts from 0.</li>
        <li>&bull; Array Element: Elements are items stored in an array and can be accessed by their index.</li>
        <li>&bull; Array Length: The length of an array is determined by the number of elements it can contain.</li>
      </ul>

      <h2>Representation of Array</h2>
      <p>The representation of an array can be defined by its declaration...</p>
      <pre><code>
int arr[5];   // Integer array
char arr[10]; // Character array
float arr[20]; // Float array
      </code></pre>

      <h2>Array Declaration</h2>
      <p>The above declaration is <strong>static</strong> or <strong>compile-time</strong> memory allocation...</p>

      <h2>Why Array Data Structures are Needed?</h2>
      <p>Assume there is a class of five students...</p>

      <pre><code>
int v1 = 10;
int v2 = 20;
int v3 = 30;
int v4 = 40;
int v5 = 50;
      </code></pre>

      <p><strong>Single Array to store all values:</strong></p>
      <pre><code>
int arr[5] = {10, 20, 30, 40, 50};
      </code></pre>

      <p><em>Multiple variables vs single array for efficiency and readability.</em></p>
    `,
  },
  {
    id: 2,
    title: "Understanding Time Complexity",
    marks: 3,
    completed: true,
    content: `<h1>Understanding Time Complexity</h1>
      <p>Time complexity describes how the runtime grows...</p>`,
  },
  {
    id: 3,
    title: "Mastering Recursion",
    marks: 3,
    completed: false,
    content: `<h1>Mastering Recursion</h1>
      <p>Recursion is a technique where a function calls itself...</p>`,
  },
];
