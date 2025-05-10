import { CodeIcon, DocumentIcon, FAQIcon, VideoIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";
import CourseCard from "./CourseCard";
import { CourseData, CourseIconData } from "./types";

const ContinueCoursesDetails = () => {
  // Common icons data setup
  const createIconData = (): CourseIconData[] => [
    { icon: <VideoIcon />, completed: 25, total: 52 },
    { icon: <DocumentIcon />, completed: 25, total: 52 },
    { icon: <CodeIcon />, completed: 25, total: 54 },
    { icon: <FAQIcon />, completed: 25, total: 54 },
  ];
  
  // Course data
  const courses: CourseData[] = [
    {
      title: "Data Analytics",
      description: "Lorem ipsum dolor sit amet.",
      category: "Pro",
      moduleNumber: 2,
      totalModules: 28,
      moduleName: "Introduction to data analytics",
      iconData: createIconData(),
      onContinue: () => console.log("continue Button Clicked"),
    },
    {
      title: "Introduction to UI / UX",
      description: "Lorem ipsum dolor sit amet.",
      category: "Beginner",
      moduleNumber: 5,
      totalModules: 20,
      moduleName: "UI Design principles",
      iconData: createIconData(),
      onContinue: () => console.log("continue Button Clicked"),
    },
    {
      title: "Artificial Intelligence & Coding",
      description: "Lorem ipsum dolor sit amet.",
      category: "Beginner",
      moduleNumber: 18, 
      totalModules: 24,
      moduleName: "Machine Learning basics",
      iconData: createIconData(),
      onContinue: () => console.log("continue Button Clicked"),
    },
    {
      title: "Business Analytics & Planning",
      description: "Lorem ipsum dolor sit amet.",
      category: "Beginner",
      moduleNumber: 3,
      totalModules: 15,
      moduleName: "Market research fundamentals",
      iconData: createIconData(),
      onContinue: () => console.log("continue Button Clicked"),
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {courses.map((course, index) => (
        <CourseCard
          key={index}
          {...course}
        />
      ))}
    </div>
  );
};

export default ContinueCoursesDetails;
