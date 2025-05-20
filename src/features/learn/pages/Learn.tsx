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
    <div className="flex flex-col gap-6 w-full">
      {/* Welcome Banner */}
      <WelcomeSection />

      {/* Main Grid Content */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full">
        {/* Left Column */}
        <div className="flex-1  space-y-4 w-2/3">
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

        {/* Right Column */}
        <div className="flex-1 min-w-0 space-y-4 w-1/3">
          <Leaderboard clientId={clientId} />
          <DailyProgress clientId={clientId} />
          <StreakTable clientId={clientId} />
          <Referrals />
        </div>
      </div>
    </div>
  );
};

export default Learn;
