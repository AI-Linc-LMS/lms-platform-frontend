import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-courses/DashboardPieChart";
import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import CourseContent from "../components/enrolled-courses/CourseContent";
import EnrolledLeaderBoard from "../components/enrolled-courses/EnrolledLeader";

const EnrolledCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  if (!courseId) {
    return (
      <div className="p-4">
        <p className="text-xl mb-4">Course ID not found</p>
        <PrimaryButton onClick={() => navigate("/")}>
          Back to Courses
        </PrimaryButton>
      </div>
    );
  }

  return (
    <>
      <BackToHomeButton />
      <div className="flex flex-col md:flex-row w-full gap-4 p-4">
        <div className="w-full">
          <CourseContent courseId={parseInt(courseId)} />
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <DashboardPieChart />
          <EnrolledLeaderBoard />
        </div>
      </div>
    </>
  );
};

export default EnrolledCourseDetailPage; 