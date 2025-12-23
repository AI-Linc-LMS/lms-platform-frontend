import { Link } from "react-router-dom";
import { LinkInfo } from "../../../constants/typings";

const SidebarItem = ({
  linkInfo,
  isExpanded,
  isActive,
}: {
  linkInfo: LinkInfo;
  isExpanded: boolean;
  isActive: boolean;
}) => {
  return (
    <li className="relative group flex items-center">
      <Link to={linkInfo.href} className="w-full">
        {isExpanded ? (
          <div
            className={`flex relative font-medium w-full h-[48px] transition-all duration-200 ease-in-out items-center justify-start rounded-xl px-3 ${
              isActive 
                ? "bg-[var(--nav-selected)] text-white shadow-sm" 
                : "text-[var(--font-primary)] hover:bg-[var(--neutral-50)]"
            }`}
          >
            <div className="flex flex-row items-center gap-3">
              <div
                className={`w-5 h-5 flex items-center justify-center ${
                  isActive ? "text-white" : "text-[var(--font-secondary)]"
                }`}
              >
                {linkInfo.icon}
              </div>
              <span className="text-sm font-medium">
                {linkInfo.title}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center w-full h-[48px] transition-all duration-200 ease-in-out rounded-xl ${
              isActive 
                ? "bg-[var(--nav-selected)] text-white shadow-sm" 
                : "text-[var(--font-secondary)] hover:bg-[var(--neutral-50)]"
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {linkInfo.icon}
            </div>
          </div>
        )}
      </Link>
      {!isExpanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[var(--font-primary)] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-20 shadow-lg">
          {linkInfo.title}
        </div>
      )}
    </li>
  );
};

export default SidebarItem;
