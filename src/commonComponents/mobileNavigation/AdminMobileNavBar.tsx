import { useLocation, Link } from 'react-router-dom';
import AdminDashboardController from '../icons/sidebarIcons/AdminDashboardController';
import ManageStudentsController from '../icons/sidebarIcons/ManagestudentsController';
import CourseBuilderController from '../icons/sidebarIcons/CourseBuilderController';
import WorkshopRegistrationController from '../icons/sidebarIcons/WorkshopRegistrationController';
import LiveAdminIconController from '../icons/sidebarIcons/LiveAdminIconController';
import AssesmentStudentResultsController from '../icons/sidebarIcons/AssesmentStudentsResultsController';
import ReferalsController from '../icons/sidebarIcons/ReferalsController';
import EmailIconController from '../icons/sidebarIcons/EmailIconController';
import PaymentIconsController from '../icons/sidebarIcons/PaymentIconsController';
import WebinarManagementController from '../icons/sidebarIcons/WebinarManagementController';

const AdminMobileNavBar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin/dashboard' && location.pathname === '/admin/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin/dashboard';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#E9F4FB] shadow-lg z-50">
      <div
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap px-2 py-2 scroll-smooth snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <NavItem
          to="/admin/dashboard"
          icon={<AdminDashboardController />}
          label="Dashboard"
          isActive={isActive('/admin/dashboard')}
        />
        <NavItem
          to="/admin/manage-students"
          icon={<ManageStudentsController />}
          label="Manage Students"
          isActive={isActive('/admin/manage-students')}
        />
        <NavItem
          to="/admin/courses"
          icon={<CourseBuilderController />}
          label="Course Builder"
          isActive={isActive('/admin/courses')}
        />
        <NavItem
          to="/admin/workshop-registrations"
          icon={<WorkshopRegistrationController />}
          label="Workshop Registrations"
          isActive={isActive('/admin/workshop-registrations')}
        />
        <NavItem
          to="/admin/assesment-results"
          icon={<AssesmentStudentResultsController />}
          label="Assesment Results"
          isActive={isActive('/admin/assesment-results')}
        />
        <NavItem
          to="/admin/referals"
          icon={<ReferalsController />}
          label="Referrals"
          isActive={isActive('/admin/referals')}
        />
        <NavItem
          to="/admin/email-send"
          icon={<EmailIconController />}
          label="Emails"
          isActive={isActive('/admin/email-send')}
        />
        <NavItem
          to="/admin/live"
          icon={<LiveAdminIconController />}
          label="Live"
          isActive={isActive('/admin/live')}
        />
        <NavItem
          to="/admin/payment-links"
          icon={<PaymentIconsController />}
          label="Payment Links"
          isActive={isActive('/admin/payment-links')}
        />
        <NavItem
          to="/admin/webinar-management"
          icon={<WebinarManagementController />}
          label="Webinar Management"
          isActive={isActive('/admin/webinar-management')}
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

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center shrink-0 min-w-[72px] px-4 py-2 rounded-lg snap-start transition-colors duration-200 ${isActive
        ? 'text-[#0E1F2F] bg-white/70'
        : 'text-gray-600 hover:text-[#0E1F2F]'
        }`}
    >
      <div className="mb-1">
        {icon}
      </div>
      <span className="text-[8px] font-medium text-center">{label}</span>
    </Link>
  );
};

export default AdminMobileNavBar;