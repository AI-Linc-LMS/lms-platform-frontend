import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import SecondaryButton from "../../../../commonComponents/common-buttons/secondary-button/SecondaryButton";
import { useQuery } from "@tanstack/react-query";
import { getAllRecommendedCourse, enrollInCourse } from '../../../../services/continue-course-learning/continueCourseApis';
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Define the course data interface
interface CourseData {
    id: number;
    title: string;
    description: string;
    difficulty_level: string;
    duration_in_hours: string | number;
    certificate_available: boolean;
    enrolled_students: {
        total: number;
        students_profile_pic: string[];
    };
    is_free: boolean;
}

// Define mapped course data interface
interface MappedCourseData {
    id: number;
    title: string;
    description: string;
    level: string;
    duration: string | number;
    certification: boolean;
    enrolledStudents: number;
    studentAvatars: string[];
    isFree: boolean;
    clientId: number;
}

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

// Enrollment Modal Component
const EnrollmentModal = ({ isOpen, onClose, courseTitle }: { isOpen: boolean; onClose: () => void; courseTitle: string }) => {
    if (!isOpen) return null;

    const handleBookSeat = () => {
        window.open("https://app.ailinc.com/flagship-program-payment?data=dv_t0riqr_f.5ac86e41", "_blank");
        onClose();
    };

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                >
                    ×
                </button>

                <div className="text-center">
                    <div className="w-16 h-16 bg-[#2A8CB0] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9,22 9,12 15,12 15,22"></polyline>
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Book Your Seat</h3>
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">{courseTitle}</h4>

                    <div className="bg-gradient-to-r from-[#E9F7FA] to-[#F0F9FF] rounded-xl p-4 mb-6 border border-[#80C9E0]">
                        <div className="text-3xl font-bold text-[#2A8CB0] mb-1">₹499</div>
                        <div className="text-sm text-gray-600">Secure your learning seat today</div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                        <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-sm font-medium text-yellow-800">Limited Seats Available!</span>
                        </div>
                        <p className="text-xs text-yellow-700">Only a few seats left for this batch</p>
                    </div>

                    <ul className="text-left text-gray-600 mb-6 space-y-2">
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Reserved seat in live sessions
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Priority access to course materials
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Direct mentor interaction
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Certificate upon completion
                        </li>
                    </ul>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleBookSeat}
                            className="flex-1 px-4 py-3 bg-[#2A8CB0] text-white rounded-xl hover:bg-[#1E7A99] font-medium transition-colors shadow-lg"
                        >
                            Book My Seat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Define CourseCardProps interface
interface CourseCardProps {
    title: string;
    description: string;
    level?: string;
    duration?: string | number;
    certification?: boolean;
    enrolledStudents?: number;
    studentAvatars?: string[];
    isFree: boolean;
    clientId: number;
    courseId: number;
}

