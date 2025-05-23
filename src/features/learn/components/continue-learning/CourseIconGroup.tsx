import { CourseIconData } from "./types";

interface CourseIconGroupProps {
  iconData: CourseIconData[];
}

const CourseIconGroup: React.FC<CourseIconGroupProps> = ({ iconData }) => {
  return (
    <div className="flex gap-1">
      {iconData.map((item, index) => (
        <div 
          key={index} 
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center text-center"
        >
          <div className="flex-shrink-0">
            {item.icon}
          </div>
          <p className="font-medium font-sans text-[10px] md:text-[11px] text-[#495057] mt-0.5 leading-none">
            {item.completed}/{item.total}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CourseIconGroup; 