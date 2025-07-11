import { AdminNavigationLinks } from '../../../constants/AdminNavigationLinks';
import SidebarList from '../sidebarItems/SidebarList';
import { SidebarLinkInfo } from '../../../constants/typings';
import { FiLink } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

interface AdminSidebarMenuProps {
  isExpanded: boolean;
}

const AdminSidebarMenu = ({ isExpanded }: AdminSidebarMenuProps) => {
  const location = useLocation();

  return (
    <div
      className={`${isExpanded ? 'px-2' : 'px-2'} h-full w-full flex flex-col gap-2 divide-y-[0.5px] divide-[#D3D3D318] items-center my-14`}
    >
      {AdminNavigationLinks.map((link: SidebarLinkInfo) => (
        <SidebarList
          key={link.title}
          title={link.title}
          links={link.links}
          isExpanded={isExpanded}
        />
      ))}

      <Link
        to="/admin/payment-links"
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900 ${
          location.pathname === '/admin/payment-links'
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600'
        }`}
      >
        <FiLink className="mr-3 h-5 w-5" />
        Payment Links
      </Link>
    </div>
  );
};

export default AdminSidebarMenu; 