import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, BookCopy, FileText, Briefcase, Video } from 'lucide-react';

const MobileNavBar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl border-t border-gray-200">
      <div className="flex justify-around items-center pt-3 pb-2">
        <NavItem 
          to="/"
          icon={<LayoutDashboard size={22} strokeWidth={1.5} />}
          label="Learn" 
          isActive={isActive('/')}
        />
        <NavItem 
          to="/courses" 
          icon={<BookCopy size={22} strokeWidth={1.5} />} 
          label="Courses" 
          isActive={isActive('/courses')}
        />
        <NavItem 
          to="/assessments" 
          icon={<FileText size={22} strokeWidth={1.5} />} 
          label="Tests" 
          isActive={isActive('/assessments')}
        />
        <NavItem 
          to="/jobs" 
          icon={<Briefcase size={22} strokeWidth={1.5} />} 
          label="Jobs" 
          isActive={isActive('/jobs')}
        />
        <NavItem 
          to="/live" 
          icon={<Video size={22} strokeWidth={1.5} />} 
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
  const activeColor = '#1A5A7A';
  const inactiveColor = '#255C79';

  return (
    <Link 
      to={to} 
      className="flex flex-col items-center justify-center w-1/5 py-1 transition-transform duration-300 ease-in-out"
    >
      <div className={`transform transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'scale-100'}`}>
        <div style={{ color: isActive ? activeColor : inactiveColor }}>
          {icon}
        </div>
      </div>
      <span 
        className="text-xs mt-1 transition-colors duration-300"
        style={{ color: isActive ? activeColor : inactiveColor }}
      >
        {label}
      </span>
      <div 
        className={`h-1 w-1 rounded-full bg-[${activeColor}] transition-opacity duration-300 mt-1 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
    </Link>
  );
};

export default MobileNavBar;