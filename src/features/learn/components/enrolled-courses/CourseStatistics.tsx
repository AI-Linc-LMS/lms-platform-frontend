import React from "react";
import RefreshIcon from "../../../../commonComponents/icons/enrolled-courses/RefreshIcon";
import UserGroupIcon from "../../../../commonComponents/icons/enrolled-courses/UserGroupIcon";
import CertificationIcon from "../../../../commonComponents/icons/enrolled-courses/CertificationIcon";

const CourseStatistics: React.FC = () => {
  return (
    <div className="flex flex-row gap-3 my-3">
      <div className="w-[240px] h-[45px] rounded-xl border border-[#DEE2E6] flex flex-row items-center justify-center gap-2 p-3">
        <div>
          <RefreshIcon />
        </div>
        <div>
          <p className="text-[13px]">Last updated on: 27-07-2025</p>
        </div>
      </div>
      <div className="w-[240px] h-[45px] rounded-xl border border-[#DEE2E6] flex flex-row items-center justify-center gap-2 p-3">
        <div>
          <UserGroupIcon />
        </div>
        <div>
          <p className="text-[13px]">Enrolled: 23,879 students</p>
        </div>
      </div>
      <div className="w-[240px] h-[45px] rounded-xl border border-[#DEE2E6] flex flex-row items-center justify-center gap-2 p-3">
        <div>
          <CertificationIcon />
        </div>
        <div>
          <p className="text-[13px]">Certification Available</p>
        </div>
      </div>
    </div>
  );
};

export default CourseStatistics; 