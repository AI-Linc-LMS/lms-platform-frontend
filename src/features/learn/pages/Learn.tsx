import {useDispatch, useSelector} from "react-redux";
// import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/LeaderboardTable";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
// import ContinueCourses from "../components/continue-learning/ContinueCourses";
// import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import WelcomeSection from "../components/WelcomeSection";
import EnrolledCourses from "../components/courses/EnrolledCourses";
import { RootState } from "../../../redux/store";
import {useEffect} from "react";
import NoCourse from "../components/courses/NoCourse.tsx";
import {useQuery} from "@tanstack/react-query";
import {getEnrolledCourses} from "../../../services/enrolled-courses-content/coursesApis.ts";
import {setCourses} from "../../../redux/slices/courseSlice.ts";
import SkeletonLoader from "../components/SkeletonLoader.tsx";
import Streak from "../components/Streak.tsx";

const Learn = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const courses = useSelector((state: RootState) => state.courses.courses);
  // Check if user has no enrolled courses
  const hasNoCourses = !courses || courses.length === 0;

    const dispatch = useDispatch();

    const { data, isLoading } = useQuery({
        queryKey: ["Courses"],
        queryFn: () => getEnrolledCourses(clientId),
    });

    //console.log("enrolled courses data:", data);

    useEffect(() => {
        if (data) {
            dispatch(setCourses(data));
        }
    }, [data, dispatch]);

  return (
    <div className="w-full min-h-screen">
      {/* Full width container */}
        {hasNoCourses ? isLoading ? <SkeletonLoader/> : <NoCourse/> :
            <div className="w-full p-0 md:px-4 md:py-2">
            <div className={`grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] gap-6 w-full`}>
                {/* Left Column - Takes all available space */}
                <div className="min-w-0 space-y-4 md:space-y-6 overflow-hidden">
                    <WelcomeSection />

                    <div className="relative">
                        {isLoading ? <SkeletonLoader/>  : (
                            <Streak/>
                        )}
                    </div>
                    <EnrolledCourses />

                    <div className="space-y-4">
                        {/* <ContinueCourses />
                        <ContinueCoursesDetails clientId={clientId} /> */}
                    </div>

                    <div className="space-y-4">
                        <BasedLearningCourses clientId={clientId} />
                    </div>
                </div>

                {/* Right Column - Free-flowing sidebar */}
                <div className="w-full space-y-6">
                    <div className="space-y-6">
                        <Leaderboard clientId={clientId} />
                    </div>
                </div>
            </div>
        </div>}

    </div>
  );
};

export default Learn;
