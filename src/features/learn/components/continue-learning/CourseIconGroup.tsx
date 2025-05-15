import { CourseIconData } from "./types";

interface CourseIconGroupProps {
  iconData: CourseIconData[];
}

const CourseIconGroup: React.FC<CourseIconGroupProps> = ({ iconData }) => {
  return (
    <div className="grid grid-cols-5 gap-1">
      {iconData.map((item, index) => (
        <div 
          key={index} 
          className="w-full aspect-square rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center"
        >
          {item.icon}
          <p className="font-medium font-sans text-[12px] text-[#495057] mt-1">
            {item.completed}/{item.total}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CourseIconGroup; 