import sunIcon from '../commonComponents/icons/nav/sunIcon.png'; 
import bellIcon from '../commonComponents/icons/nav/BellIcon.png';
import userImg from '../commonComponents/icons/nav/User Image.png'; 
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

interface UserState {
  profile_picture?: string;
}

const TopNav: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: { user: UserState }) => state.user);
  const profilePicture = user.profile_picture;
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Dispatch logout action to reset the auth state
    dispatch(logout());
    
    // Navigate to login page
    navigate('/login');
    
    // Close dropdown
    setShowDropdown(false);
  };

  return (
    <div className="w-full flex justify-between md:justify-end items-center px-4 pt-4">
      {/* Logo - Only visible on mobile */}
      <div className="md:hidden">
        <div className="w-12 h-12 bg-[#1A5A7A] text-white rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Right Side - Spinner, Bell, Avatar */}
      <div className="flex items-center gap-5">
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={sunIcon} alt="Loading" className="w-7 h-7" />
        </div>
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={bellIcon} alt="Notifications" className="w-7 h-7" />
        </div>
        <div className="relative">
          <img
            src={profilePicture || userImg}
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover cursor-pointer"
            onClick={toggleDropdown}
          />
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
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
