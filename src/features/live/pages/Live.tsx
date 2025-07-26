import React, { useState, useEffect } from "react";
import PastRecordings from "../components/PastRecordings";
import { liveServicesApis } from "../../../services/live/liveServicesApis";
import { useQuery } from "@tanstack/react-query";
import UpcomingSessionBanner from "../components/UpcomingSessionBanner";
import { LiveSession } from "../../../services/live/liveServicesApis";
import Calendar from "../components/Calender";

const Live: React.FC = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const { data, error, isLoading } = useQuery<LiveSession[]>({
    queryKey: ["liveSessions"],
    queryFn: () => liveServicesApis(clientId),
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pastRecordings, setPastRecordings] = useState<LiveSession[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<
    { date: string; name: string; link: string }[]
  >([]);
  const [upcomingSession, setUpcomingSession] = useState<LiveSession | null>(
    null
  );

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Split sessions into past and upcoming based on current time
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const now = currentTime;

      // Live session (currently happening)
      const live = data.find((session) => {
        const start = new Date(session.class_datetime);
        const end = new Date(
          start.getTime() + session.duration_minutes * 60000
        );
        return now >= start && now <= end;
      });

      // Closest upcoming session
      const upcoming = data
        .filter((session) => new Date(session.class_datetime) > now)
        .sort(
          (a, b) =>
            new Date(a.class_datetime).getTime() -
            new Date(b.class_datetime).getTime()
        );

      // Past sessions
      const past = data
        .filter((session) => new Date(session.class_datetime) <= now)
        .sort(
          (a, b) =>
            new Date(b.class_datetime).getTime() -
            new Date(a.class_datetime).getTime()
        );

      // Calendar events (excluding live/upcoming session)
      const calendarEvents = data
        .map((session) => ({
          date: session.class_datetime.split("T")[0],
          name: session.topic_name,
          link: session.join_link,
        }));

      // Prefer live session if present, else use next closest
      setUpcomingSession(live || upcoming[0] || null);
      setPastRecordings(past);
      setCalendarEvents(calendarEvents);
    }
  }, [data, currentTime]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-lg p-6 border border-[#f87171] text-center">
        <p className="text-red-600 font-semibold mb-2 text-lg">
          ⚠️ Failed to load live sessions
        </p>
        <p className="text-gray-500 mb-4">
          Please check your internet connection or try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#343A40] mb-4">
            Live Classes
          </h1>
          <p className="text-lg text-[#6C757D] max-w-2xl mx-auto">
            Join live sessions with industry experts and access our library of
            recorded classes
          </p>
        </div>

        <h2 className="text-2xl font-bold text-[#343A40] mb-6 flex items-center gap-2">
          📅 Upcoming Session
        </h2>

        {/* Optional: Upcoming Session Component */}
        <div className="flex flex-col lg:flex-row justify-between mb-12 gap-12">
          <div className="flex-1">
            <UpcomingSessionBanner
              session={upcomingSession}
              currentTime={currentTime}
            />
          </div>
          <div className="flex-1">
            <Calendar events={calendarEvents} />
          </div>
        </div>

        {/* Past Recordings Section */}
        <PastRecordings pastLiveSessions={pastRecordings} />
      </div>
    </div>
  );
};

export default Live;
