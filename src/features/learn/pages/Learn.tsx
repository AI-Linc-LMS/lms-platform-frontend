import CourseDetails from "../components/CoursesDetails";
import EnrolledCourse from "../components/EnrolledCourse";
import Leaderboard from "../components/graphs-components/leaderboard";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import WelcomeSection from "../components/WelcomeSection";

const Learn = () => {
  const leaderboardData = [
    { standing: '#1', name: 'Shane', courseName: 'UI/UX Designer', marks: 1200 },
    { standing: '#2', name: 'Wade', courseName: 'Web Development', marks: 800 },
    { standing: '#3', name: 'Darrell', courseName: 'Business Analytics', marks: 765 },
    { standing: '#4', name: 'Dustin', courseName: 'Android Development', marks: 660 },
    { standing: '#5', name: 'Marvin', courseName: 'Artificial Intelligence', marks: 520 },
    { standing: '#8', name: 'You', courseName: 'UI/UX Designer', marks: 358 },
  ];
  
  return (
    <div className="flex flex-row">
      <div>
        <TimeTrackingDashboard />
        <WelcomeSection />
        <div className="">
          {/* 
                <TimeTrackingDashboard /> */}
        </div>
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
