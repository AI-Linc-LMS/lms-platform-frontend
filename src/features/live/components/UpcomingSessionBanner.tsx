import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import SecondaryButton from "../../../commonComponents/common-buttons/secondary-button/SecondaryButton";
import { UpcomingSession } from "../types/live.types";
import Calendar from "./Calender";

interface UpcomingSessionBannerProps {
  session: UpcomingSession;
  currentTime: Date;
}

const UpcomingSessionBanner: React.FC<UpcomingSessionBannerProps> = ({
  session,
  currentTime,
}) => {
  // Session logic
  const isSessionLive = () => {
    const sessionStart = new Date(session.scheduledTime);
    const sessionEnd = new Date(
      sessionStart.getTime() + session.duration * 60000
    );
    return currentTime >= sessionStart && currentTime <= sessionEnd;
  };

  const isSessionStartingSoon = () => {
    const sessionStart = new Date(session.scheduledTime);
    const timeDiff = sessionStart.getTime() - currentTime.getTime();
    return timeDiff > 0 && timeDiff <= 30 * 60 * 1000;
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
      <h2 className="text-2xl font-bold text-[#343A40] mb-6 flex items-center gap-2">
        <span role="img" aria-label="calendar">
          📅
        </span>{" "}
        Upcoming Session
      </h2>
      <div className="flex flex-col justify-between lg:flex-row gap-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#80C9E0] p-6 flex flex-col gap-8">
          {/* Session Details */}
          <div className="flex-1 flex flex-col gap-4 justify-start lg:justify-center">
            <h3 className="text-lg md:text-2xl font-bold lg:mb-2 text-[#255C79] flex items-center gap-2">
              <span role="img" aria-label="session">
                🎤
              </span>{" "}
              {session.title}
            </h3>
            <p className="text-[#6C757D] text-sm lg:text-base lg:mb-2">
              {session.description}
            </p>
            <div className="flex flex-col lg:flex-row lg:gap-3 lg:mb-2">
              <span className="inline-flex items-center gap-1 text-[#495057]">
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
                {formatDate(session.scheduledTime)}
              </span>
              <span className="inline-flex items-center gap-1 text-[#495057]">
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
                {formatTime(session.scheduledTime)} (
                {formatDuration(session.duration)})
              </span>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:mb-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[#343A40]">Trainer:</span>
                  <span className="text-[#255C79] font-medium">
                    {session.trainer.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#6C757D]">
                    ({session.trainer.bio})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={session.trainer.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z" />
                </svg>
                LinkedIn
              </a>
            </div>
            <div className="w-full max-w-xs lg:mt-4">
              {isSessionLive() ? (
                <PrimaryButton
                  onClick={handleJoinSession}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  🔴 Join Live Now
                </PrimaryButton>
              ) : isSessionStartingSoon() ? (
                <PrimaryButton
                  onClick={handleJoinSession}
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                >
                  ⏰ Join Soon
                </PrimaryButton>
              ) : (
                <SecondaryButton onClick={handleJoinSession} className="w-full">
                  📅 Join Soon
                </SecondaryButton>
              )}
            </div>
          </div>
        </div>
        <Calendar
          events={[
            {
              date: "2025-07-20",
              name: "React Workshop",
              link: "https://zoom.us/rec/xyz",
            },
            {
              date: "2025-07-27",
              name: "Tailwind Masterclass",
              link: "https://zoom.us/rec/abc",
            },
          ]}
        />
      </div>
    </div>
  );
};

export default UpcomingSessionBanner;
