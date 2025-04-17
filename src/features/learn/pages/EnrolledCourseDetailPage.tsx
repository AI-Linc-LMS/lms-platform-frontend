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



    <>
      <div className="flex items-center mb-6">
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
      <div className="flex flex-row w-full gap-4 ">

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
            <div className="flex flex-row gap-3 my-3 items-center justify-between">
              <div className="flex flex-row gap-3">
                <button className="w-[100px] h-[45px] rounded-full bg-[#E9ECEF] flex flex-row items-center justify-center gap-2 p-3">
                  <svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4382 2.27841C10.2931 2.23181 10.1345 2.24311 9.99978 2.30804C9.85225 2.37913 9.75476 2.5032 9.71973 2.63821L9.24403 4.47206C9.07766 5.11339 8.83545 5.73198 8.52348 6.31599C8.03916 7.22267 7.30632 7.92 6.62647 8.50585L5.18773 9.74564C4.96475 9.93779 4.8474 10.2258 4.87282 10.5198L5.68498 19.9125C5.72601 20.387 6.12244 20.75 6.59635 20.75H11.245C14.3813 20.75 17.0238 18.5677 17.5306 15.6371L18.2361 11.5574C18.3332 10.9959 17.9014 10.4842 17.3348 10.4842H12.1537C11.1766 10.4842 10.4344 9.60756 10.5921 8.64471L11.2548 4.60015C11.3456 4.04613 11.3197 3.47923 11.1787 2.93584C11.1072 2.66009 10.8896 2.42342 10.5832 2.32498L10.4382 2.27841L10.6676 1.56435L10.4382 2.27841ZM9.34862 0.956744C9.83121 0.724197 10.3873 0.686544 10.897 0.850294L11.042 0.896865L10.8126 1.61092L11.042 0.896865C11.819 1.14648 12.4252 1.76719 12.6307 2.5592C12.8241 3.30477 12.8596 4.08256 12.7351 4.84268L12.0724 8.88724C12.0639 8.939 12.1038 8.9842 12.1537 8.9842H17.3348C18.8341 8.9842 19.9695 10.3365 19.7142 11.813L19.0087 15.8928C18.3708 19.581 15.0712 22.25 11.245 22.25H6.59635C5.3427 22.25 4.29852 21.2902 4.19056 20.0417L3.3784 10.649C3.31149 9.87529 3.62022 9.11631 4.20855 8.60933L5.64729 7.36954C6.3025 6.80492 6.85404 6.25767 7.20042 5.60924C7.45699 5.12892 7.65573 4.62107 7.79208 4.09542L8.26779 2.26157C8.41702 1.68627 8.81664 1.21309 9.34862 0.956744ZM0.967665 8.9849C1.36893 8.96758 1.71261 9.26945 1.74721 9.66959L2.71881 20.9061C2.78122 21.6279 2.21268 22.25 1.48671 22.25C0.80289 22.25 0.25 21.6953 0.25 21.0127V9.7342C0.25 9.33256 0.566401 9.00221 0.967665 8.9849Z" fill="#255C79" />
                  </svg>
                  <p className="font-sans font-medium text-[14px] text-[#495057]">35.6K</p>
                </button>
                <button className="w-[100px] h-[45px] rounded-full bg-[#E9ECEF] flex flex-row items-center justify-center gap-2 p-3">
                  <svg width="20" height="23" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4382 20.7216C10.2931 20.7682 10.1345 20.7569 9.99978 20.692C9.85225 20.6209 9.75476 20.4968 9.71973 20.3618L9.24403 18.5279C9.07766 17.8866 8.83545 17.268 8.52348 16.684C8.03916 15.7773 7.30632 15.08 6.62647 14.4942L5.18773 13.2544C4.96475 13.0622 4.8474 12.7742 4.87282 12.4802L5.68498 3.08754C5.72601 2.61303 6.12244 2.25 6.59635 2.25H11.245C14.3813 2.25 17.0238 4.43226 17.5306 7.36285L18.2361 11.4426C18.3332 12.0041 17.9014 12.5158 17.3348 12.5158H12.1537C11.1766 12.5158 10.4344 13.3924 10.5921 14.3553L11.2548 18.3998C11.3456 18.9539 11.3197 19.5208 11.1787 20.0642C11.1072 20.3399 10.8896 20.5766 10.5832 20.675L10.4382 20.7216L10.6676 21.4356L10.4382 20.7216ZM9.34862 22.0433C9.83121 22.2758 10.3873 22.3135 10.897 22.1497L11.042 22.1031L10.8126 21.3891L11.042 22.1031C11.819 21.8535 12.4252 21.2328 12.6307 20.4408C12.8241 19.6952 12.8596 18.9174 12.7351 18.1573L12.0724 14.1128C12.0639 14.061 12.1038 14.0158 12.1537 14.0158H17.3348C18.8341 14.0158 19.9695 12.6635 19.7142 11.187L19.0087 7.10725C18.3708 3.41896 15.0712 0.750002 11.245 0.750002H6.59635C5.3427 0.750002 4.29852 1.70975 4.19056 2.95832L3.3784 12.351C3.31149 13.1247 3.62022 13.8837 4.20855 14.3907L5.64729 15.6305C6.3025 16.1951 6.85404 16.7423 7.20042 17.3908C7.45699 17.8711 7.65573 18.3789 7.79208 18.9046L8.26779 20.7384C8.41702 21.3137 8.81664 21.7869 9.34862 22.0433ZM0.967665 14.0151C1.36893 14.0324 1.71261 13.7306 1.74721 13.3304L2.71881 2.09389C2.78122 1.3721 2.21268 0.750002 1.48671 0.750002C0.80289 0.750002 0.25 1.30474 0.25 1.98726V13.2658C0.25 13.6674 0.566401 13.9978 0.967665 14.0151Z" fill="#255C79" />
                  </svg>

                  <p className="font-sans font-medium text-[14px] text-[#495057]">123</p>
                </button>
              </div>
              <div>
                <button className="flex flex-row gap-3 ">
                  <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 5.75C11.4142 5.75 11.75 6.08579 11.75 6.5V11.5C11.75 11.9142 11.4142 12.25 11 12.25C10.5858 12.25 10.25 11.9142 10.25 11.5V6.5C10.25 6.08579 10.5858 5.75 11 5.75Z" fill="#AE0606" />
                    <path d="M11 15.5C11.5523 15.5 12 15.0523 12 14.5C12 13.9477 11.5523 13.5 11 13.5C10.4477 13.5 9.99998 13.9477 9.99998 14.5C9.99998 15.0523 10.4477 15.5 11 15.5Z" fill="#AE0606" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.2944 2.97643C8.36631 1.61493 9.50182 0.75 11 0.75C12.4981 0.75 13.6336 1.61493 14.7056 2.97643C15.7598 4.31544 16.8769 6.29622 18.3063 8.83053L18.7418 9.60267C19.9234 11.6976 20.8566 13.3523 21.3468 14.6804C21.8478 16.0376 21.9668 17.2699 21.209 18.3569C20.4736 19.4118 19.2466 19.8434 17.6991 20.0471C16.1576 20.25 14.0845 20.25 11.4248 20.25H10.5752C7.91552 20.25 5.84239 20.25 4.30082 20.0471C2.75331 19.8434 1.52637 19.4118 0.790989 18.3569C0.0331793 17.2699 0.152183 16.0376 0.653135 14.6804C1.14334 13.3523 2.07658 11.6977 3.25818 9.6027L3.69361 8.83067C5.123 6.29629 6.24019 4.31547 7.2944 2.97643ZM8.47297 3.90432C7.49896 5.14148 6.43704 7.01988 4.96495 9.62994L4.60129 10.2747C3.37507 12.4488 2.50368 13.9986 2.06034 15.1998C1.6227 16.3855 1.68338 17.0141 2.02148 17.4991C2.38202 18.0163 3.05873 18.3706 4.49659 18.5599C5.92858 18.7484 7.9026 18.75 10.6363 18.75H11.3636C14.0974 18.75 16.0714 18.7484 17.5034 18.5599C18.9412 18.3706 19.6179 18.0163 19.9785 17.4991C20.3166 17.0141 20.3773 16.3855 19.9396 15.1998C19.4963 13.9986 18.6249 12.4488 17.3987 10.2747L17.035 9.62993C15.5629 7.01987 14.501 5.14148 13.527 3.90431C12.562 2.67865 11.8126 2.25 11 2.25C10.1874 2.25 9.43793 2.67865 8.47297 3.90432Z" fill="#AE0606" />
                  </svg>
                  <p className="text-[#AE0606] font-medium text-[14px] ">Report an issue</p>

                </button>
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