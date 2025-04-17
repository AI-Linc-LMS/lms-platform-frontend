import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Course } from "../types/course.types";
import { defaultCourses } from "../data/mockCourses";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-course-card/DashboardPieChart";
import RefreshIcon from "../../../commonComponents/icons/enrolled-courses/RefreshIcon";
import UserGroupIcon from "../../../commonComponents/icons/enrolled-courses/UserGroupIcon";
import CertificationIcon from "../../../commonComponents/icons/enrolled-courses/CertificationIcon";


const EnrolledCourseDetailPage: React.FC = () => {
  const { courseName } = useParams<{ courseName: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulating API call to fetch course by name
    // In a real app, you would make an API request here
    setLoading(true);

    // Convert URL slug back to a format that can be compared with course titles
    const normalizedCourseName = courseName?.replace(/-/g, ' ');

    // For now, find the course in our mock data that matches the URL slug
    const foundCourse = defaultCourses.find(
      (c) => c.title.toLowerCase() === normalizedCourseName
    );

    setTimeout(() => {
      setCourse(foundCourse || null);
      setLoading(false);
    }, 500); // Simulate network delay
  }, [courseName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="">
        <p className="text-xl">Course not found</p>
        <PrimaryButton onClick={() => navigate("/")}>
          Back to Courses
        </PrimaryButton>
      </div>
    );
  }

  return (



    <><div className="flex items-center mb-6">
      <button
        onClick={() => navigate("/")}
        className="h-[52px] w-[52px] bg-[#12293A] rounded-full text-[#255C79] flex items-center justify-center mr-4"
      >
        <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 9H1M1 9L8.5 1.5M1 9L8.5 16.5" stroke="#EFF9FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span className=" font-normal text-[22px] font-sans text-[#12293A]">Back to Home</span>
    </div>
      <div className="flex items-center gap-4 ">

        <div className="w-full">
          <div className="w-full bg-white rounded-3xl p-6 shadow-sm">
            <h1 className="font-semibold text-[25px] font-sans ">{course.title}</h1>
            <p className="text-[14px] text-[#6C757D] font-normal">{course.description}</p>
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
                <div><p className="text-[13px]">Enrolled: 23,879 students</p></div>

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

          </div>

        </div>


        <DashboardPieChart />


      </div>
    </>
  );
};

export default EnrolledCourseDetailPage; 