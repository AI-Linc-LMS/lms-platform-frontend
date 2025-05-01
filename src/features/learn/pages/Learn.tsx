import Leaderboard from "../components/LeaderboardTable";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import BasedLearning from "../components/based-learning/BasedLearning";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
import ContinueCourses from "../components/continue-learning/ContinueCourses";
import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import CourseDetails from "../components/courses/CoursesDetails";
import EnrolledCourse from "../components/courses/EnrolledCourse";
import Referrals from "../components/referrals/Referrals";
import WelcomeSection from "../components/WelcomeSection";
import DailyProgress from "../components/DailyProgressTable";
import StreakTable from "../components/StreakTable";

const Learn = () => {
  
  return (
    <div>
      <WelcomeSection />
      <div className="flex flex-row justify-between mt-10 gap-8">
        <div className="flex flex-col justify-between w-full gap-4 mt-4">
          <TimeTrackingDashboard />

          <EnrolledCourse />
          <CourseDetails />

          <ContinueCourses />
          <ContinueCoursesDetails />
 
          <BasedLearning />
          <BasedLearningCourses />
        </div>

        <div className="flex flex-col gap-10">
          <Leaderboard clientId={1} />
          <DailyProgress clientId={1} />
          <StreakTable clientId={1} />
          <Referrals />
        </div>
      </div>
    </div>
  );
}

export default Learn;