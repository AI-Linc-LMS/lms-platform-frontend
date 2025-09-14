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
            className={`flex relative font-medium w-full h-[56px] transition-all duration-300 ease-in-out items-center justify-start hover-element rounded-2xl ${
              isActive ? "bg-[#12293A]" : ""
            }`}
          >
            <div className="flex flex-row items-center px-2 gap-4">
              <div
                className={`w-[20px] h-[20px] flex items-center justify-center ${
                  isActive ? "text-white" : "text-black"
                }`}
              >
                {linkInfo.icon}
              </div>
              <span
                className={`text-lg ${isActive ? "text-white" : "text-black"}`}
              >
                {linkInfo.title}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center w-full h-[56px] transition-all duration-300 ease-in-out hover-element rounded-2xl ${
              isActive ? "bg-[#12293A]" : ""
            }`}
          >
            <div
              className={`w-[20px] h-[20px] flex items-center justify-center ${
                isActive ? "text-white" : "text-black"
              }`}
            >
              {linkInfo.icon}
            </div>
          </div>
        )}
      </Link>
      {!isExpanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20">
          {linkInfo.title}
        </div>
      )}
    </li>
  );
};

export default SidebarItem;

