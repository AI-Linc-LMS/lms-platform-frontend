import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { ContinueCourse, CourseIconData, CourseStats } from "./types";
import CourseIconGroup from "./CourseIconGroup";
import CategoryBadge from "./CategoryBadge";
import CourseProgress from "./CourseProgress";
import {
  CodeIcon,
  DocumentIcon,
  FAQIcon,
  VideoIcon,
} from "../../../../commonComponents/icons/learnIcons/CourseIcons";

interface ContinueCoursesCardProps {
  course: ContinueCourse;
}

const ContinueCoursesCard: React.FC<ContinueCoursesCardProps> = ({
  course,
}) => {
  const navigate = useNavigate();

  const createIconData = (stats: CourseStats): CourseIconData[] => [
    {
      icon: <VideoIcon />,
      completed: stats.video.completed,
      total: stats.video.total,
    },
    {
      icon: <DocumentIcon />,
      completed: stats.article.completed,
      total: stats.article.total,
    },
    {
      icon: <CodeIcon />,
      completed: stats.coding_problem.completed,
      total: stats.coding_problem.total,
    },
    {
      icon: <FAQIcon />,
      completed: stats.quiz.completed,
      total: stats.quiz.total,
    },
    {
      icon: <CodeIcon />,
      completed: stats.assignment.completed,
      total: stats.assignment.total,
    },
  ];

  const iconData = createIconData(course.stats);

  return (
    <div className="w-full border-[var(--primary-200)] rounded-[16px] md:rounded-[22px] border-[1px] bg-[var(--neutral-50)] p-3 md:p-4 flex flex-col min-h-[280px] md:min-h-[300px]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div>
          <h1 className="font-bold text-[var(--neutral-500)] text-[16px] md:text-[18px]">
            {course.title}
          </h1>
          <p className="font-sans font-normal text-[13px] text-[var(--neutral-400)]">
            {course.description}
          </p>
        </div>

        <div className="self-start md:self-auto">
          <CourseIconGroup iconData={iconData} />
        </div>
      </div>

      <div className="my-3 md:my-4">
        <CategoryBadge category={course.difficulty_level} />
      </div>

      <div className="my-4 md:my-5">
        <CourseProgress
          moduleNumber={course.completed_modules}
          totalModules={course.num_modules}
          moduleName={`Module ${course.completed_modules + 1}`}
          stats={iconData}
        />
      </div>

      <div className="mt-auto">
        <PrimaryButton
          onClick={() => navigate(`/courses/${course.id}`)}
          className="text-[13px] md:text-[15px] py-1 md:py-2"
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default ContinueCoursesCard;
