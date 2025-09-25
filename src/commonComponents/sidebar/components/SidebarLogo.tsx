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
    <div className="relative text-neutral-900 overflow-visible w-full text-center items-center h-14 border-b-[0.5px] border-[#D3D3D318] font-bold">
      {clientInfo.data?.app_logo_url && (
        <img
          src={clientInfo?.data?.app_logo_url}
          alt={`${clientInfo?.data?.name} logo`}
          className="h-full mx-auto"
        />
      )}
      {clientInfo?.data?.name && (
        <h2
          className={`font-bruno  font-bold bg-gradient-to-r from-[#0BC5EA] to-[#6B46C1] bg-clip-text text-transparent ${
            isExpanded ? "text-base" : "text-sm"
          }`}
        >
          {clientInfo?.data?.name}
        </h2>
      )}

      <h2
        className={`text-[#9F55FF] ${isExpanded ? "text-base" : "text-xs"}`}
      ></h2>
      <div
        className={`${
          isExpanded ? "" : "rotate-180"
        } absolute w-[52px] h-[52px] grid place-items-center rounded-[12px] transition-transform duration-300 right-[-37px] bottom-[-12px] bg-[var(--nav-background)]  cursor-pointer pr-[3px]`}
        onClick={onClickArrow}
      >
        <ArrowIcon className="var(--font-dark-nav)" />
      </div>
    </div>
  );
};

export default SidebarLogoPart;
