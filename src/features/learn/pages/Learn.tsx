import Leaderboard from "../components/leaderboard";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import BasedLearning from "../components/based-learning/BasedLearning";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
import ContinueCourses from "../components/continue-learning/ContinueCourses";
import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import CourseDetails from "../components/courses/CoursesDetails";
import EnrolledCourse from "../components/courses/EnrolledCourse";
import Referrals from "../components/referrals/Referrals";
import WelcomeSection from "../components/WelcomeSection";
import {leaderboardData} from "../data/mockLeaderboardData";

const Learn = () => {
  
  return (
    <div>
      <WelcomeSection />
      <div className="flex flex-row items-center justify-between w-full gap-4 ">
        <TimeTrackingDashboard/>
        <Leaderboard data = {leaderboardData}/>
      </div>
      <EnrolledCourse />
      <CourseDetails />
      <ContinueCourses />
      <ContinueCoursesDetails />
      <BasedLearning />
      <div className="flex flex-row items-center justify-between w-full gap-4 ">
        <BasedLearningCourses />
        <Referrals />
      </div>

    </div>
  );
};

export default Learn;
