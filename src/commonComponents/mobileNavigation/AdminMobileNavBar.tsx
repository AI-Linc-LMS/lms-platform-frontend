import { useLocation, Link } from 'react-router-dom';

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
      <div className="flex justify-around items-center py-2">
        <NavItem 
          to="/admin/dashboard" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
            </svg>
          } 
          label="Dashboard" 
          isActive={isActive('/admin/dashboard')}
        />
        <NavItem 
          to="/admin/manage-students" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 13.5C16 14.8261 16.5268 16.0979 17.4645 17.0355C18.4021 17.9732 19.6739 18.5 21 18.5C22.3261 18.5 23.5979 17.9732 24.5355 17.0355C25.4732 16.0979 26 14.8261 26 13.5C26 12.1739 25.4732 10.9021 24.5355 9.96447C23.5979 9.02678 22.3261 8.5 21 8.5C19.6739 8.5 18.4021 9.02678 17.4645 9.96447C16.5268 10.9021 16 12.1739 16 13.5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M28.5 17.25C30.5711 17.25 32.25 15.8509 32.25 14.125C32.25 12.3991 30.5711 11 28.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13.5 17.25C11.4289 17.25 9.75 15.8509 9.75 14.125C9.75 12.3991 11.4289 11 13.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          } 
          label="Students" 
          isActive={isActive('/admin/manage-students')}
        />
        <NavItem 
          to="/admin/courses" 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
            </svg>
          } 
          label="Course Builder" 
          isActive={isActive('/admin/courses')}
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
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors duration-200 ${
        isActive 
          ? 'text-[#0E1F2F] bg-white/70' 
          : 'text-gray-600 hover:text-[#0E1F2F]'
      }`}
    >
      <div className="mb-1">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
};

export default AdminMobileNavBar; 