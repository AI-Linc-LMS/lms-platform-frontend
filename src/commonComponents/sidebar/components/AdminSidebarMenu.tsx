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
  const isActive = location.pathname === '/admin/payment-links';

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

      <div className="w-full pt-2">
        <Link
          to="/admin/payment-links"
          className={`flex items-center w-full px-4 py-2.5 text-base transition-colors ${
            isActive
              ? 'text-[#255C79] bg-[#E5EEF2] font-medium'
              : 'text-[#536066] hover:bg-[#E5EEF2]/50 font-normal'
          }`}
        >
          <div className="flex items-center">
            <FiLink 
              className={`w-[22px] h-[22px] min-w-[22px] ${
                isActive 
                  ? 'stroke-[#255C79] stroke-[1.5]' 
                  : 'stroke-[#536066] stroke-1'
              }`}
            />
            {isExpanded && (
              <span className="ml-3 whitespace-nowrap">Payment Links</span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebarMenu; 