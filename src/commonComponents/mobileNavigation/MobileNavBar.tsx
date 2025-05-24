import { useLocation, Link } from 'react-router-dom';

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
        <NavItem 
          to="/community" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11Z" fill="currentColor"/>
              <path d="M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11Z" fill="currentColor"/>
              <path d="M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13Z" fill="currentColor"/>
              <path d="M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
            </svg>
          } 
          label="Community" 
          isActive={isActive('/community')}
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