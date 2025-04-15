import CourseDetails from "../components/CoursesDetails";
import EnrolledCourse from "../components/EnrolledCourse";
import Leaderboard from "../components/leaderboard";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import WelcomeSection from "../components/WelcomeSection";
import {leaderboardData} from "../data/mockLeaderboardData";

const Learn = () => {
  
  return (
    <div className="flex flex-row">
      <div className="mr-5">
        <WelcomeSection />
        <TimeTrackingDashboard />
        <EnrolledCourse />
        <CourseDetails />
      </div>
      <div>
          <Leaderboard data={leaderboardData}/>
      </div>
    </div>
  );
};

export default Learn;
