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
    <li>
      <Link to={linkInfo.href}>
        {isExpanded ? (
          <div
            className={`flex relative font-medium w-full h-10 transition-all duration-300 ease-in-out items-center justify-start hover-element ${
              isActive ? "bg-gradient-to-r" : "hover:bg-gradient-to-r"
            } from-[#000000] to-[#2c0752]`}
          >
            <div className="flex flex-row items-center px-3 gap-4">
              <div className="w-[18px] h-[18px] mt-[-6px]">{linkInfo.icon}</div>
              <span className="ml-2 text-white text-sm">{linkInfo.title}</span>
            </div>
          </div>
        ) : (
          <div
            className={`mx-auto w-full h-10 pr-2 transition-all grid place-items-center duration-300 ease-in-out hover-element ${
              isActive ? "bg-gradient-to-r" : "hover:bg-gradient-to-r"
            } from-[#000000] to-[#2c0752]`}
          >
            <div className="w-4 h-4 mt-[-8px] mx-auto">{linkInfo.icon}</div>
          </div>
        )}
      </Link>
    </li>
  );
};

export default SidebarItem;
