interface Stat {
    title: string;
    progress: number;
    count: string;
  }
  
  interface DashboardContentProps {
    courseTitle: string;
    courseType: string;
    stats: Stat[];
  }
  
  const ProgressCircle = ({ percent }: { percent: number }) => {
    const strokeDashoffset = 100 - percent;
  
    return (
      <svg width="54" height="54" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="4"
        />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="4"
          strokeDasharray="100"
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 18 18)"
        />
        <text
          x="18"
          y="20.5"
          textAnchor="middle"
          fill="#4CAF50"
          fontSize="8"
          fontWeight="bold"
        >
          {percent}%
        </text>
      </svg>
    );
  };
  
  const DashboardContent = ({ courseTitle, courseType, stats }: DashboardContentProps) => {
    return (
      <div className="">
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mb-4">Check your overall progress from here</p>
  
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-medium">{courseTitle}</h3>
              <p className="text-xs text-gray-500">{courseType}</p>
            </div>
            <ProgressCircle percent={25} />
          </div>
        </div>
  
        <div className="grid grid-cols-4 gap-2">
          {stats.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
              <ProgressCircle percent={item.progress} />
              <p className="text-sm mt-2 font-medium">{item.title}</p>
              <p className="text-xs text-gray-500">{item.count}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default DashboardContent;
  