import ContinueCourses from "../components/continue-learning/ContinueCourses";
import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import CourseDetails from "../components/courses/CoursesDetails";
import EnrolledCourse from "../components/courses/EnrolledCourse";

// import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";

import WelcomeSection from "../components/WelcomeSection";

const Learn = () => {
  return (
    <div>
      <WelcomeSection />

      <EnrolledCourse />

      <CourseDetails />
      <ContinueCourses />
      <ContinueCoursesDetails />

    

    
    </div>
  );
};

export default Learn;
