import { CourseIconData } from "./types";

interface CourseIconGroupProps {
  iconData: CourseIconData[];
}

const CourseIconGroup: React.FC<CourseIconGroupProps> = ({ iconData }) => {
  return (
    <div className="flex flex-row gap-3 items-center">
      {iconData.map((item, index) => (
        <div key={index} className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
          {item.icon}
          <p className="font-medium font-sans text-[13px] text-[#495057]">
            {item.completed}/{item.total}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CourseIconGroup; 