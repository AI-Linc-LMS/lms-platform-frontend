// Example dummy course object
import { Course } from "./final-course.types";

export const dummyCourse: Course = {
  id: 101,
  title: "Mastering React for Web Development",
  description:
    "Learn React from scratch and build powerful, scalable web applications. This course covers everything from basic concepts to advanced patterns, including hooks, context, and performance optimization.",
  slug: "mastering-react-web-dev",
  price: "499.99",
  is_free: false,

  difficulty_level: "Medium",
  duration_in_hours: 32,
  language: "English",
  subtitle: "Become a React Pro in 30 Days",

  published: true,
  client: 1,

  learning_objectives:
    "Understand React fundamentals, build reusable components, manage state, and optimize performance.",
  requirements: "Basic knowledge of JavaScript and HTML.",
  preview_video_url: "https://example.com/preview.mp4",
  thumbnail: "https://example.com/course-thumbnail.jpg",

  enrolled_students: {
    total: 1200,
    students_profile_pic: [
      "https://randomuser.me/api/portraits/men/1.jpg",
      "https://randomuser.me/api/portraits/women/2.jpg",
      "https://randomuser.me/api/portraits/men/3.jpg",
    ],
  },

  stats: {
    video: { total: 80, completed: 40 },
    article: { total: 10, completed: 5 },
    coding_problem: { total: 20, completed: 10 },
    quiz: { total: 8, completed: 4 },
    assignment: { total: 5, completed: 2 },
  },

  liked_by: [],
  instructors: [
    {
      id: 1,
      name: "Jane Doe",
      bio: "Senior Frontend Engineer and React Instructor.",
      profile_pic_url: "https://randomuser.me/api/portraits/women/44.jpg",
      linkedin_profile: "https://linkedin.com/in/janedoe",
    },
  ],

  created_at: "2025-01-10 09:00:00",
  updated_at: "2025-08-25 16:32:58",

  is_enrolled: true,
  modules: [
    {
      id: 1,
      title: "React Basics",
      weekno: 1,
      completion_percentage: 100,
      submodules: [
        {
          id: 11,
          title: "Introduction to React",
          description: "What is React and why use it?",
          order: 1,
          article_count: 1,
          assignment_count: 0,
          coding_problem_count: 0,
          quiz_count: 1,
          video_count: 2,
        },
      ],
    },
    {
      id: 2,
      title: "Advanced React",
      weekno: 2,
      completion_percentage: 50,
      submodules: [
        {
          id: 21,
          title: "Hooks Deep Dive",
          description: "Understanding useState, useEffect, and custom hooks.",
          order: 1,
          article_count: 2,
          assignment_count: 1,
          coding_problem_count: 2,
          quiz_count: 1,
          video_count: 3,
        },
      ],
    },
  ],

  is_liked_by_current_user: true,
  liked_count: 350,
  last_accessed: "2025-08-24 14:00:00",

  tags: ["React", "Frontend", "Web Development"],
  rating: 4.7,
  trusted_by: ["Google", "Microsoft", "Amazon"],
  achievements: {},
  badges: 3,
  streak_count: 7,
  recent_activity: [
    "Completed 'Hooks Deep Dive'",
    "Passed Quiz: React Basics",
    "Watched Video: useEffect Explained",
  ],
  progress_percentage: 65,
  next_lesson: {
    id: 301,
    title: "React Context API",
    description: "Learn how to manage global state with Context.",
  },
  whats_included: [
    "80+ HD Video Lessons",
    "10 Articles",
    "20 Coding Problems",
    "8 Quizzes",
    "5 Assignments",
    "Certificate of Completion",
  ],
  features: [
    "Lifetime access",
    "Downloadable resources",
    "Access on mobile and TV",
    "Certificate of completion",
  ],
  certificate_available: false,
  streak: {
    "2025-09-20": true,
    "2025-09-21": true,
    "2025-09-22": false,
    "2025-09-23": true,
  },
};
