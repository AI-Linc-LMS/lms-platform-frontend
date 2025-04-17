import { useState, useEffect } from "react";
import { format } from "date-fns";
import HoursSpentCard from "./HoursSpentCard";
import LessonsHeatmapCard from "./LessonsHeatmapCard";

// Define the interface for Activity Data
interface ActivityData {
  date: string;
  level: number;
  value: number;
}

export default function TimeTrackingDashboard() {
  const [timeRange, setTimeRange] = useState("Last 7 Days");
  const [hourData, setHourData] = useState<{ day: string; hours: number }[]>(
    []
  );
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

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
    const dummyActivityData: ActivityData[] = [];
    const currentDate = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6); 

    const date = new Date(sixMonthsAgo);
    while (date <= currentDate) {
      const dateStr = format(date, "yyyy-MM-dd");

      const level = Math.floor(Math.random() * 5);
      const value = +(Math.random() * 3).toFixed(1);

      dummyActivityData.push({
        date: dateStr,
        level,
        value,
      });

      date.setDate(date.getDate() + 1);
    }

    setActivityData(dummyActivityData);
  };
  console.log(activityData);

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
