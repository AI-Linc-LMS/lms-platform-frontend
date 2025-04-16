interface CourseProgressProps {
  moduleNumber: number;
  totalModules: number;
  moduleName: string;
}

const CourseProgress: React.FC<CourseProgressProps> = ({
  moduleNumber,
  totalModules,
  moduleName,
}) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((moduleNumber / totalModules) * 100);
  
  return (
    <div className="w-full bg-[#e9eaec] rounded-xl h-[75px] flex flex-row items-center justify-between p-4">
      <div>
        <h1 className="font-sans font-medium text-[13px] text-[#343A40]">
          Module {moduleNumber}/{totalModules}
        </h1>
        <p className="text-[13px] font-sans text-[#495057] font-normal">
          {moduleName}
        </p>
      </div>
      <div>
        <h1 className="font-sans font-medium text-[13px] text-[#343A40] mb-2">
          {progressPercentage}% completed
        </h1>
        <div className="w-[320px] bg-gray-300 rounded-full h-2.5">
          <div
            className="bg-[#5FA564] h-2.5 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgress; 