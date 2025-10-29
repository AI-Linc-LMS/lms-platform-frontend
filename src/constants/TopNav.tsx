import { Bell, Clock, CloudLightning } from "lucide-react";
import userImg from "../commonComponents/icons/nav/User Image.png";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { logout } from "../redux/slices/userSlice";
import { handleMobileNavigation } from "../utils/authRedirectUtils";
import { RootState } from "../redux/store.ts";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  getDailyLeaderboard,
  getStreakTableData,
  StreakData,
} from "../services/dashboardApis";

interface UserState {
  profile_picture?: string;
  id?: string | null;
}

const TopNav: React.FC = () => {
  const { t, i18n } = useTranslation();
  const clientId = import.meta.env.VITE_CLIENT_ID;
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

  const userId = user.id;
  const { isAdminOrInstructor, isSuperAdmin } = useRole();

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

  const { data } = useQuery<StreakData>({
    queryKey: ["streakTable", Number(clientId)],
    queryFn: () => getStreakTableData(Number(clientId)),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

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
    <header
      className={`sticky top-0 z-40 w-full bg-[var(--nav-background)] md:bg-white border-b border-gray-200 shadow-sm ${
        isRTL ? "direction-rtl" : ""
      }`}
    >
      <div className="w-full max-w-full">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-3.5 gap-2 sm:gap-3">
          {/* Logo - Visible on mobile */}
          <div className="flex-shrink-0 md:hidden">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-neutral-100/80 rounded-lg" />
              <div
                className="absolute inset-0 rounded-lg shadow-inner"
                style={{
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              />
              <img
                src={clientInfo.data?.app_logo_url}
                alt={clientInfo.data?.name}
                className="relative z-10 h-12 sm:h-14 w-auto cursor-pointer p-1.5"
                onClick={() => navigate("/")}
              />
            </div>
          </div>

          {/* Right side navigation items */}
          <nav
            className={`flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            {/* Streak Badge */}
            <div className="relative">
              <motion.span
                className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs bg-[#FFF8E0] rounded-full border border-[#f9cd0c] relative overflow-hidden cursor-pointer whitespace-nowrap"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
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
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-[#f9cd0c] me-1 sm:me-2 relative z-10 drop-shadow-[0_0_3px_rgba(249,205,12,0.8)] flex-shrink-0" />
                </motion.div>

                <motion.span
                  className="text-secondary-500 font-bold relative z-10 truncate"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <span className="hidden sm:inline">Today's Leaders</span>
                  <span className="sm:hidden">Leader</span>
                </motion.span>
              </motion.span>

              {/* Streak Tooltip */}
              {isStreakTooltipVisible && (
                <div
                  ref={streakTooltipRef}
                  className={`fixed sm:absolute ${
                    isRTL ? "right-0 sm:right-auto" : "left-0"
                  } top-14 sm:top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 z-50 ${
                    showStreakTooltip
                      ? "animate-dropdown-open"
                      : "animate-dropdown-close"
                  }`}
                  style={{
                    left: window.innerWidth < 640 ? "1rem" : undefined,
                  }}
                  onAnimationEnd={() => {
                    if (!showStreakTooltip) {
                      setIsStreakTooltipVisible(false);
                    }
                  }}
                >
                  <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
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
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : index === 1
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                #{index + 1}
                              </span>
                              <span className="text-sm text-gray-700 truncate">
                                {user.name}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-[#17627A] flex-shrink-0 ml-2">
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
            <div className="relative">
              <motion.span
                className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs bg-[#FFF8E0] rounded-full border border-[#f9cd0c] relative overflow-hidden cursor-pointer whitespace-nowrap"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
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
              >
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
                  <CloudLightning className="h-3 w-3 sm:h-4 sm:w-4 text-[#f9cd0c] me-1 sm:me-2 relative z-10 drop-shadow-[0_0_3px_rgba(249,205,12,0.8)] flex-shrink-0" />
                </motion.div>

                <motion.span
                  className="text-secondary-500 font-bold relative z-10 truncate"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <span className="hidden sm:inline">
                    {t("dashboard.streak.days", {
                      count: data?.current_streak,
                    })}{" "}
                    Streak
                  </span>
                  <span className="sm:hidden">{data?.current_streak}d</span>
                </motion.span>
              </motion.span>
            </div>

            {/* Admin Link */}
            {(isAdminOrInstructor || isSuperAdmin) && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex bg-[#17627A] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:bg-[var(--primary-800)] transition-colors whitespace-nowrap"
              >
                {t("navigation.admin")}
              </Link>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="bg-gray-100 p-2 rounded-md cursor-pointer hover:bg-gray-200 transition-colors flex-shrink-0"
                onClick={triggerNotification}
                aria-label="Notifications"
              >
                <Bell
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600"
                  strokeWidth={1.5}
                />
              </button>

              {isNotificationVisible && (
                <>
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                    onClick={hideNotification}
                  />
                  <div
                    ref={notificationRef}
                    className={`fixed sm:absolute ${
                      isRTL ? "left-4 sm:left-0" : "right-4 sm:right-0"
                    } top-14 sm:top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 ${
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {t("notifications.communityLive.title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("notifications.communityLive.message")}
                        </p>
                      </div>
                      <button
                        onClick={hideNotification}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        aria-label="Close notification"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/community"
                        className="inline-block text-sm text-white bg-[#17627A] hover:bg-[var(--primary-800)] px-4 py-2 rounded transition-colors"
                        onClick={hideNotification}
                      >
                        {t("notifications.communityLive.action")}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative flex justify-center" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="relative"
                aria-label="User menu"
              >
                <img
                  src={user.profile_picture ?? userImg}
                  alt="User Avatar"
                  className="w-7  h-auto md:w-8  rounded-full object-cover cursor-pointer"
                  key={`profile-${userId}`}
                />
              </button>

              {isDropdownVisible && (
                <div
                  className={`absolute ${
                    isRTL ? "left-0" : "right-0"
                  } mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 ${
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
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={handleCloseDropdown}
                  >
                    {t("navigation.profile")}
                  </Link>
                  {(isAdminOrInstructor || isSuperAdmin) && (
                    <Link
                      to="/admin/dashboard"
                      className="sm:hidden block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                      onClick={handleCloseDropdown}
                    >
                      {t("navigation.admin")}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    {t("navigation.logout")}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
