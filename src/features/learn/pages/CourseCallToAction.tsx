// import React from 'react';
// import FixedCTAButtons from '../../../commonComponents/enrollment-buttons/FixedCTAButtons';

// const CourseCallToAction: React.FC = () => {
//   const handleEnroll = () => {
//     //console.log('User enrolled');
//     // Add your enrollment logic here
//   };

//   const handleDecline = () => {
//     //console.log('User declined');
//     // Add your decline logic here
//   };

//   return (
//     <div className="w-full min-h-screen bg-gray-100 flex flex-col">
//       {/* Course Preview Content */}
//       <div className="flex-grow p-4 md:p-6">
//         <div className="max-w-4xl mx-auto">
//           <h1 className="text-2xl md:text-3xl font-bold mb-6">Data Science Fundamentals</h1>

//           <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6">
//             <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
//             <p className="mb-4">
//               This comprehensive course will teach you the essential skills needed to become
//               a proficient data scientist. From statistics to machine learning, you'll master
//               the tools and techniques used by professionals in the field.
//             </p>

//             <div className="grid md:grid-cols-2 gap-4 mb-6">
//               <div className="border border-gray-200 rounded-lg p-4">
//                 <h3 className="font-medium mb-2">What You'll Learn</h3>
//                 <ul className="list-disc pl-5 space-y-1">
//                   <li>Statistical analysis techniques</li>
//                   <li>Data visualization with Python</li>
//                   <li>Machine learning algorithms</li>
//                   <li>Real-world data science projects</li>
//                 </ul>
//               </div>

//               <div className="border border-gray-200 rounded-lg p-4">
//                 <h3 className="font-medium mb-2">Course Details</h3>
//                 <div className="space-y-2">
//                   <p><span className="font-medium">Duration:</span> 10 weeks</p>
//                   <p><span className="font-medium">Level:</span> Beginner to Intermediate</p>
//                   <p><span className="font-medium">Certification:</span> Yes, upon completion</p>
//                   <p><span className="font-medium">Support:</span> Instructor-led with community</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Fixed CTA Buttons at the bottom */}
//       <div className="sticky bottom-0 bg-white border-t border-gray-200 py-3 px-4 shadow-lg">
//         <FixedCTAButtons onEnroll={handleEnroll} onDecline={handleDecline} />
//       </div>
//     </div>
//   );
// };

// export default CourseCallToAction;
