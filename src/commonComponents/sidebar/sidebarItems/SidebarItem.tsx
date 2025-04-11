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
            className={`flex relative font-medium w-full h-[66px] transition-all duration-300 ease-in-out items-center justify-start hover-element rounded-2xl ${
              isActive ? "bg-black" : ""
            } from-[#000000]`}
          >
            <div className="flex flex-row items-center px-3 gap-4">
              <div className="w-[18px] h-[18px] mt-[-6px]">{linkInfo.icon}</div>
              <span className={`ml-2 text-xl ${isActive ? "text-white" : "text-black"}`}>{linkInfo.title}</span>
            </div>
          </div>
        ) : (
          <div
            className={`mx-auto w-full h-[66px] pr-2 transition-all grid place-items-center duration-300 ease-in-out hover-element rounded-2xl ${
              isActive ? "bg-black" : ""
            } from-[#000000] `}
          >
            <div className="w-4 h-4 mt-[-8px] mx-auto">{linkInfo.icon}</div>
          </div>
        )}
      </Link>
    </li>
  );
};

export default SidebarItem;
