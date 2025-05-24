import { CourseWeek } from "../components/enrolled-courses/CollapsibleCourseModule";

// Mock data for course content
export const mockCourseContent: CourseWeek[] = [
  {
    id: "week-1",
    title: "Week 1",
    weekNo: 1,
    modules: [
      {
        id: "Intro-ml-model-deployment",
        title: "Introduction To Machine Learning Model Deployment",
        completed: 12,
        started: true,
        content: [
          { type: "video", title: "Videos", count: 3 },
          { type: "article", title: "articles", count: 3 },
          { type: "problem", title: "Problem", count: 1 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
      {
        id: "Machine-learning-pipeline",
        title: "Machine Learning Pipeline",
        content: [
          { type: "video", title: "Videos", count: 3 },
          { type: "article", title: "articles", count: 3 },
          { type: "problem", title: "Problem", count: 1 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
      {
        id: "Software-architecture",
        title: "Software Architecture Of Deployment",
        content: [
          { type: "video", title: "Videos", count: 3 },
          { type: "article", title: "articles", count: 3 },
          { type: "problem", title: "Problem", count: 1 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
    ],
  },
  {
    id: "week-2",
    title: "Week 2",
    weekNo: 2,
    modules: [
      {
        id: "Intro-git-github",
        title: "Introduction To Git And Github",
        isLocked: true,
        content: [
          { type: "video", title: "Videos", count: 3 },
          { type: "article", title: "articles", count: 3 },
          { type: "problem", title: "Problem", count: 1 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
    ],
  },
  {
    id: "week-3",
    title: "Week 3",
    weekNo: 3,
    modules: [
      {
        id: "Deploy-ml-models",
        title: "Deploy ML Models In Productions As APIs (Flask)",
        isLocked: true,
        content: [
          { type: "video", title: "Videos", count: 4 },
          { type: "article", title: "articles", count: 3 },
          { type: "problem", title: "Problem", count: 2 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
    ],
  },
  {
    id: "week-4",
    title: "Week 4",
    weekNo: 4,
    modules: [
      {
        id: "Deploy-ml-heroku",
        title: "Deploy ML Models In Heroku Using Flask (PaaS)",
        isLocked: true,
        content: [
          { type: "video", title: "Videos", count: 3 },
          { type: "article", title: "articles", count: 2 },
          { type: "problem", title: "Problem", count: 1 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
    ],
  },
  {
    id: "week-5",
    title: "Week 5",
    weekNo: 5,
    modules: [
      {
        id: "Deploy-ml-aws",
        title: "Deploy And ML Model On AWS (IaaS)",
        isLocked: true,
        content: [
          { type: "video", title: "Videos", count: 4 },
          { type: "article", title: "articles", count: 3 },
          { type: "problem", title: "Problem", count: 2 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
    ],
  },
  {
    id: "week-6",
    title: "Week 6",
    weekNo: 6,
    modules: [
      {
        id: "Week-6-content",
        title: "Additional Content",
        isLocked: true,
        content: [
          { type: "video", title: "Videos", count: 3 },
          { type: "article", title: "articles", count: 2 },
          { type: "problem", title: "Problem", count: 1 },
          { type: "quiz", title: "Quiz", count: 1 },
        ],
      },
    ],
  },
];
