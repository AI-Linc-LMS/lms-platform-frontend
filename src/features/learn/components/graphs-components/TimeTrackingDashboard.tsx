import { useState, useEffect } from "react";
import HoursSpentCard from "./HoursSpentCard";
import LessonsHeatmapCard from "./LessonsHeatmapCard";

export default function TimeTrackingDashboard() {
  const [timeRange, setTimeRange] = useState("Last 7 Days");
  const [hourData, setHourData] = useState<{ day: string; hours: number }[]>(
    []
  );
  const [activityData, setActivityData] = useState<
    { day: number; month: number; level: number; value: number }[]
  >([]);
  const [totalHours, setTotalHours] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{
    day: number;
    month: number;
  } | null>(null);
  const [year] = useState("2025");

  useEffect(() => {
    generateLineChartData();
    generateHeatmapData();
  }, [timeRange]);

  const generateLineChartData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = days.map((day) => ({
      day,
      hours: Math.floor(Math.random() * 20) + 5,
    }));

    const total = data.reduce((sum, item) => sum + item.hours, 0);
    setTotalHours(total);
    setHourData(data);
  };

  const generateHeatmapData = () => {
    const data: { day: number; month: number; level: number; value: number }[] =
      [];
    for (let day = 0; day < 7; day++) {
      for (let month = 0; month < 12; month++) {
        const level = Math.floor(Math.random() * 5);
        data.push({
          day,
          month,
          level,
          value: level * 2 + Math.floor(Math.random() * 3),
        });
      }
    }
    setActivityData(data);
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col md:flex-row gap-4 my-4">
      <HoursSpentCard
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        hourData={hourData}
        totalHours={totalHours}
      />
      <LessonsHeatmapCard
        months={months}
        days={days}
        activityData={activityData}
        hoveredCell={hoveredCell}
        setHoveredCell={setHoveredCell}
        year={year}
      />
    </div>
  );
}
