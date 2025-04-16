import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { CourseData } from "./types";
import CourseIconGroup from "./CourseIconGroup";
import CategoryBadge from "./CategoryBadge";
import CourseProgress from "./CourseProgress";

const CourseCard: React.FC<CourseData> = ({
  title,
  description,
  category,
  moduleNumber,
  totalModules,
  moduleName,
  iconData,
  onContinue,
}) => {
  return (
    <div className="w-full border-[#80C9E0] rounded-[22px] border-[1px] bg-[#F8F9FA] p-4 mt-4">
      <div className="flex flex-row gap-4 items-center justify-between">
        <div>
          <h1 className="font-bold text-[#343A40] text-[22px] font-sans">
            {title}
          </h1>
          <p className="font-sans font-normal text-[18px] text-[#495057]">
            {description}
          </p>
        </div>

        <CourseIconGroup iconData={iconData} />
      </div>
      
      <div className="my-4">
        <CategoryBadge category={category} />
      </div>
      
      <div className="my-5">
        <CourseProgress 
          moduleNumber={moduleNumber}
          totalModules={totalModules}
          moduleName={moduleName}
        />
      </div>
      
      <PrimaryButton onClick={onContinue}>
        Continue
      </PrimaryButton>
    </div>
  );
};

export default CourseCard; 