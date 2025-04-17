// This file contains mock data for courses in the learn section of the application.
import { Course } from "../types/course.types";
import {
  VideoIcon,
  DocumentIcon,
  CodeIcon,
  FAQIcon,
} from "../../../commonComponents/icons/learnIcons/CourseIcons";

export const defaultCourses: Course[] = [
  {
    id: 1,
    title: "Machine Learning Deployment",
    subtitle: "Learn to deploy ML models to production",
    description:
      "Master the art of deploying machine learning models to production environments. This course covers containerization, API development, scaling, and monitoring for ML systems.",
    stats: [
      { icon: <VideoIcon />, value: "0", total: "24" },
      { icon: <DocumentIcon />, value: "0", total: "18" },
      { icon: <CodeIcon />, value: "0", total: "12" },
      { icon: <FAQIcon />, value: "0", total: "6" },
    ],
    trustedBy: ["Google", "Microsoft", "Amazon"],
    level: "Intermediate",
    onExplore: () => console.log("Explore More clicked for course 1"),
  },
  {
    id: 2,
    title: "Deep Learning Fundamentals",
    subtitle: "Master neural networks from scratch",
    description:
      "Comprehensive introduction to deep learning concepts and techniques. Build and train neural networks for image recognition, natural language processing, and more.",
    stats: [
      { icon: <VideoIcon />, value: "0", total: "32" },
      { icon: <DocumentIcon />, value: "0", total: "24" },
      { icon: <CodeIcon />, value: "0", total: "16" },
      { icon: <FAQIcon />, value: "0", total: "8" },
    ],
    trustedBy: ["NVIDIA", "Intel", "OpenAI"],
    level: "Beginner",
    onExplore: () => console.log("Explore More clicked for course 2"),
  },
  {
    id: 3,
    title: "Data Science for Business",
    subtitle: "Transform data into business insights",
    description:
      "Learn how to leverage data science techniques to solve real business problems. From data collection and analysis to visualization and decision-making.",
    stats: [
      { icon: <VideoIcon />, value: "0", total: "28" },
      { icon: <DocumentIcon />, value: "0", total: "22" },
      { icon: <CodeIcon />, value: "0", total: "14" },
      { icon: <FAQIcon />, value: "0", total: "10" },
    ],
    trustedBy: ["IBM", "Deloitte", "Accenture"],
    level: "Intermediate",
    onExplore: () => console.log("Explore More clicked for course 3"),
  },
  {
    id: 4,
    title: "Natural Language Processing",
    subtitle: "Build intelligent language systems",
    description:
      "Deep dive into NLP technologies powering chatbots, translation systems, and text analytics. Learn about transformers, BERT, and other cutting-edge models.",
    stats: [
      { icon: <VideoIcon />, value: "0", total: "36" },
      { icon: <DocumentIcon />, value: "0", total: "28" },
      { icon: <CodeIcon />, value: "0", total: "20" },
      { icon: <FAQIcon />, value: "0", total: "12" },
    ],
    trustedBy: ["Meta", "Hugging Face", "Google Research"],
    level: "Advanced",
    onExplore: () => console.log("Explore More clicked for course 4"),
  }
];
