import sunIcon from '../commonComponents/icons/nav/sunIcon.png';
import bellIcon from '../commonComponents/icons/nav/BellIcon.png';
import userImg from '../commonComponents/icons/nav/User Image.png';
import { useRef} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

interface UserState {
  profile_picture?: string;
  id?: string | null;
}

const TopNav: React.FC = () => {;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useSelector((state: { user: UserState }) => state.user);
  const profilePicture = user.profile_picture;
  const userId = user.id;
  const { isAdminOrInstructor } = useRole();

  const toggleDropdown = () => {
    navigate('/user-profile');
  };

  
  // Close dropdown on outside click
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       dropdownRef.current &&
  //       !dropdownRef.current.contains(event.target as Node)
  //     ) {
  //       setShowDropdown(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

  // Add unique query parameter to profile picture URL to prevent caching
  const getProfilePictureUrl = () => {
    if (!profilePicture) return userImg;

    // If the URL already contains a query parameter, append a timestamp
    const hasQueryParams = profilePicture.includes('?');
    const separator = hasQueryParams ? '&' : '?';

    // Add userId as part of the cache-busting strategy
    return `${profilePicture}${separator}uid=${userId}&t=${Date.now()}`;
  };

  return (
    <div className="w-full flex justify-between md:justify-end items-center px-4 pt-4">
      <div className="md:hidden">
        <div className="w-12 h-12 bg-[#1A5A7A] text-white rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
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
            src={getProfilePictureUrl()}
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover cursor-pointer"
            onClick={toggleDropdown}
            key={`profile-${userId}`}
          />
        </div>
      </div>
    </div>
  );
};

export default TopNav;
