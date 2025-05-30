import { CourseIconData } from "./types";

interface CourseProgressProps {
  moduleNumber: number;
  totalModules: number;
  moduleName: string;
  stats: CourseIconData[];
}

const CourseProgress: React.FC<CourseProgressProps> = ({
  moduleNumber,
  totalModules,
  moduleName,
  stats,
}) => {
  // Calculate progress percentage
  const { completed, total } = stats.reduce((acc, curr) => {
    acc.completed += curr.completed;
    acc.total += curr.total;
    return acc;
  }, { completed: 0, total: 0 });

  const progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="w-full bg-[#e9eaec] rounded-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <h1 className="font-sans font-medium text-[13px] text-[#343A40]">
            Module {moduleNumber}/{totalModules}
          </h1>
          <p className="text-[13px] font-sans text-[#495057] font-normal">
            {moduleName}
          </p>
        </div>
        <p className="font-sans font-medium text-[13px] text-[#343A40]">
          {progressPercentage}% completed
        </p>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2.5">
        <div
          className="bg-[#5FA564] h-2.5 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CourseProgress; 