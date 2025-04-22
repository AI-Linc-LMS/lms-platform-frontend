import { ArticleItem } from "../../../commonComponents/sidebar/courseSidebar/component/ArticleContent";

// unifiedMockArticles.ts
export const dummyArticles: ArticleItem[] = [
  {
    id: 1,
    title: "Introduction to Arrays",
    marks: 3,
    completed: false,
    content: `<h1>Introduction To Arrays</h1>
      <p>An array is a collection of items...</p>
      <ul>
        <li>Array Index</li>
        <li>Array Length</li>
        <li>Array Elements</li>
      </ul>`,
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
