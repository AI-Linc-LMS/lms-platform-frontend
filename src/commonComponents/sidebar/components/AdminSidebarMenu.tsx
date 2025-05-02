import { AdminNavigationLinks } from "../../../constants/AdminNavigationLink";
import SidebarList from "../sidebarItems/SidebarList";
import { SidebarLinkInfo } from "../../../constants/typings";

interface AdminSidebarMenuProps {
  isExpanded: boolean;
}

const AdminSidebarMenu = ({ isExpanded }: AdminSidebarMenuProps) => {
  return (
    <div
      className={`${isExpanded ? "px-2" : "px-2"} h-full w-full flex flex-col gap-2 divide-y-[0.5px] divide-[#FFFFFF18] items-center my-14`}
    >
      {AdminNavigationLinks.map((link: SidebarLinkInfo) => (
        <SidebarList
          key={link.title}
          title={link.title}
          links={link.links}
          isExpanded={isExpanded}
        />
      ))}
    </div>
  );
};

export default AdminSidebarMenu; 