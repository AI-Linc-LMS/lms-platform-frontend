// This file contains mock data for courses in the learn section of the application.
import { Course } from "../types/course.types";
// import {
//   VideoIcon,
//   DocumentIcon,
//   CodeIcon,
//   FAQIcon,
// } from "../../../commonComponents/icons/learnIcons/CourseIcons";

import pic_1 from "../../../assets/exploremore/mentor-avatars/mentor-1.jpeg";
// import pic_2 from "../../../assets/exploremore/mentor-avatars/mentor-2.png";
// import pic_3 from "../../../assets/exploremore/mentor-avatars/mentor-3.png";
// import pic_4 from "../../../assets/exploremore/mentor-avatars/mentor-4.png";
// import pic_5 from "../../../assets/exploremore/mentor-avatars/mentor-5.png";

import company_1 from "../../../assets/dashboard_assets/company-logos/goggle.png";
import company_2 from "../../../assets/dashboard_assets/company-logos/microsoft.png";
import company_3 from "../../../assets/dashboard_assets/company-logos/tcs.png";
import company_4 from "../../../assets/dashboard_assets/company-logos/wipro.png";
import company_5 from "../../../assets/dashboard_assets/company-logos/dello.png";

export const defaultCourses: Course[] = [
  {
    id: 1,
    title: "Machine Learning Deployment",
    description: "Master the art of deploying machine learning models to production environments. This course covers containerization, API development, scaling, and monitoring for ML systems.",
    enrolled_students: [1, 2, 3],
    instructors: [
      {
        id: 1,
        name: "Shubham Lal",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "AI Engineer"
      },
      {
        id: 2,
        name: "Me",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "ML Engineer"
      }
    ],
    is_certified: true,
    modules: []
  },
  {
    id: 2,
    title: "Deep Learning Fundamentals",
    description: "Comprehensive introduction to deep learning concepts and techniques. Build and train neural networks for image recognition, natural language processing, and more.",
    enrolled_students: [1, 2, 3, 4],
    instructors: [
      {
        id: 1,
        name: "Shubham Lal",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "AI Engineer"
      },
      {
        id: 2,
        name: "Me",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "ML Engineer"
      }
    ],
    is_certified: true,
    modules: []
  },
  {
    id: 3,
    title: "Data Science for Business",
    description: "Learn how to leverage data science techniques to solve real business problems. From data collection and analysis to visualization and decision-making.",
    enrolled_students: [1, 2],
    instructors: [
      {
        id: 1,
        name: "Shubham Lal",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "AI Engineer"
      },
      {
        id: 2,
        name: "Me",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "ML Engineer"
      }
    ],
    is_certified: true,
    modules: []
  },
  {
    id: 4,
    title: "Natural Language Processing",
    description: "Deep dive into NLP technologies powering chatbots, translation systems, and text analytics. Learn about transformers, BERT, and other cutting-edge models.",
    enrolled_students: [1, 2, 3, 4, 5],
    instructors: [
      {
        id: 1,
        name: "Shubham Lal",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "AI Engineer"
      },
      {
        id: 2,
        name: "Me",
        profile_pic_url: "/api/placeholder/32/32",
        designation: "ML Engineer"
      }
    ],
    is_certified: true,
    modules: []
  }
];
