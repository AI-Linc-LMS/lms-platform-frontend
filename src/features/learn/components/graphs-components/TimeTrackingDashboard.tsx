import { useState, useEffect } from "react";
import { format } from "date-fns";
import HoursSpentCard from "./HoursSpentCard";
import LessonsHeatmapCard from "./LessonsHeatmapCard";

// Define the interface for Activity Data
interface ActivityData {
  date: string;
  level: number;
  value: number;
  articles?: number;
  videos?: number;
  problems?: number;
  quizzes?: number;
}

export default function TimeTrackingDashboard() {
  const [timeRange, setTimeRange] = useState("Last Week");
  const [hourData, setHourData] = useState<{ day: string; hours: number }[]>(
    []
  );
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    generateLineChartData(timeRange);
    generateHeatmapData();
  }, [timeRange]);

  const generateLineChartData = (range: string) => {
    let data: { day: string; hours: number }[] = [];
  
    if (range === "Last Week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      data = days.map((day) => ({
        day,
        hours: Math.floor(Math.random() * 20) + 5,
      }));
    } else {
      const count = range === "Last 15 Days" ? 15 : 30;
      data = Array.from({ length: count }, (_, index) => ({
        day: (index + 1).toString(), // make sure it's a string
        hours: Math.floor(Math.random() * 20) + 5,
      }));
    }
  
    setHourData(data);
    setTotalHours(data.reduce((sum, d) => sum + d.hours, 0));
  };
  
  const generateHeatmapData = () => {
    const dummyActivityData: ActivityData[] = [];
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    const date = new Date(sixMonthsAgo);
    while (date <= currentDate) {
      const dateStr = format(date, "yyyy-MM-dd");

      const level = Math.floor(Math.random() * 5);
      const value = +(Math.random() * 3).toFixed(1);

      const articles = Math.floor(Math.random() * 5);
      const videos = Math.floor(Math.random() * 5);
      const problems = Math.floor(Math.random() * 5);
      const quizzes = Math.floor(Math.random() * 5);

      dummyActivityData.push({
        date: dateStr,
        level,
        value,
        articles,
        videos,
        problems,
        quizzes,
      });

      date.setDate(date.getDate() + 1);
    }

    setActivityData(dummyActivityData);
  };

  //console.log(activityData);

  return (
    <div className="flex flex-row w-full gap-4">
      <HoursSpentCard
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        hourData={hourData}
        totalHours={totalHours}
      />
      <LessonsHeatmapCard
        activityData={activityData}
        hoveredCell={hoveredCell}
        setHoveredCell={setHoveredCell}
      />
    </div>
  );
}
