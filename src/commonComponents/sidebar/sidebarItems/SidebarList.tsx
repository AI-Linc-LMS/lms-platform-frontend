import React from 'react';
import SidebarItem from '../sidebarItems/SidebarItem';
import { LinkInfo } from '../../../constants/typings';
import { useLocation } from 'react-router-dom';

interface SidebarListProps {
  title: string;
  links: LinkInfo[];
  isExpanded: boolean;
}

const SidebarList: React.FC<SidebarListProps> = ({ links, isExpanded }) => {
  const { pathname } = useLocation();

  return (
    <div className="flex w-full flex-col">
      <ul className="text-base font-semibold flex flex-col gap-2 mt-2">
        {links.map((link) => {
          let isActive = false;
          if (pathname.toLowerCase().includes(link.href.toLowerCase())) {
            isActive = true;
          }

          if (link.href === '/' && pathname !== '/') {
            isActive = false;
          }

          return (
            <SidebarItem
              key={link.id}
              linkInfo={link}
              isExpanded={isExpanded}
              isActive={isActive}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default SidebarList;
