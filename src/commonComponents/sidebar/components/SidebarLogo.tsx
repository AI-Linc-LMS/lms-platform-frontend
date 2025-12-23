import ArrowIcon from "../../icons/sidebarIcons/ArrowIcon";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store.ts";

interface SidebarLogoPartProps {
  isExpanded: boolean;
  onClickArrow: () => void;
}

const SidebarLogoPart = ({
  isExpanded,
  onClickArrow,
}: SidebarLogoPartProps) => {
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  return (
    <div
      className={`relative flex ${
        isExpanded
          ? "flex-col items-center gap-2 px-2"
          : "flex-col items-center justify-center"
      } text-[var(--font-primary)] w-full h-14 border-b border-[var(--neutral-200)] font-bold transition-all duration-300`}
    >
      {clientInfo.data?.app_logo_url && (
        <div
          className={`relative flex items-center justify-center transition-all duration-300 ${
            isExpanded ? "w-full h-full p-2" : "w-10 h-10"
          }`}
        >
          {/* Logo image */}
          <img
            src={
              isExpanded
                ? clientInfo.data.app_logo_url
                : clientInfo.data.app_icon_url
            }
            alt={`${clientInfo.data.name} logo`}
            className={`relative z-10 object-contain transition-all duration-300 ${
              isExpanded ? "h-full w-full max-h-10" : "h-6 w-6"
            }`}
          />
        </div>
      )}

      {/* Arrow toggle */}
      <div
        className={`${
          isExpanded ? "" : "rotate-180"
        } absolute w-[45px] h-[52px] grid place-items-center rounded-[12px] 
        transition-all duration-300 right-[-37px] bottom-[-12px] 
        bg-white border border-[var(--neutral-200)] shadow-md cursor-pointer pr-[3px] hover:scale-105 hover:shadow-lg`}
        onClick={onClickArrow}
      >
        <ArrowIcon className="text-[var(--font-primary)]" />
      </div>
    </div>
  );
};

export default SidebarLogoPart;
