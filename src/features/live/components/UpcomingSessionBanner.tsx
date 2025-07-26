import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import SecondaryButton from "../../../commonComponents/common-buttons/secondary-button/SecondaryButton";
import { LiveSession } from "../../../services/live/liveServicesApis";

interface UpcomingSessionBannerProps {
  session: LiveSession | null; // Array of sessions
  currentTime: Date;
}

const UpcomingSessionBanner: React.FC<UpcomingSessionBannerProps> = ({
  session,
  currentTime,
}) => {
  // Helpers
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

  const isSessionLive = (session: LiveSession) => {
    const start = new Date(session.class_datetime);
    const end = new Date(start.getTime() + session.duration_minutes * 60000);
    return currentTime >= start && currentTime <= end;
  };

  const handleJoinSession = (link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  if (!session) {
    return (
      <div className="mb-12">
        <div className="flex flex-col justify-between lg:flex-row gap-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#80C9E0] p-6 flex flex-col gap-8 w-full min-h-[300px] justify-center items-center text-center">
            <p className="text-[#255C79] text-xl font-semibold">
              🚀 Live sessions will be coming soon!
            </p>
            <p className="text-[#6C757D] max-w-md">
              We’re preparing the next amazing session for you. Stay tuned and
              check back later for updates.
            </p>

            <div className="w-full max-w-xs">
              <SecondaryButton className="w-full" disabled onClick={() => {}}>
                Join Soon
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl w-full shadow-lg overflow-hidden border border-[#80C9E0] p-6 flex flex-col gap-8">
      {/* Session Details */}
      <div className="flex-1 flex flex-col gap-4 justify-start lg:justify-center">
        <h3 className="text-lg md:text-2xl font-bold lg:mb-2 text-[#255C79] flex items-center gap-2">
          🎤 {session.topic_name}
        </h3>
        <p className="text-[#6C757D] text-sm lg:text-base lg:mb-2">
          {session.description}
        </p>
        <div className="flex flex-col lg:flex-row lg:gap-3 lg:mb-2">
          <span className="inline-flex items-center gap-1 text-[#495057]">
            📅 {formatDate(session.class_datetime)}
          </span>
          <span className="inline-flex items-center gap-1 text-[#495057]">
            ⏰ {formatTime(session.class_datetime)} (
            {formatDuration(session.duration_minutes)})
          </span>
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:mb-2">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[#343A40]">Trainer:</span>
            <span className="text-[#255C79] font-medium">
              {session.instructor}
            </span>
          </div>
        </div>
        <div className="w-full lg:mt-4">
          {isSessionLive(session) ? (
            <PrimaryButton
              onClick={() => handleJoinSession(session.join_link)}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              🔴 Join Live Now
            </PrimaryButton>
          ) : (
            <PrimaryButton>⏰ Join Soon</PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingSessionBanner;
