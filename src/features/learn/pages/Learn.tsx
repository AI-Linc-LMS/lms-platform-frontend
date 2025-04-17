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
import { leaderboardData } from "../data/mockLeaderboardData";
import DailyProgress from "../components/DailyProgessTable";
import { dailyProgressData } from "../data/mockDailyProgressTable";
import StreakTable from "../components/StreakTable";

const Learn = () => {
  return (
    <div>
      <WelcomeSection />
      <div className="flex flex-row items-center justify-between w-full gap-4 ">
        <TimeTrackingDashboard />
        <Leaderboard data={leaderboardData} />
      </div>

      <EnrolledCourse />

      <div className="flex gap-4 ">
        <CourseDetails />
        <DailyProgress data={dailyProgressData} progressMinutes={20} />
      </div>

      <ContinueCourses />
      <div className="flex gap-4 w-full">
        <ContinueCoursesDetails />
        <StreakTable activeDays={[1, 2, 3, 12, 13, 15, 16, 17]} />
      </div>

      <BasedLearning />
      <div className="flex flex-row items-center justify-between w-full gap-4 ">
        <BasedLearningCourses />
        <Referrals />
      </div>
    </div>
  );
};

export default Learn;
