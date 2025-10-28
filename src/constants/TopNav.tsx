import { Bell, CloudLightning } from "lucide-react";
import userImg from "../commonComponents/icons/nav/User Image.png";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { logout } from "../redux/slices/userSlice";
import { handleMobileNavigation } from "../utils/authRedirectUtils";
import { RootState } from "../redux/store.ts";
// import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  getDailyLeaderboard,
  getHoursSpentData,
} from "../services/dashboardApis";
import { HoursSpentData } from "../features/learn/utils/interface.constant.ts";

interface UserState {
  profile_picture?: string;
  id?: string | null;
}

const TopNav: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);
  const [isStreakTooltipVisible, setIsStreakTooltipVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const streakTooltipRef = useRef<HTMLDivElement>(null);
  const notificationTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: { user: UserState }) => state.user);
  const clientInfo = useSelector((state: RootState) => state.clientInfo);
  const dispatch = useDispatch();
  const [streak, setStreak] = useState(0);
  // clientInfo available via store if needed in future

  const userId = user.id;
  const { isAdminOrInstructor, isSuperAdmin } = useRole();

  // Fetch daily leaderboard data
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ["dailyLeaderboard", clientInfo.data?.id],
    queryFn: () => getDailyLeaderboard(clientInfo.data?.id || 0),
    enabled: !!clientInfo.data?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const leaderboardArray = leaderboardData?.leaderboard || [];

  const toggleDropdown = () => {
    if (showDropdown) {
      setShowDropdown(false);
    } else {
      setIsDropdownVisible(true);
      setShowDropdown(true);
    }
  };

  const handleCloseDropdown = useCallback(() => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  }, [showDropdown]);

  const { data } = useQuery<HoursSpentData>({
    queryKey: ["hoursSpentData", "30"],
    queryFn: () => getHoursSpentData(clientInfo.data?.id, Number("30")),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (data) {
      const calculateStreak = (hours: number[]): number => {
        let currentStreak = 0;
        for (let i = hours.length - 1; i >= 0; i--) {
          if (hours[i] > 0.5) {
            currentStreak++;
          } else {
            break;
          }
        }
        return currentStreak;
      };
      setStreak(calculateStreak(data.hours_spent));
    }
  }, [data]);
  const hideNotification = useCallback(() => {
    setShowNotification(false);
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const hideStreakTooltip = useCallback(() => {
    setShowStreakTooltip(false);
  }, []);

  const handleStreakHover = useCallback(() => {
    if (!showStreakTooltip) {
      setIsStreakTooltipVisible(true);
      setShowStreakTooltip(true);
    }
  }, [showStreakTooltip]);

  const handleStreakLeave = useCallback(() => {
    hideStreakTooltip();
  }, [hideStreakTooltip]);

  const triggerNotification = useCallback(() => {
    setIsNotificationVisible(true);
    setShowNotification(true);
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
    }
    notificationTimerRef.current = window.setTimeout(() => {
      hideNotification();
    }, 4000);
  }, [hideNotification]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(logout());
      handleMobileNavigation("/login", navigate, true, false);
    } catch {
      handleMobileNavigation("/login", navigate, true, false);
    }
  };

  // Close dropdown and notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleCloseDropdown();
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        hideNotification();
      }

      if (
        streakTooltipRef.current &&
        !streakTooltipRef.current.contains(event.target as Node)
      ) {
        hideStreakTooltip();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleCloseDropdown, hideNotification, hideStreakTooltip]);

  // Show notification only ONCE per user when landing on home path
  useEffect(() => {
    if (location.pathname === "/") {
      const hasSeenCommunityModal = localStorage.getItem(
        "hasSeenCommunityModal"
      );
      if (!hasSeenCommunityModal) {
        triggerNotification();
        localStorage.setItem("hasSeenCommunityModal", "true");
      }
    }
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
      }
    };
  }, [location.pathname, triggerNotification]);

  return (
    <div
      className={`w-full bg-[var(--nav-background)] md:bg-white flex justify-between ${
        isRTL ? "md:justify-start" : "md:justify-end"
      } items-center px-4 py-4 mb-3 shadow-[0_1px_10px_rgba(0,0,0,0.05)] md:shadow border-b border-gray-200 md:border-b-0`}
    >
      <div className="md:hidden">
        <img
          src={clientInfo.data?.app_logo_url}
          alt={clientInfo.data?.name}
          className="h-8 w-auto cursor-pointer"
          onClick={() => navigate("/")}
        />
      </div>
      <div
        className={`flex items-center gap-3 md:gap-5 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div className="relative ">
          <motion.span
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs w-auto bg-[#FFF8E0] rounded-full me-2 border border-[#f9cd0c] relative overflow-hidden cursor-pointer"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 0px rgba(249, 205, 12, 0)",
                "0 0 15px rgba(249, 205, 12, 0.6)",
                "0 0 0px rgba(249, 205, 12, 0)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              scale: { duration: 0.2 },
            }}
            onMouseEnter={handleStreakHover}
            onMouseLeave={handleStreakLeave}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut",
              }}
            />

            {/* Pulsing background */}
            <motion.div
              className="absolute inset-0 bg-[#f9cd0c] rounded-full opacity-20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <CloudLightning className="h-4 w-4 text-[#f9cd0c] me-2 relative z-10 drop-shadow-[0_0_3px_rgba(249,205,12,0.8)]" />
            </motion.div>

            <motion.span
              className="text-secondary-500 font-bold relative z-10"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              {t("dashboard.streak.days", { count: streak })}
            </motion.span>
          </motion.span>

          {/* Streak Tooltip */}
          {isStreakTooltipVisible && (
            <div
              ref={streakTooltipRef}
              className={`absolute ${
                isRTL ? "right-0" : "left-0"
              } top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 ${
                showStreakTooltip
                  ? "animate-dropdown-open"
                  : "animate-dropdown-close"
              }`}
              onAnimationEnd={() => {
                if (!showStreakTooltip) {
                  setIsStreakTooltipVisible(false);
                }
              }}
            >
              <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <CloudLightning className="h-4 w-4 text-[#f9cd0c]" />
                Today's Leaders
              </div>

              {isLeaderboardLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between animate-pulse"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-8 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : leaderboardArray.length > 0 ? (
                <div className="space-y-2">
                  {leaderboardArray.slice(0, 3).map((user, index) => {
                    const timeDisplay =
                      user.progress.hours > 0
                        ? `${user.progress.hours}h ${user.progress.minutes}m`
                        : `${user.progress.minutes}m`;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                ? "bg-gray-100 text-gray-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <span className="text-sm text-gray-700 truncate max-w-[120px]">
                            {user.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[#17627A]">
                          {timeDisplay}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-2">
                  No data available
                </div>
              )}
            </div>
          )}
        </div>

        {(isAdminOrInstructor || isSuperAdmin) && (
          <Link
            to="/admin/dashboard"
            className="bg-[#17627A] text-[var(--font-light)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--primary-800)] transition-colors"
          >
            {t("navigation.admin")}
          </Link>
        )}

        {/* Language Switcher */}
        {/* <LanguageSwitcher /> */}

        <div className="relative">
          <div
            className="bg-gray-100 p-2 rounded-md cursor-pointer"
            onClick={triggerNotification}
            aria-label="Notifications"
            role="button"
          >
            <Bell
              className="w-5 md:w-6 h-auto text-gray-600"
              strokeWidth={1.5}
            />
          </div>

          {isNotificationVisible && (
            <>
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                onClick={hideNotification}
              />
              <div
                ref={notificationRef}
                className={`absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg p-4 z-50 ${
                  showNotification
                    ? "animate-dropdown-open"
                    : "animate-dropdown-close"
                }`}
                role="alert"
                aria-live="polite"
                onAnimationEnd={() => {
                  if (!showNotification) {
                    setIsNotificationVisible(false);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("notifications.communityLive.title")}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t("notifications.communityLive.message")}
                    </p>
                  </div>
                  {/* Close Button */}
                  <button
                    onClick={hideNotification}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-3">
                  <Link
                    to="/community"
                    className="inline-block text-sm text-[var(--font-light)] bg-[#17627A] hover:bg-[var(--primary-800)] px-3 py-1 rounded"
                    onClick={hideNotification}
                  >
                    {t("notifications.communityLive.action")}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <img
            src={user.profile_picture ?? userImg}
            alt="User Avatar"
            className="w-7 md:w-8 h-auto rounded-full object-cover cursor-pointer"
            onClick={toggleDropdown}
            key={`profile-${userId}`}
          />

          {isDropdownVisible && (
            <div
              className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ${
                showDropdown
                  ? "animate-dropdown-open"
                  : "animate-dropdown-close"
              }`}
              onAnimationEnd={() => {
                if (!showDropdown) {
                  setIsDropdownVisible(false);
                }
              }}
            >
              <Link
                to="/user-profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={handleCloseDropdown}
              >
                {t("navigation.profile")}
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t("navigation.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
