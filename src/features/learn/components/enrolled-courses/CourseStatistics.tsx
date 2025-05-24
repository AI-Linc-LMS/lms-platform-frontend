import React from "react";
import RefreshIcon from "../../../../commonComponents/icons/enrolled-courses/RefreshIcon";
import UserGroupIcon from "../../../../commonComponents/icons/enrolled-courses/UserGroupIcon";
import CertificationIcon from "../../../../commonComponents/icons/enrolled-courses/CertificationIcon";
import { Course } from "../../types/course.types";

interface CourseStatisticsProps {
  course: Course;
}

const CourseStatistics: React.FC<CourseStatisticsProps> = ({ course }) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 my-3">
      <div className="w-full md:w-[240px] h-[45px] rounded-xl border border-[#DEE2E6] flex flex-row items-center justify-center gap-2 p-3">
        <div>
          <RefreshIcon />
        </div>
        <div>
          <p className="text-xs md:text-[13px]">
            Last updated on: {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>
      <div className="w-full md:w-[240px] h-[45px] rounded-xl border border-[#DEE2E6] flex flex-row items-center justify-center gap-2 p-3">
        <div>
          <UserGroupIcon />
        </div>
        <div>
          <p className="text-xs md:text-[13px]">Enrolled: {course.enrolled_students} students</p>
        </div>
      </div>
      <div className="w-full md:w-[240px] h-[45px] rounded-xl border border-[#DEE2E6] flex flex-row items-center justify-center gap-2 p-3">
        <div>
          <CertificationIcon />
        </div>
        <div>
          <p className="text-xs md:text-[13px]">{course.is_certified ? "Certification Available" : "No Certification"}</p>
        </div>
      </div>
    </div>
  );
};

export default CourseStatistics; 