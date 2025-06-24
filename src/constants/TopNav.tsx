import sunIcon from '../commonComponents/icons/nav/sunIcon.png';
import bellIcon from '../commonComponents/icons/nav/BellIcon.png';
import userImg from '../commonComponents/icons/nav/User Image.png';
import { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { logout } from '../redux/slices/userSlice';
import { handleMobileNavigation } from '../utils/authRedirectUtils';

interface UserState {
  profile_picture?: string;
  id?: string | null;
}

const TopNav: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useSelector((state: { user: UserState }) => state.user);
  const dispatch = useDispatch();

  const userId = user.id;
  const { isAdminOrInstructor } = useRole();

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    try {
      // Clear user data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Dispatch logout action
      dispatch(logout());

      // Navigate to login using mobile navigation
      handleMobileNavigation('/login', navigate, true, false);
    } catch (error) {
      console.error("Error during logout:", error);
      handleMobileNavigation('/login', navigate, true, false);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  console.log("user", user);
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
        {isAdminOrInstructor && (
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
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={bellIcon} alt="Notifications" className="w-7 h-7" />
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
