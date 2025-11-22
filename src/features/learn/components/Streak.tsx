import { PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StreakData } from "../../../services/dashboardApis.ts";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store.ts";
import { useStreakData } from "../hooks/useStreakData";

interface StreakProps {
  showProgress?: boolean;
  clientId: number;
  dataOverride?: StreakData | null;
}

const Streak = ({ showProgress = true, clientId, dataOverride }: StreakProps) => {
  const [progress, setProgress] = useState<number>(0);
  const { t } = useTranslation();
  const courses = useSelector((state: RootState) => state.courses);
  const { data } = useStreakData(clientId, {
    enabled: !dataOverride,
  });
  const streakData = dataOverride ?? data;

  useEffect(() => {
    let completedVideos = 0;
    let totalVideos = 0;
    let totalArticles = 0;
    let completedArticles = 0;
    let totalQuizzes = 0;
    let completedQuizzes = 0;
    let totalAssignments = 0;
    let completedAssignments = 0;
    let totalCodingProblems = 0;
    let completedCodingProblems = 0;
    for (const single of courses.courses) {
      totalVideos += single.stats?.video?.total || 0;
      completedVideos += single.stats?.video?.completed || 0;
      totalArticles += single.stats?.article?.total || 0;
      completedArticles += single.stats?.article?.completed || 0;
      totalCodingProblems += single.stats?.coding_problem?.total || 0;
      completedCodingProblems += single.stats?.coding_problem?.completed || 0;
      totalQuizzes += single.stats?.quiz?.total || 0;
      completedQuizzes += single.stats?.quiz?.completed || 0;
      totalAssignments += single.stats?.assignment?.total || 0;
      completedAssignments += single.stats?.assignment?.completed || 0;
    }
    const completedHours =
      completedVideos +
      completedArticles +
      completedQuizzes +
      completedAssignments +
      completedCodingProblems;
    const totalHours =
      totalVideos +
      totalArticles +
      totalQuizzes +
      totalAssignments +
      totalCodingProblems;
    if (totalHours !== 0) {
      setProgress(Math.round(Number(completedHours / totalHours) * 100));
    }
  }, [courses]);

  const pieData = [
    { name: "Progress", value: progress },
    { name: "Remaining", value: 100 - progress },
  ];

  const COLORS = ["var(--primary-500)", "#F3F4F6"]; // teal-500, gray-100

  return (
    <div className="bg-white px-2 py-4 rounded-xl flex items-center justify-between w-full mx-auto">
      <div>
        <p className="text-gray-800 text-lg md:mb-2">
          <span role="img" aria-label="fire">
            🔥
          </span>{" "}
          {t("dashboard.streak.title")}:{" "}
          <span className="font-bold">
            {t("dashboard.streak.days", { count: streakData?.current_streak })}
          </span>
        </p>
        <p className="text-gray-500 text-sm md:text-base text-wrap">
          {t("dashboard.streak.overallProgress", {
            progress: progress.toFixed(2),
          })}
        </p>
      </div>
      {showProgress && (
        <div className="relative w-20 h-20">
          <PieChart width={80} height={80}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={38}
              fill="var(--primary-500)"
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell key={`cell-0`} fill={COLORS[0]} />
              <Cell key={`cell-1`} fill={COLORS[1]} />
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xl font-bold text-gray-800">
              {progress.toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Streak;
