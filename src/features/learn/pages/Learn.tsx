import CourseDetails from "../components/CoursesDetails";
import EnrolledCourse from "../components/EnrolledCourse";
// import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";

import WelcomeSection from "../components/WelcomeSection";

const Learn = () => {
  return (
    <div>
      <WelcomeSection />
      {/* <h1>Learn</h1> */}

      <div className="">
        {/* 
                <TimeTrackingDashboard /> */}
      </div>
      <EnrolledCourse />
      <CourseDetails />
    </div>
  );
};

export default Learn;
