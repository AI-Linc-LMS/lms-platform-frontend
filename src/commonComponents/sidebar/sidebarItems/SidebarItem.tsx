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
              isActive ? "bg-[#12293A]" : ""
            }`}
          >
            <div className="flex flex-row items-center px-4 gap-4">
              <div className={`w-[26px] h-[20px] flex items-center justify-center ${
                isActive ? "text-white" : "text-black"
              }`}>
                {linkInfo.icon}
              </div>
              <span
                className={`text-xl ${
                  isActive ? "text-white" : "text-black"
                }`}
              >
                {linkInfo.title}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center w-full h-[66px] transition-all duration-300 ease-in-out hover-element rounded-2xl ${
              isActive ? "bg-[#12293A]" : ""
            }`}
          >
            <div className={`w-[26px] h-[20px] flex items-center justify-center ${
              isActive ? "text-white" : "text-black"
            }`}>
              {linkInfo.icon}
            </div>
          </div>
        )}
      </Link>
    </li>
  );
};

export default SidebarItem;
