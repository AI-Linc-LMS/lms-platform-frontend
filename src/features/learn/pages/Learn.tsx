import Leaderboard from "../components/LeaderboardTable";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
import ContinueCourses from "../components/continue-learning/ContinueCourses";
import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import Referrals from "../components/referrals/Referrals";
import WelcomeSection from "../components/WelcomeSection";
import DailyProgress from "../components/DailyProgressTable";
import StreakTable from "../components/StreakTable";
import EnrolledCourses from "../components/courses/EnrolledCourses";


const Learn = () => {

  const clientId = import.meta.env.VITE_CLIENT_ID;
  return (
    <div className="px-2 md:px-0">
      <WelcomeSection />
      <div className="flex flex-col md:flex-row justify-between mt-6 gap-6">
        <div className="flex flex-col w-full gap-8">
          <TimeTrackingDashboard />
          <EnrolledCourses />

          <div className="space-y-2">
            <ContinueCourses />
            <ContinueCoursesDetails clientId={clientId} />
          </div>
 
          <div className="space-y-2">
            <BasedLearningCourses clientId={clientId} />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full md:w-auto md:min-w-[300px] lg:min-w-[350px]">
          <Leaderboard clientId={clientId} />
          <DailyProgress clientId={clientId} />
          <StreakTable clientId={clientId} />
          <Referrals />
        </div>
      </div>
    </div>
  );
}

export default Learn;