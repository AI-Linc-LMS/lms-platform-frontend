import { getNavigationLinks } from '../../../constants/NavigationLink';
import SidebarList from '../sidebarItems/SidebarList';
import { SidebarLinkInfo } from '../../../constants/typings';
import { useTranslation } from 'react-i18next';

interface SidebarMenuProps {
  isExpanded: boolean;
}

const SidebarMenu = ({ isExpanded }: SidebarMenuProps) => {
  const { t } = useTranslation();
  const navigationLinks = getNavigationLinks(t);

  return (
    <div
      className={`${isExpanded ? 'px-2' : 'px-2'} h-full w-full flex flex-col gap-2 divide-y-[0.5px] divide-[#D3D3D318] items-center my-8`}
    >
      {navigationLinks.map((link: SidebarLinkInfo) => (
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

export default SidebarMenu;
