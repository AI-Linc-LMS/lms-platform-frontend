import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { CourseData } from "./types";
import CourseIconGroup from "./CourseIconGroup";
import CategoryBadge from "./CategoryBadge";
import CourseProgress from "./CourseProgress";

const CourseCard: React.FC<CourseData> = ({
  title,
  description,
  category,
  completed_modules,
  num_modules,
  iconData,
  onContinue,
}) => {
  return (
    <div className="w-full border-[#80C9E0] rounded-[16px] md:rounded-[22px] border-[1px] bg-[#F8F9FA] p-3 md:p-4 mt-3 md:mt-4 flex flex-col min-h-[280px] md:min-h-[300px]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div>
          <h1 className="font-bold text-[#343A40] text-[16px] md:text-[18px] font-sans">
            {title}
          </h1>
          <p className="font-sans font-normal text-[13px] text-[#495057]">
            {description}
          </p>
        </div>

        <div className="self-start md:self-auto">
          <CourseIconGroup iconData={iconData} />
        </div>
      </div>
      
      <div className="my-3 md:my-4">
        <CategoryBadge category={category} />
      </div>
      
      <div className="my-4 md:my-5">
        <CourseProgress 
          moduleNumber={completed_modules}
          totalModules={num_modules}
          moduleName={`Module ${completed_modules + 1}`}
          stats={iconData}
        />
      </div>
      
      <div className="mt-auto">
        <PrimaryButton onClick={onContinue} className="text-[13px] md:text-[15px] py-1 md:py-2">
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CourseCard; 