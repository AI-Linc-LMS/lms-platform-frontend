import SidebarList from "../sidebarItems/SidebarList";
import { SidebarLinkInfo } from "../../../constants/typings";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useMemo } from "react";
import { filterNavigationByAdminFeatures } from "./helper/filterNavigation";
// import { FiLink } from 'react-icons/fi';
// import { Link, useLocation } from 'react-router-dom';

interface AdminSidebarMenuProps {
  isExpanded: boolean;
}

const AdminSidebarMenu = ({ isExpanded }: AdminSidebarMenuProps) => {
  // const location = useLocation();
  // const isActive = location.pathname === '/admin/payment-links';
  //const clientId = Number(import.meta.env.VITE_CLIENT_ID);

  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  const filteredNavigationLinks = useMemo(() => {
    return filterNavigationByAdminFeatures(clientInfo?.data?.features || []);
  }, [clientInfo?.data?.features]);

  return (
    <div
      className={`${
        isExpanded ? "px-2" : "px-2"
      } h-full w-full flex flex-col divide-y-[0.5px] divide-[#D3D3D318] items-center`}
    >
      {filteredNavigationLinks.map((link: SidebarLinkInfo) => (
        // (clientId === 1 || link.id <= 2) && (
        <SidebarList
          key={link.title}
          title={link.title}
          links={link.links}
          isExpanded={isExpanded}
        />
      ))}

      {/* <div className="w-full">
        <Link
          to="/admin/payment-links"
          className={`flex items-center w-full px-4 text-base transition-colors ${
            isActive
              ? 'text-[var(--primary-500)] bg-[#E5EEF2] font-medium'
              : 'text-[#536066] hover:bg-[#E5EEF2]/50 font-normal'
          }`}
        >
          <div className="flex items-center">
            <FiLink 
              className={`w-[18px] h-[18px] min-w-[16px] ${
                isActive 
                  ? 'stroke-[var(--primary-500)] stroke-[1.5]' 
                  : 'stroke-[#536066] stroke-1'
              }`}
            />
            {isExpanded && (
              <span className="ml-3 whitespace-nowrap">Payment Links</span>
            )}
          </div>
        </Link>
      </div> */}
    </div>
  );
};

export default AdminSidebarMenu;
