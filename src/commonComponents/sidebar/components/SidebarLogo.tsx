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
      } text-neutral-900 w-full h-14 border-b border-[#D3D3D318] font-bold transition-all duration-300`}
    >
      {clientInfo.data?.app_logo_url && (
        <img
          src={
            isExpanded
              ? clientInfo.data.app_logo_url
              : clientInfo.data.app_icon_url
          }
          alt={`${clientInfo.data.name} logo`}
          className={`object-contain transition-all duration-300 ${
            isExpanded ? "h-full w-full" : "h-8 w-8"
          }`}
        />
      )}

      {/* {clientInfo?.data?.name && (
        <h2
          className={`font-bruno font-bold bg-gradient-to-r from-[#0BC5EA] to-[#6B46C1] 
          bg-clip-text text-transparent transition-all duration-300 ${
            isExpanded ? "text-base" : "text-[10px] leading-tight text-center"
          }`}
        >
          {clientInfo.data.name}
        </h2>
      )} */}

      {/* Arrow toggle */}
      <div
        className={`${
          isExpanded ? "" : "rotate-180"
        } absolute w-[45px] h-[52px] grid place-items-center rounded-[12px] 
        transition-transform duration-300 right-[-37px] bottom-[-12px] 
        bg-[var(--nav-background)] cursor-pointer pr-[3px]`}
        onClick={onClickArrow}
      >
        <ArrowIcon className="var(--font-dark-nav)" />
      </div>
    </div>
  );
};

export default SidebarLogoPart;
