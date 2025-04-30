import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCourseById } from "../../../services/courses-content/courseContentApis"; 
import { CourseContent as CourseContentType } from "../types/course.types";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-courses/DashboardPieChart";
import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import CourseContent from "../components/enrolled-courses/CourseContent";
import EnrolledLeaderBoard from "../components/enrolled-courses/EnrolledLeader";

const EnrolledCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Fetch course details using tanstack-query
  const { data: course, isLoading, error } = useQuery<CourseContentType>({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(1, Number(courseId)), 
    enabled: !!courseId, 
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl">Course not found</p>
        <PrimaryButton onClick={() => navigate("/")}>
          Back to Courses
        </PrimaryButton>
      </div>
    );
  }

  return (
    <>
      <BackToHomeButton />
      <div className="flex flex-row w-full gap-4">
        <div className="w-full">
          <CourseContent courseContent={course} isLoading={isLoading} error={error} />
        </div>
        <div className="flex flex-col gap-4">
          <DashboardPieChart />
          <EnrolledLeaderBoard />
        </div>
      </div>
    </>
  );
};

export default EnrolledCourseDetailPage;