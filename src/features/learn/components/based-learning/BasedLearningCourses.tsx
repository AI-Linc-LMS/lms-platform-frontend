import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import SecondaryButton from "../../../../commonComponents/common-buttons/secondary-button/SecondaryButton";
import Pic_1 from "../../../../assets/learn/based-learning/pic-1.jpeg";
import { useQuery } from "@tanstack/react-query";
import { getAllRecommendedCourse } from '../../../../services/continue-course-learning/continueCourseApis';


// Simple SVG icons as React components
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const ZapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
);

const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
);

// Course Card Component with dynamic data
interface CourseCardProps {
    title: string;
    description: string;
    level?: string;
    duration?: string;
    certification?: boolean;
    enrolledStudents?: number;
    studentAvatars?: string[];
}

const CourseCard = ({
    title,
    description,
    level = "Beginner",
    duration = "3 hr 28 mins",
    certification = true,
    enrolledStudents = 3200,
    studentAvatars = []
}: CourseCardProps) => {
    // Format number with k for thousands
    const formatStudentCount = (count: number) => {
        return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count;
    };

    return (
        <div className="flex flex-col">

            <div className="rounded-3xl border border-[#80C9E0] p-6 flex flex-col w-full bg-white min-h-[350px]">

                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{description}</p>

                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2 border border-[#DEE2E6] rounded-xl px-4 py-2">
                        <ZapIcon />
                        <span className="text-sm">{level}</span>
                    </div>

                    <div className="flex items-center gap-2 border border-[#DEE2E6] rounded-xl  px-4 py-2">
                        <ClockIcon />
                        <span className="text-sm">{duration} hours</span>
                    </div>

                    {certification && (
                        <div className="flex items-center gap-2 border border-[#DEE2E6] rounded-xl  px-4 py-2">
                            <AwardIcon />
                            <span className="text-sm">Certification Available</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center mb-6">
                    <div className="flex -space-x-2 mr-3">
                        {studentAvatars.slice(0, 4).map((avatar, index) => (
                            <div key={index} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden">
                                <img
                                    src={avatar || "/api/placeholder/32/32"}
                                    alt="Student avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                    <span className="text-gray-700">
                        {formatStudentCount(enrolledStudents)} students already enrolled
                    </span>
                </div>

                <div className="flex gap-4 mt-auto">
                    <PrimaryButton className="whitespace-nowrap text-sm" onClick={() => alert('Enrolled!')}>Enroll Now</PrimaryButton>


                    <SecondaryButton className="whitespace-nowrap text-sm" onClick={() => alert('Not Interested')} >Not Interested</SecondaryButton>


                </div>
            </div>
        </div>
    );
};

const DUMMY_AVATAR = Pic_1;

const BasedLearningCourses = ({ clientId }: { clientId: number }) => {
    // Fetch data using TanStack Query
    const { data: courses, isLoading, error } = useQuery({
        queryKey: ["basedLearningCourses", clientId],
        queryFn: () => getAllRecommendedCourse(clientId),
    });

    // Skeleton loader and error
    if (isLoading || error) {
        return (
            <div>
                <div className="flex flex-row items-center justify-between w-full my-3 md:my-8">
                    <div>
                        <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
                            Based On Your Learning
                        </h1>
                        <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[18px]">
                            Based on your learnings we think your might like this courses below.
                        </p>
                    </div>
                    <div>
                        <button className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[#2A8CB0] text-[13px] md:text-[15px] font-medium font-sans text-[#2A8CB0] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95">
                            See all
                        </button>
                    </div>
                </div>
                {error && <div className="text-red-500">Error loading courses. Please try again later.</div>}
                {!courses || courses.length === 0 && <div className="text-center text-gray-500 p-4">No courses found.</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto">
                    {[1, 2].map((i) => (
                        <div key={i} className="rounded-3xl border border-[#80C9E0] p-6 flex flex-col w-full bg-white min-h-[350px] animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                            <div className="flex flex-wrap gap-4 mb-8">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="h-8 w-28 bg-gray-200 rounded-xl"></div>
                                ))}
                            </div>
                            <div className="flex items-center mb-6">
                                <div className="flex -space-x-2 mr-3">
                                    {[1, 2, 3, 4].map((k) => (
                                        <div key={k} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                                    ))}
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </div>
                            <div className="flex gap-4 mt-auto">
                                <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
                                <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }


    // Map backend data to UI props, use dummy avatars
    const mappedCourses = courses.map((course: any) => ({
        title: course.title,
        description: course.description,
        level: course.difficulty_level,
        duration: course.duration_in_hours,
        certification: course.certificate_available,
        enrolledStudents: course.enrolled_students.length,
        studentAvatars: Array(Math.min(course.enrolled_students.length, 4)).fill(DUMMY_AVATAR),
        id: course.id, // for key
    }));

    return (
        <div>
            <div className="flex flex-row items-center justify-between w-full my-3 md:my-8">
                <div>
                    <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
                        Based On Your Learning
                    </h1>
                    <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[18px]">
                        Based on your learnings we think your might like this courses below.
                    </p>
                </div>
                <div>
                    <button className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[#2A8CB0] text-[13px] md:text-[15px] font-medium font-sans text-[#2A8CB0] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95">
                        See all
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto">
                {mappedCourses.map((course: any) => (
                    <CourseCard key={course.id} {...course} />
                ))}
            </div>
        </div>
    );
};

export default BasedLearningCourses;