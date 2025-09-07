import Course, { Achievements } from "../../../../types/final-course.types";

const ACHIEVEMENT_MAPPER = {
  [Achievements.FIRST_STEP]: {
    title: "FIRST STEPS",
    icon: (
      <svg
        className="w-4 h-4 text-blue-600 mb-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  [Achievements.QUIZ_MASTER]: {
    title: "QUIZ MASTER",
    icon: (
      <svg
        className="w-4 h-4 text-blue-600 mb-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  [Achievements.FIVE_WEEK_MASTER]: {
    title: "5 WEEK MASTER",
    icon: (
      <svg
        className="w-4 h-4 text-blue-600 mb-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
      </svg>
    ),
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  [Achievements.EXPERT]: {
    title: "EXPERT",
    icon: (
      <svg
        className="w-4 h-4 text-gray-400 mb-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    bgColor: "bg-gray-100",
    textColor: "text-gray-400",
    isLocked: true,
  },
  [Achievements.CERTIFIED]: {
    title: "CERTIFIED",
    icon: (
      <svg
        className="w-4 h-4 text-gray-400 mb-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgColor: "bg-gray-100",
    textColor: "text-gray-400",
    isLocked: true,
  },
};

export const AchievementSection = ({ course }: { course: Course }) => {
  
  const userAchievements = course.achievements || [];
  const totalPossibleAchievements = Object.keys(ACHIEVEMENT_MAPPER).length;

  // Create a Set for faster lookup of user achievements
  const achievedSet = new Set(userAchievements);

  // Generate achievement cards based on what's available in enum and user's achievements
  const achievementCards = Object.entries(ACHIEVEMENT_MAPPER).map(
    ([achievementKey, config]) => {
      const achievement = achievementKey as Achievements;
      const isAchieved = achievedSet.has(achievement);
      const isLocked = !isAchieved;

      return {
        key: achievement,
        title: config.title,
        icon: config.icon,
        bgColor: isAchieved ? config.bgColor : "bg-gray-100",
        textColor: isAchieved ? config.textColor : "text-gray-400",
        opacity: isLocked ? "opacity-60" : "",
      };
    }
  );

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between my-2">
        <h3 className="text-[#495057] font-semibold text-xs">Achievements</h3>
        <span className="text-blue-600 text-xs">
          {userAchievements.length}/{totalPossibleAchievements}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {achievementCards.map((card) => (
          <div
            key={card.key}
            className={`flex flex-col items-center p-1.5 ${card.bgColor} rounded-md ${card.opacity}`}
          >
            {card.icon}
            <span className={`text-xs ${card.textColor} font-medium`}>
              {card.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