// Export the CourseCard component to be used in the See All page
export const CourseCard = ({
    title,
    description,
    level = "Beginner",
    duration = "3 hr 28 mins",
    certification = true,
    // enrolledStudents = 3200,
    studentAvatars = [],
    isFree,
    clientId,
    courseId
}: CourseCardProps) => {
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const navigate = useNavigate();

    // Truncate description if it's too long
    const truncateDescription = (text: string, maxLength: number = 120) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    const handleEnrollNow = async () => {
        console.log('handleEnrollNow called', { isFree, courseId, clientId });
        if (isFree) {
            try {
                console.log('Starting enrollment API call...');
                setIsEnrolling(true);
                await enrollInCourse(clientId, courseId);
                console.log('Enrollment successful, updating state');
                setShowSuccessToast(true);
                setTimeout(() => {
                    setShowSuccessToast(false);
                    navigate(`/courses/${courseId}`);
                }, 900);
            } catch (error) {
                console.error('Enrollment failed:', error);
                alert('Failed to enroll. Please try again.');
            } finally {
                setIsEnrolling(false);
            }
        } else {
            console.log('Course is not free, showing modal');
            setIsEnrollmentModalOpen(true);
        }
    };

    return (
        <div className="flex flex-col">
            {showSuccessToast && (
                <div className="fixed top-4 right-4 z-50">
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Successfully enrolled! Redirecting…</span>
                    </div>
                </div>
            )}
            <div className="rounded-3xl border border-[#80C9E0] p-6 flex flex-col w-full bg-white min-h-[350px]">

                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{truncateDescription(description)}</p>

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

                    {isFree && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2">
                            <span className="text-sm font-semibold">Free</span>
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
                        {/* {formatStudentCount(enrolledStudents)}  */}
                        500+
                        students already enrolled
                    </span>
                </div>

                <div className="flex gap-4 mt-auto">
                    <PrimaryButton
                        className="whitespace-nowrap text-sm"
                        onClick={handleEnrollNow}
                        disabled={isEnrolling}
                    >
                        {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                    </PrimaryButton>

                    <SecondaryButton className="whitespace-nowrap text-sm" onClick={() => alert('Not Interested')} >Not Interested</SecondaryButton>
                </div>
            </div>

            <EnrollmentModal
                isOpen={isEnrollmentModalOpen}
                onClose={() => setIsEnrollmentModalOpen(false)}
                courseTitle={title}
            />
        </div>
    );
};


const BasedLearningCourses = ({ clientId }: { clientId: number }) => {
    const navigate = useNavigate();
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
                        <button
                            onClick={() => navigate('/recommended-learning')}
                            className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[#2A8CB0] text-[13px] md:text-[15px] font-medium font-sans text-[#2A8CB0] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95"
                        >
                            See all
                        </button>
                    </div>
                </div>
                {error && <div className="text-red-500">Error loading courses. Please try again later.</div>}
                {!courses || courses.length === 0 && <div className="text-center text-gray-500 p-4">No courses found.</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto pt-12">
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

    // Check for empty courses
    if (!courses || courses.length === 0) {
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
                        <button
                            onClick={() => navigate('/recommended-learning')}
                            className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[#2A8CB0] text-[13px] md:text-[15px] font-medium font-sans text-[#2A8CB0] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95"
                        >
                            See all
                        </button>
                    </div>
                </div>
                <div className="text-center p-10 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mx-auto mb-4">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No courses available yet</h3>
                    <p className="text-gray-500 mb-6">We couldn't find any recommended courses based on your learning history.</p>
                    <PrimaryButton className="mx-auto" onClick={() => window.location.href = '/courses'}>
                        Explore Courses
                    </PrimaryButton>
                </div>
            </div>
        );
    }

    // Map backend data to UI props, use dummy avatars
    const mappedCourses = courses.map((course: CourseData): MappedCourseData => ({
        title: course.title,
        description: course.description,
        level: course.difficulty_level,
        duration: course.duration_in_hours,
        certification: course.certificate_available,
        enrolledStudents: course.enrolled_students.total || 0,
        studentAvatars: course.enrolled_students.students_profile_pic || [],
        id: course.id, // for key
        isFree: course.is_free,
        clientId: clientId
    }));

    // Only display up to 4 courses in the dashboard
    const displayedCourses = mappedCourses.slice(0, 4);

    return (
        <div>
            <div className="flex flex-row items-center justify-between w-full my-3 md:my-8 pt-12">
                <div>
                    <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
                        Based On Your Learning
                    </h1>
                    <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[18px]">
                        Based on your learnings we think your might like this courses below.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/recommended-learning')}
                        className="w-[80px] md:w-[95px] h-[45px] md:h-[55px] rounded-xl border border-[#2A8CB0] text-[13px] md:text-[15px] font-medium font-sans text-[#2A8CB0] cursor-pointer transition-all duration-200 hover:bg-[#E9F7FA] hover:text-[#1E7A99] hover:scale-95"
                    >
                        See all
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto pt-6">
                {displayedCourses.map((course: MappedCourseData) => (
                    <CourseCard key={course.id} {...course} courseId={course.id} />
                ))}
            </div>
        </div>
    );
};

export default BasedLearningCourses;