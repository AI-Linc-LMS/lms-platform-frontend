import bellIcon from "../commonComponents/icons/nav/BellIcon.png";
import userImg from "../commonComponents/icons/nav/User Image.png";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { logout } from "../redux/slices/userSlice";
import { handleMobileNavigation } from "../utils/authRedirectUtils";

interface UserState {
  profile_picture?: string;
  id?: string | null;
}

const TopNav: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: { user: UserState }) => state.user);
  const dispatch = useDispatch();

  const userId = user.id;
  const { isAdminOrInstructor, isSuperAdmin } = useRole();

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

  const hideNotification = useCallback(() => {
    setShowNotification(false);
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleCloseDropdown, hideNotification]);

  // Show notification only ONCE per user when landing on home path
  useEffect(() => {
    if (location.pathname === "/") {
      const hasSeenCommunityModal = localStorage.getItem("hasSeenCommunityModal");
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
    <div className="w-full bg-white shadow flex justify-between md:justify-end items-center px-4 py-2">
        
        <div className="md:hidden">
        <img
          src={import.meta.env.VITE_CLIENT_LOGO}
          alt="Logo"
          className="h-8 w-auto cursor-pointer"
          onClick={() => navigate('/')}
        />
        </div>
        <div className="flex items-center gap-3 md:gap-5">
            {(isAdminOrInstructor || isSuperAdmin) && (
                <Link
                    to="/admin/dashboard"
            className="bg-[#17627A] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#124F65] transition-colors"
          >
            Admin
          </Link>
        )}
        <div className="relative">
          <div
            className="bg-gray-100 p-2 rounded-md cursor-pointer"
            onClick={triggerNotification}
            aria-label="Notifications"
            role="button"
          >
            <img src={bellIcon} alt="Notifications" className="w-4 md:w-7 h-auto" />
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
                      Community is live!
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Join discussions, ask questions, and connect with peers.
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
                    className="inline-block text-sm text-white bg-[#17627A] hover:bg-[#124F65] px-3 py-1 rounded"
                    onClick={hideNotification}
                  >
                    Go to Community
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
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
