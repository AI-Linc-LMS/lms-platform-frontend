import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Course } from "../types/course.types";
import { defaultCourses } from "../data/mockCourses";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-courses/DashboardPieChart";
import BackToHomeButton from "../components/enrolled-courses/BackToHomeButton";
import CourseContent from "../components/enrolled-courses/CourseContent";

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
      <BackToHomeButton />
      <div className="flex flex-row w-full gap-4">
        <div className="w-full">
          <CourseContent course={course} />
        </div>
        <DashboardPieChart />
      </div>
    </>
  );
};

export default EnrolledCourseDetailPage; 