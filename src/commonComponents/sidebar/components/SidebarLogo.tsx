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
        <div
          className={`relative flex items-center justify-center transition-all duration-300 ${
            isExpanded ? "w-full h-full p-2" : "w-10 h-10"
          }`}
        >
          {/* Soothing background layers */}
          <div
            className={`absolute inset-0 transition-all duration-300 ${
              isExpanded
                ? "bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-neutral-100/80 rounded-lg"
                : "bg-gradient-to-br from-slate-100/70 via-gray-100/50 to-neutral-50/70 rounded-full"
            }`}
          />

          {/* Subtle inner shadow for depth */}
          <div
            className={`absolute inset-0 transition-all duration-300 shadow-inner ${
              isExpanded ? "rounded-lg" : "rounded-full"
            }`}
            style={{
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          />

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
        transition-transform duration-300 right-[-37px] bottom-[-12px] 
        bg-[var(--nav-background)] cursor-pointer pr-[3px] hover:scale-105`}
        onClick={onClickArrow}
      >
        <ArrowIcon className="var(--font-dark-nav)" />
      </div>
    </div>
  );
};

export default SidebarLogoPart;
