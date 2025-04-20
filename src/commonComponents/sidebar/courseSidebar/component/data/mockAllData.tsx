import type { ContentItem } from "../AllContent"; 


export const dummyContent = [
  {
    title: "Lorem Ipsum",
    marks: 3,
    duration: "3:26",
    type: "video",
    completed: true,
  },
  {
    title: "Lorem Ipsum",
    marks: 3,
    duration: "3:26",
    type: "article",
    completed: true,
  },
  {
    title: "Lorem Ipsum",
    marks: 3,
    idealTime: "12:00",
    difficulty: 3,
    type: "problem",
    completed: false,
  },
  {
    title: "Lorem Ipsum",
    marks: 3,
    questions: 24,
    difficulty: 4,
    type: "quiz",
    completed: true,
  },
] as const satisfies ContentItem[];
