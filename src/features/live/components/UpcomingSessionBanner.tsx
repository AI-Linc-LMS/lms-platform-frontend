import React from "react";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import SecondaryButton from "../../../commonComponents/common-buttons/secondary-button/SecondaryButton";
import { UpcomingSession } from "../types/live.types";

interface UpcomingSessionBannerProps {
  session: UpcomingSession;
  currentTime: Date;
}

const UpcomingSessionBanner: React.FC<UpcomingSessionBannerProps> = ({
  session,
  currentTime,
}) => {
  // Check if upcoming session is currently live
  const isSessionLive = () => {
    const sessionStart = new Date(session.scheduledTime);
    const sessionEnd = new Date(
      sessionStart.getTime() + session.duration * 60000
    );
    return currentTime >= sessionStart && currentTime <= sessionEnd;
  };

  // Check if session starts within next 30 minutes
  const isSessionStartingSoon = () => {
    const sessionStart = new Date(session.scheduledTime);
    const timeDiff = sessionStart.getTime() - currentTime.getTime();
    return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleJoinSession = () => {
    if (session.zoomLink) {
      window.open(session.zoomLink, "_blank");
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-[#343A40] mb-6">
        Upcoming Session
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#80C9E0]">
        <div className="relative">
          <img
            src={session.banner}
            alt="Session banner"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              {session.title}
            </h3>
            <p className="text-sm md:text-base opacity-90">
              {session.description}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={session.trainer.avatar}
                  alt={session.trainer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-[#343A40]">
                    {session.trainer.name}
                  </h4>
                  <p className="text-sm text-[#6C757D]">
                    {session.trainer.bio}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-[#255C79]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-[#495057]">
                    {formatDate(session.scheduledTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-[#255C79]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[#495057]">
                    {formatTime(session.scheduledTime)} (
                    {formatDuration(session.duration)})
                  </span>
                </div>
              </div>
            </div>

            {/* Join Button */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-xs">
                {isSessionLive() ? (
                  <PrimaryButton
                    onClick={handleJoinSession}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    🔴 Join Live Now
                  </PrimaryButton>
                ) : isSessionStartingSoon() ? (
                  <PrimaryButton
                    onClick={handleJoinSession}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    ⏰ Join Soon
                  </PrimaryButton>
                ) : (
                  <SecondaryButton onClick={handleJoinSession}>
                    📅 Join Soon
                  </SecondaryButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingSessionBanner;
