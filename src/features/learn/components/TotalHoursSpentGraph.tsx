// import React, { useState } from 'react';

// interface DataPoint {
//   label: string;
//   value: number;
// }

// interface TimeTrackingGraphProps {
//   data: DataPoint[];
//   title: string;
//   period?: string;
// }

// const TimeTrackingGraph: React.FC<TimeTrackingGraphProps> = ({ data, title, period = "Last 7 Days" }) => {
//   // State to track which point is being hovered
//   const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
//   // Extract the values and find the max for scaling
//   const values = data.map(point => point.value);
//   const maxValue = Math.max(...values);
  
//   // Function to calculate the height percentage based on value
//   const getHeightPercentage = (value: number) => {
//     return value === 0 ? 0 : (value / maxValue) * 80; // Max height 80%
//   };
  
//   // Total is the sum of all values
//   const total = values.reduce((sum, value) => sum + value, 0);

//   return (
//     <div className="w-full p-6 bg-white rounded-3xl shadow-sm">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-6xl font-medium text-gray-800">{total}</h1>
//           <h2 className="text-3xl text-gray-500 font-normal mt-2">{title}</h2>
//         </div>
//         <div className="relative">
//           <button className="flex items-center px-4 py-2 text-lg text-gray-700 bg-gray-100 rounded-xl">
//             {period}
//             <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
//             </svg>
//           </button>
//         </div>
//       </div>
      
//       <div className="relative h-64">
//         {/* Y-axis labels */}
//         <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-gray-500">
//           <span>24</span>
//           <span>12</span>
//           <span>0</span>
//         </div>
        
//         {/* Graph container */}
//         <div className="ml-10 h-full flex items-end relative">
//           <svg className="w-full h-full" viewBox={`0 0 ${data.length * 100} 100`} preserveAspectRatio="none">
//             {/* Line path */}
//             <path
//               d={data.map((point, index) => {
//                 const x = index * (100 / (data.length - 1));
//                 const y = 100 - getHeightPercentage(point.value);
//                 return (index === 0 ? 'M' : 'L') + `${x},${y}`;
//               }).join(' ')}
//               fill="none"
//               stroke="#64748b"
//               strokeWidth="2"
//             />
            
//             {/* Area fill */}
//             <path
//               d={data.map((point, index) => {
//                 const x = index * (100 / (data.length - 1));
//                 const y = 100 - getHeightPercentage(point.value);
//                 return (index === 0 ? 'M' : 'L') + `${x},${y}`;
//               }).join(' ') + ` L${100},100 L0,100 Z`}
//               fill="url(#gradient)"
//               opacity="0.5"
//             />
            
//             {/* Interactive hover points */}
//             {data.map((point, index) => {
//               const x = index * (100 / (data.length - 1));
//               const y = 100 - getHeightPercentage(point.value);
//               return (
//                 <g key={index}>
//                   {/* Invisible larger circle for better hover target */}
//                   <circle
//                     cx={x}
//                     cy={y}
//                     r="8"
//                     fill="transparent"
//                     onMouseEnter={() => setHoveredPoint(index)}
//                     onMouseLeave={() => setHoveredPoint(null)}
//                   />
                  
//                   {/* Visible circle that appears on hover */}
//                   {hoveredPoint === index && (
//                     <circle
//                       cx={x}
//                       cy={y}
//                       r="4"
//                       fill="#64748b"
//                       stroke="#fff"
//                       strokeWidth="2"
//                     />
//                   )}
//                 </g>
//               );
//             })}
            
//             {/* Define gradient */}
//             <defs>
//               <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
//                 <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
//                 <stop offset="100%" stopColor="#64748b" stopOpacity="0.1" />
//               </linearGradient>
//             </defs>
//           </svg>
          
//           {/* Tooltip that appears on hover */}
//           {hoveredPoint !== null && (
//             <div 
//               className="absolute bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg transform -translate-x-1/2"
//               style={{
//                 left: `${hoveredPoint * (100 / (data.length - 1))}%`,
//                 bottom: `${getHeightPercentage(data[hoveredPoint].value) + 10}%`,
//               }}
//             >
//               <div className="font-medium">{data[hoveredPoint].label}</div>
//               <div>{data[hoveredPoint].value} hours</div>
//             </div>
//           )}
//         </div>
        
//         {/* X-axis labels */}
//         <div className="ml-10 mt-2 flex justify-between text-gray-500 text-xl">
//           {data.map((point, index) => (
//             <span key={index} className={index === 0 || index === Math.floor(data.length / 2) || index === data.length - 1 ? 'block' : 'hidden'}>
//               {point.label}
//             </span>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Example usage
// const TotalHoursSpentGraph = () => {
//   // Sample data - replace with your actual data source
//   const sampleData = [
//     { label: 'Sun', value: 6 },
//     { label: 'Mon', value: 14 },
//     { label: 'Tue', value: 20 },
//     { label: 'Wed', value: 26 },
//     { label: 'Thu', value: 20 },
//     { label: 'Fri', value: 18 },
//     { label: 'Sat', value: 24 }
//   ];

//   return (
//     <div className="mx-12 max-w-[600px] max-h-[320px] my-4">
//       <TimeTrackingGraph 
//         data={sampleData} 
//         title="Total hours spent" 
//         period="Last 7 Days" 
//       />
//     </div>
//   );
// };

// export default TotalHoursSpentGraph;