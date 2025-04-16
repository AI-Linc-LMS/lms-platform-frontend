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
    title: "Deployment in ML",
    subtitle: "Lorem ipsum dolor sit amet...",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.",
    stats: [
      { icon: <VideoIcon />, value: "0", total: "52" },
      { icon: <DocumentIcon />, value: "0", total: "52" },
      { icon: <CodeIcon />, value: "0", total: "52" },
      { icon: <FAQIcon />, value: "0", total: "52" },
    ],
    trustedBy: [],
    onExplore: () => console.log("Explore More clicked for course 1"),
  },
  {
    id: 2,
    title: "Deployment in ML",
    subtitle: "Lorem ipsum dolor sit amet...",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.",
    stats: [
      { icon: <VideoIcon />, value: "0", total: "52" },
      { icon: <DocumentIcon />, value: "0", total: "52" },
      { icon: <CodeIcon />, value: "0", total: "52" },
      { icon: <FAQIcon />, value: "0", total: "52" },
    ],
    trustedBy: [],
    onExplore: () => console.log("Explore More clicked for course 2"),
  },
  

];
