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