import { ResumeData } from "./types";

export const SAMPLE_WORK: ResumeData["workExperience"] = [
  {
    id: "1",
    position: "Senior Software Engineer",
    company: "Tech Solutions Inc.",
    location: "San Francisco, CA",
    startDate: "2021-06",
    endDate: "",
    current: true,
    description: [
      "Led development of microservices architecture serving 1M+ users",
      "Improved application performance by 40% through code optimization",
      "Mentored team of 5 junior developers",
    ],
  },
  {
    id: "2",
    position: "Software Engineer",
    company: "Digital Innovations",
    location: "Remote",
    startDate: "2019-03",
    endDate: "2021-05",
    current: false,
    description: [
      "Developed and maintained React-based web applications",
      "Implemented RESTful APIs using Node.js and Express",
      "Collaborated with UX team to improve user experience",
    ],
  },
];

export const SAMPLE_EDUCATION: ResumeData["education"] = [
  {
    id: "1",
    degree: "Bachelor of Science in Computer Science",
    institution: "University of California",
    location: "Berkeley, CA",
    startDate: "2015-09",
    endDate: "2019-05",
    gpa: "3.8/4.0",
    description: "Focus on Software Engineering and Artificial Intelligence",
  },
];

export const SAMPLE_SKILLS: ResumeData["skills"] = [
  { id: "1", name: "JavaScript/TypeScript", level: 5 },
  { id: "2", name: "React & Next.js", level: 5 },
  { id: "3", name: "Node.js & Express", level: 4 },
  { id: "4", name: "Python", level: 4 },
  { id: "5", name: "AWS & Cloud Services", level: 4 },
  { id: "6", name: "Docker & Kubernetes", level: 3 },
  { id: "7", name: "SQL & NoSQL Databases", level: 4 },
  { id: "8", name: "Git & CI/CD", level: 5 },
];

export const SAMPLE_PROJECTS: ResumeData["projects"] = [
  {
    id: "1",
    name: "E-Commerce Platform",
    description:
      "Built a scalable e-commerce platform handling 10K+ daily transactions with real-time inventory management and payment processing.",
    technologies: ["React", "Node.js", "MongoDB", "Stripe", "Redis"],
    link: "https://github.com/johndoe/ecommerce",
  },
  {
    id: "2",
    name: "Task Management App",
    description:
      "Developed a collaborative task management application with real-time updates and team collaboration features.",
    technologies: ["Next.js", "PostgreSQL", "WebSocket", "Tailwind CSS"],
    link: "https://github.com/johndoe/taskmanager",
  },
];

export const SAMPLE_CERTS: ResumeData["certifications"] = [
  {
    id: "1",
    name: "AWS Certified Solutions Architect",
    issuer: "Amazon Web Services",
    date: "2022-08",
    link: "",
  },
  {
    id: "2",
    name: "Professional Scrum Master I",
    issuer: "Scrum.org",
    date: "2021-11",
    link: "",
  },
];

export const SAMPLE_BASIC_INFO: ResumeData["basicInfo"] = {
  firstName: "John",
  lastName: "Doe",
  professionalTitle: "Senior Software Engineer",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  photo: "",
  summary:
    "Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading cross-functional teams.",
  github: "https://github.com/johndoe",
  linkedin: "https://linkedin.com/in/johndoe",
  portfolio: "",
  leetcode: "",
  hackerrank: "",
  kaggle: "",
  medium: "",
};

export const SAMPLE_RESUME_DATA: ResumeData = {
  basicInfo: SAMPLE_BASIC_INFO,
  workExperience: SAMPLE_WORK,
  education: SAMPLE_EDUCATION,
  skills: SAMPLE_SKILLS,
  projects: SAMPLE_PROJECTS,
  certifications: SAMPLE_CERTS,
};
