import { useState } from "react";
import HoursSpentCard from "./HoursSpentCard";
import LessonsHeatmapCard from "./LessonsHeatmapCard";

export default function TimeTrackingDashboard() {
  const [timeRange, setTimeRange] = useState("7");
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  return (
    <div className="flex flex-col md:flex-row w-full gap-4">
      <HoursSpentCard
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />
      <div className="mt-6 md:mt-0 w-full">
        <LessonsHeatmapCard
          hoveredCell={hoveredCell}
          setHoveredCell={setHoveredCell}
        />
      </div>
    </div>
  );
}
