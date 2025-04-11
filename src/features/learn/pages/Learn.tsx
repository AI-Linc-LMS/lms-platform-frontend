import CourseDetails from "../components/CoursesDetails";
import EnrolledCourse from "../components/EnrolledCourse";
// import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
// import LeaderboardUI from "../components/LeaderBoard";
// import TotalHoursSpentGraph from "../components/TotalHoursSpentGraph";
import WelcomeSection from "../components/WelcomeSection";

const Learn = () => {
    return (
        <div>
            <WelcomeSection />
            {/* <h1>Learn</h1> */}
            {/* <TotalHoursSpentGraph /> */}
            <div className="">

                {/* <TimeTrackingDashboard /> */}
                {/* <LeaderboardUI /> */}
            </div>
            <EnrolledCourse />
            <CourseDetails/>    

        </div>
    );
};

export default Learn;