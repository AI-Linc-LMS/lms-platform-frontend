import { useLocation, Link } from 'react-router-dom';
import CoursesIconController from '../icons/sidebarIcons/CoursesIconController';

const MobileNavBar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#E9F4FB] shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        <NavItem 
          to="/" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
              <path d="M7 7H9V9H7V7Z" fill="currentColor"/>
              <path d="M11 7H17V9H11V7Z" fill="currentColor"/>
              <path d="M7 11H9V13H7V11Z" fill="currentColor"/>
              <path d="M11 11H17V13H11V11Z" fill="currentColor"/>
              <path d="M7 15H9V17H7V15Z" fill="currentColor"/>
              <path d="M11 15H17V17H11V15Z" fill="currentColor"/>
            </svg>
          } 
          label="Learn" 
          isActive={isActive('/')}
        />
        <NavItem 
          to="/courses" 
          icon={<CoursesIconController />} 
          label="Courses" 
          isActive={isActive('/courses')}
        />
        <NavItem 
          to="/assessments" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
              <path d="M16 18V16H8V18H16ZM16 14V12H8V14H16ZM10 10V8H8V10H10Z" fill="currentColor"/>
            </svg>
          } 
          label="Tests" 
          isActive={isActive('/assessments')}
        />
        <NavItem 
          to="/jobs" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="currentColor"/>
              <path d="M13 10H11V13H8V15H11V18H13V15H16V13H13V10Z" fill="currentColor"/>
            </svg>
          } 
          label="Jobs" 
          isActive={isActive('/jobs')}
        />
        <NavItem 
          to="/live" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor"/>
            </svg>
          } 
          label="Live" 
          isActive={isActive('/live')}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center ${
        isActive ? 'text-[#1A5A7A]' : 'text-gray-500'
      }`}
    >
      <div className={`${isActive ? 'text-[#1A5A7A]' : 'text-gray-500'}`}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default MobileNavBar; 