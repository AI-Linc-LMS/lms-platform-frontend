import { useLocation, Link } from 'react-router-dom';
import CoursesIconController from '../icons/sidebarIcons/CoursesIconController';
import DashboardController from '../icons/sidebarIcons/DashboardController';
import AssessmentsIconController from '../icons/sidebarIcons/AssessmentsIconController';
import JobsIconController from '../icons/sidebarIcons/JobsIconController';
import LiveIconController from '../icons/sidebarIcons/LiveIconController';
import CommunityIconController from '../icons/sidebarIcons/CommunityIconController';

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
      <div
        className="flex items-center gap-3 overflow-x-auto whitespace-nowrap px-2 py-2 scroll-smooth snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <NavItem
          to="/"
          icon={<DashboardController />}
          label="Dashboard"
          isActive={isActive('/')}
        />
        <NavItem
          to="/courses"
          icon={<CoursesIconController />}
          label="Courses"
          isActive={isActive('/courses')}
        />
        <NavItem
          to="/assessment/ai-linc-scholarship-test-2"
          icon={<AssessmentsIconController />}
          label="Assessments"
          isActive={isActive('/assessment')}
        />
        <NavItem
          to="/live"
          icon={<LiveIconController />}
          label="Live"
          isActive={isActive('/live')}
        />
        <NavItem
          to="/jobs"
          icon={<JobsIconController />}
          label="Jobs"
          isActive={isActive('/jobs')}
        />
        <NavItem
          to="/community"
          icon={<CommunityIconController />}
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
      className={`flex flex-col items-center shrink-0 px-3 snap-start ${isActive ? 'text-[#1A5A7A]' : 'text-gray-500'
        }`}
    >
      <div className={`${isActive ? 'text-[#1A5A7A]' : 'text-gray-500'} mb-1`}>
        {icon}
      </div>
      <span className="text-xs">{label}</span>
    </Link>
  );
};

export default MobileNavBar;