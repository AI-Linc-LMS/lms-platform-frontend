import sunIcon from '../commonComponents/icons/nav/sunIcon.png'; 
import bellIcon from '../commonComponents/icons/nav/BellIcon.png';
import userImg from '../commonComponents/icons/nav/User Image.png'; 

const TopNav: React.FC = () => {
  return (
    <div className="w-full flex justify-end items-center px-4 pt-4">
      {/* Right Side - Spinner, Bell, Avatar */}
      <div className="flex items-center gap-5">
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={sunIcon} alt="Loading" className="w-7 h-7" />
        </div>
        <div className="bg-gray-100 p-2 rounded-md">
          <img src={bellIcon} alt="Notifications" className="w-7 h-7" />
        </div>
        <img
          src={userImg}
          alt="User Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      </div>
    </div>
  );
};

export default TopNav;
