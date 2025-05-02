import sunIcon from '../commonComponents/icons/nav/sunIcon.png'; 
import bellIcon from '../commonComponents/icons/nav/BellIcon.png';
import userImg from '../commonComponents/icons/nav/User Image.png'; 
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAuth } from '../redux/slices/authSlice';
import { logout as logoutUser } from '../redux/slices/userSlice';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../redux/store';

const TopNav: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (showAdminDropdown) setShowAdminDropdown(false);
  };

  const toggleAdminDropdown = () => {
    setShowAdminDropdown(!showAdminDropdown);
    if (showDropdown) setShowDropdown(false);
  };

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Dispatch logout actions to reset both state slices
    dispatch(logoutAuth());
    dispatch(logoutUser());
    
    // Navigate to login page
    navigate('/login');
    
    // Close dropdown
    setShowDropdown(false);
  };

  const navigateToAdmin = (path: string) => {
    navigate(path);
    setShowAdminDropdown(false);
  };

  // Use profile picture from Google account if available, otherwise use default image
  const profileImage = user?.profile_picture || userImg;

  return (
    <div className="w-full flex justify-end items-center px-4 pt-4">
      {/* Right Side - Spinner, Bell, Admin, Avatar */}
      <div className="flex items-center gap-5">
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={sunIcon} alt="Loading" className="w-7 h-7" />
        </div>
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={bellIcon} alt="Notifications" className="w-7 h-7" />
        </div>
        <div className="relative">
          <button 
            onClick={toggleAdminDropdown}
            className="bg-gray-100 p-2 rounded-md text-sm font-medium"
          >
            Admin
          </button>
          {showAdminDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <button
                onClick={() => navigateToAdmin('/admin/course-builder')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Course Builder
              </button>
              <button
                onClick={() => navigateToAdmin('/admin/users')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                User Management
              </button>
              <button
                onClick={() => navigateToAdmin('/admin/analytics')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Analytics
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <img
            src={profileImage}
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
