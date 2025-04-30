// This file contains mock data for courses in the learn section of the application.
import { Course } from "../types/course.types";
import {
  VideoIcon,
  DocumentIcon,
  CodeIcon,
  FAQIcon,
} from "../../../commonComponents/icons/learnIcons/CourseIcons";

import pic_1 from "../../../assets/exploremore/mentor-avatars/mentor-1.jpeg";
import pic_2 from "../../../assets/exploremore/mentor-avatars/mentor-2.png";
import pic_3 from "../../../assets/exploremore/mentor-avatars/mentor-3.png";
import pic_4 from "../../../assets/exploremore/mentor-avatars/mentor-4.png";
import pic_5 from "../../../assets/exploremore/mentor-avatars/mentor-5.png";

import company_1 from "../../../assets/dashboard_assets/company-logos/goggle.png";
import company_2 from "../../../assets/dashboard_assets/company-logos/microsoft.png";
import company_3 from "../../../assets/dashboard_assets/company-logos/tcs.png";
import company_4 from "../../../assets/dashboard_assets/company-logos/wipro.png";
import company_5 from "../../../assets/dashboard_assets/company-logos/dello.png";

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
    trustedBy: [company_1, company_2, company_3, company_4, company_5],
    teacherAvatar: [
      pic_1,
      pic_2,
      pic_3,
      pic_4,
      pic_5,
    ],
    teacherNames:["Shubham lal" , "Me ",] , 
  teacherTitles: ["AI Engineer", "ML Engineer"],
    level: "Intermediate",
    onExplore: () => console.log("Explore More clicked for course 1"),
  },
  // {
  //   id: 2,
  //   title: "Deep Learning Fundamentals",
  //   subtitle: "Master neural networks from scratch",
  //   description:
  //     "Comprehensive introduction to deep learning concepts and techniques. Build and train neural networks for image recognition, natural language processing, and more.",
  //   stats: [
  //     { icon: <VideoIcon />, value: "0", total: "32" },
  //     { icon: <DocumentIcon />, value: "0", total: "24" },
  //     { icon: <CodeIcon />, value: "0", total: "16" },
  //     { icon: <FAQIcon />, value: "0", total: "8" },
  //   ],
  //   trustedBy: [company_1, company_2, company_3, company_4, company_5],
  //   teacherAvatar: [
  //     pic_1,
  //     pic_2,
  //     pic_3,
  //     pic_4,
  //     pic_5,
  //   ],
  //   teacherNames:["Shubham lal" , "Me ",] , 
  //   teacherTitles: ["AI Engineer", "ML Engineer"],
  //   level: "Beginner",
  //   onExplore: () => console.log("Explore More clicked for course 2"),
  // },
  // {
  //   id: 3,
  //   title: "Data Science for Business",
  //   subtitle: "Transform data into business insights",
  //   description:
  //     "Learn how to leverage data science techniques to solve real business problems. From data collection and analysis to visualization and decision-making.",
  //   stats: [
  //     { icon: <VideoIcon />, value: "0", total: "28" },
  //     { icon: <DocumentIcon />, value: "0", total: "22" },
  //     { icon: <CodeIcon />, value: "0", total: "14" },
  //     { icon: <FAQIcon />, value: "0", total: "10" },
  //   ],
  //   trustedBy: [company_1, company_2, company_3, company_4, company_5],
  //   teacherAvatar: [
  //     pic_1,
  //     pic_2,
  //     pic_3,
  //     pic_4,
  //     pic_5,
  //   ],
  //   teacherNames:["Shubham lal" , "Me ",] , 
  //   teacherTitles: ["AI Engineer", "ML Engineer"],
  //   level: "Intermediate",
  //   onExplore: () => console.log("Explore More clicked for course 3"),
  // },
  // {
  //   id: 4,
  //   title: "Natural Language Processing",
  //   subtitle: "Build intelligent language systems",
  //   description:
  //     "Deep dive into NLP technologies powering chatbots, translation systems, and text analytics. Learn about transformers, BERT, and other cutting-edge models.",
  //   stats: [
  //     { icon: <VideoIcon />, value: "0", total: "36" },
  //     { icon: <DocumentIcon />, value: "0", total: "28" },
  //     { icon: <CodeIcon />, value: "0", total: "20" },
  //     { icon: <FAQIcon />, value: "0", total: "12" },
  //   ],
  //   trustedBy: [company_1, company_2, company_3, company_4, company_5],
  //   teacherAvatar: [
  //     pic_1,
  //     pic_2,
  //     pic_3,
  //     pic_4,
  //     pic_5,
  //   ],
  //   teacherNames:["Shubham lal" , "Me ",] , 
  //   teacherTitles: ["AI Engineer", "ML Engineer"],
  //   level: "Advanced",
  //   onExplore: () => console.log("Explore More clicked for course 4"),
  // }
];
