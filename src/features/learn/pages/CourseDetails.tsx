// import React, { useState } from 'react';
// import EnrollmentModal from '../../../commonComponents/modals/EnrollmentModal';

// const CourseDetails: React.FC = () => {
//   const [showModal, setShowModal] = useState(false);

//   const handleEnroll = () => {
//     //console.log('User enrolled in the course');
//     setShowModal(false);
//     // Additional enrollment logic here
//   };

//   const handleDecline = () => {
//     //console.log('User declined enrollment');
//     setShowModal(false);
//     // Additional decline logic here
//   };

//   return (
//     <div className="w-full px-4 md:px-6 py-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-8">
//           <div className="flex flex-col md:flex-row gap-6">
//             {/* Course image */}
//             <div className="w-full md:w-1/3">
//               <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
//                 <img
//                   src="https://via.placeholder.com/600x400?text=Course+Image"
//                   alt="Course"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>

//             {/* Course details */}
//             <div className="w-full md:w-2/3">
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
//                 Advanced Machine Learning
//               </h1>
//               <div className="flex flex-wrap gap-2 mb-4">
//                 <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">AI</span>
//                 <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Python</span>
//                 <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Expert</span>
//               </div>
//               <p className="text-gray-700 mb-4">
//                 Take your machine learning skills to the next level with this advanced course.
//                 Learn cutting-edge techniques and models that will set you apart in the field.
//               </p>
//               <div className="flex items-center mb-6">
//                 <div className="mr-4">
//                   <span className="block text-gray-500 text-sm">Instructor</span>
//                   <span className="font-medium">Dr. Jane Smith</span>
//                 </div>
//                 <div className="mr-4">
//                   <span className="block text-gray-500 text-sm">Duration</span>
//                   <span className="font-medium">8 weeks</span>
//                 </div>
//                 <div>
//                   <span className="block text-gray-500 text-sm">Level</span>
//                   <span className="font-medium">Advanced</span>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowModal(true)}
//                 className="px-6 py-3 bg-[#1F4F68] text-white font-medium rounded-lg hover:bg-[#163a4f] transition-colors duration-200"
//               >
//                 Enroll in Course
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Course content section */}
//         <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
//           <h2 className="text-xl font-bold mb-4">Course Content</h2>
//           <div className="space-y-4">
//             {[1, 2, 3].map((module) => (
//               <div key={module} className="border border-gray-200 rounded-lg p-4">
//                 <h3 className="font-medium text-lg mb-2">Module {module}: Example Topic</h3>
//                 <p className="text-gray-600 mb-3">
//                   Learn the fundamentals of this essential topic through hands-on tutorials and exercises.
//                 </p>
//                 <div className="flex items-center text-sm text-gray-500">
//                   <span className="mr-4">3 Lessons</span>
//                   <span>45 minutes</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Enrollment Modal */}
//       <EnrollmentModal
//         isOpen={showModal}
//         onClose={() => setShowModal(false)}
//         courseTitle="Advanced Machine Learning"
//         courseDescription="Ready to master the latest machine learning techniques? This course will help you become an expert!"
//         onEnroll={handleEnroll}
//         onDecline={handleDecline}
//       />
//     </div>
//   );
// };

// export default CourseDetails;
