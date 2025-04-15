import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import SecondaryButton from "../../../../commonComponents/common-buttons/secondary-button/SecondaryButton";
import Pic_1 from "../../../../assets/learn/based-learning/pic-1.jpeg";
import Pic_2 from "../../../../assets/learn/based-learning/pic-2.jpeg";
import Pic_3 from "../../../../assets/learn/based-learning/pic-3.jpeg";
import Pic_4 from "../../../../assets/learn/based-learning/pic-4.jpeg";
import Pic_5 from "../../../../assets/learn/based-learning/pic-5.jpeg";

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
        <div className="rounded-3xl border border-[#80C9E0] p-6 flex flex-col w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{description}</p>

            <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                    <ZapIcon />
                    <span className="text-sm">{level}</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                    <ClockIcon />
                    <span className="text-sm">{duration}</span>
                </div>

                {certification && (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
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
                <PrimaryButton onClick={() => alert('Enrolled!')}>Enroll Now</PrimaryButton>


                <SecondaryButton onClick={() => alert('Not Interested')} >Not Interested</SecondaryButton>


            </div>
        </div>
    );
};

// Example usage with course data
const BasedLearningCourses = () => {
    // Sample data for courses
    const courses = [
        {
            id: 1,
            title: "Mern Stack",
            description: "Learn MongoDB, Express, React, and Node.js development.",
            level: "Beginner",
            duration: "3 hr 28 mins",
            certification: true,
            enrolledStudents: 3200,
            studentAvatars: [
                Pic_1,
                Pic_2,
                Pic_3,
                Pic_4,
                Pic_5,


            ]
        },
        {
            id: 2,
            title: "SQL For Beginners",
            description: "Master database fundamentals with SQL queries and design.",
            level: "Beginner",
            duration: "3 hr 28 mins",
            certification: true,
            enrolledStudents: 3200,
            studentAvatars: [
                Pic_1,
                Pic_2,
                Pic_3,
                Pic_4,
                Pic_5,

            ]
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto">
            {courses.map(course => (
                <CourseCard key={course.id} {...course} />
            ))}
        </div>
    );
};

export default BasedLearningCourses;