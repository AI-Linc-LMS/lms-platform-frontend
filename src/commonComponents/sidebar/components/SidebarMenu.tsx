import { getNavigationLinks } from "../../../constants/NavigationLink";
import SidebarList from "../sidebarItems/SidebarList";
import { SidebarLinkInfo } from "../../../constants/typings";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useMemo } from "react";
import { filterNavigationByFeatures } from "./helper/filterNavigation";
interface SidebarMenuProps {
  isExpanded: boolean;
}

const SidebarMenu = ({ isExpanded }: SidebarMenuProps) => {
  const { t, i18n } = useTranslation();
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  const filteredNavigationLinks = useMemo(() => {
    const navigationLinks = getNavigationLinks(t);

    return filterNavigationByFeatures(
      clientInfo?.data?.features || [],
      navigationLinks
    );
  }, [clientInfo?.data?.features, i18n.language, t]);

  return (
    <div className="h-full w-full flex flex-col gap-1 items-center mt-4">
      {filteredNavigationLinks.map((link: SidebarLinkInfo) => (
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
