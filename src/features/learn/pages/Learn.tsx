import Leaderboard from "../components/LeaderboardTable";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import BasedLearning from "../components/based-learning/BasedLearning";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
import ContinueCourses from "../components/continue-learning/ContinueCourses";
import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import Referrals from "../components/referrals/Referrals";
import WelcomeSection from "../components/WelcomeSection";
import DailyProgress from "../components/DailyProgressTable";
import StreakTable from "../components/StreakTable";
import EnrolledCourses from "../components/courses/EnrolledCourses";

const Learn = () => {
  return (
    <div className="px-2 md:px-0">
      <WelcomeSection />
      <div className="flex flex-col md:flex-row justify-between mt-6 gap-6">
        <div className="flex flex-col w-full gap-8">
          <TimeTrackingDashboard />
          <EnrolledCourses />

          <div className="space-y-2">
            <ContinueCourses />
            <ContinueCoursesDetails />
          </div>
 
          <div className="space-y-2">
            <BasedLearning />
            <BasedLearningCourses />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full md:w-auto md:min-w-[300px] lg:min-w-[350px]">
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