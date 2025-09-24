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
    <div className="w-full border-[var(--primary-200)] rounded-[16px] md:rounded-[22px] border-[1px] bg-[var(--neutral-50)] p-4 flex flex-col gap-3 min-h-[280px] md:min-h-[300px]">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[var(--neutral-500)] text-[16px] md:text-[18px] line-clamp-1">
            {title}
          </h1>
          <p className="font-sans font-normal text-[13px] text-[var(--neutral-400)] line-clamp-1">
            {description}
          </p>
        </div>

        <div className="flex-shrink-0">
          <CourseIconGroup iconData={iconData} />
        </div>
      </div>

      <div>
        <CategoryBadge category={category} />
      </div>

      <div className="mt-1">
        <CourseProgress
          moduleNumber={completed_modules}
          totalModules={num_modules}
          moduleName={`Module ${completed_modules + 1}`}
          stats={iconData}
        />
      </div>

      <div className="mt-auto pt-2 w-full">
        <PrimaryButton
          onClick={onContinue}
          className="text-[13px] md:text-[15px] py-2 w-full "
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CourseCard;
