import sunIcon from "../commonComponents/icons/nav/sunIcon.png";
import bellIcon from "../commonComponents/icons/nav/BellIcon.png";
import userImg from "../commonComponents/icons/nav/User Image.png";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
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
    setShowDropdown(!showDropdown);
  };

  // Notification toast state for bell icon
  const [showNotification, setShowNotification] = useState(false);

  const hideNotification = useCallback(() => {
    setShowNotification(false);
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const triggerNotification = useCallback(() => {
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
      // Clear user data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Dispatch logout action
      dispatch(logout());

      // Navigate to login using mobile navigation
      handleMobileNavigation("/login", navigate, true, false);
    } catch {
      //console.error("Error during logout:", error);
      handleMobileNavigation("/login", navigate, true, false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      if (
        showNotification &&
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
  }, [showNotification, hideNotification]);

  // Auto show 4s notification when landing on home path
  useEffect(() => {
    if (location.pathname === "/") {
      triggerNotification();
    }
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
      }
    };
  }, [location.pathname, triggerNotification]);
  //console.log("user", user);
  return (
    <div className="w-full flex justify-between md:justify-end items-center px-4 pt-4">
      <div className="md:hidden">
        {/* <div className="w-12 h-12 bg-[#1A5A7A] text-white rounded-full flex items-center justify-center"> */}
        {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg> */}
        {/* </div> */}
      </div>

      <div className="flex items-center gap-5">
        {/* Admin Button - Only visible to admin and instructor users */}
        {(isAdminOrInstructor || isSuperAdmin) && (
          <Link
            to="/admin/dashboard"
            className="bg-[#17627A] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#124F65] transition-colors"
          >
            Admin
          </Link>
        )}
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={sunIcon} alt="Loading" className="w-7 h-7" />
        </div>
        <div className="relative">
          <div
            className="bg-gray-100 p-2 rounded-md cursor-pointer"
            onClick={triggerNotification}
            aria-label="Notifications"
            role="button"
          >
            <img src={bellIcon} alt="Notifications" className="w-7 h-7" />
          </div>

          {showNotification && (
            <>
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                onClick={hideNotification}
              />
              <div
                ref={notificationRef}
                className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg p-4 z-50"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Community is live!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Join discussions, ask questions, and connect with peers.
                    </p>
                  </div>
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
            className="w-8 h-8 rounded-full object-cover cursor-pointer"
            onClick={toggleDropdown}
            key={`profile-${userId}`}
          />

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link
                to="/user-profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                Profile
              </Link>
              {/* <Link
                to="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                Settings
              </Link> */}
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
