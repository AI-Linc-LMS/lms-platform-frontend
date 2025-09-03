import ArrowIcon from "../../icons/sidebarIcons/ArrowIcon";

interface SidebarLogoPartProps {
  isExpanded: boolean;
  onClickArrow: () => void;
}

const SidebarLogoPart = ({
  isExpanded,
  onClickArrow,
}: SidebarLogoPartProps) => {
  const clientName = import.meta.env.VITE_CLIENT_NAME;
  const logoUrl = import.meta.env.VITE_CLIENT_LOGO;
  return (
    <div className="relative text-neutral-900 overflow-visible w-full text-center items-center h-14 border-b-[0.5px] border-[#D3D3D318] font-bold">
      {logoUrl && (
        <img
          src={logoUrl}
          alt={`${clientName} logo`}
          className="h-full mx-auto"
        />
      )}
      {clientName && (
        <h2
          className={`font-bruno  font-bold bg-gradient-to-r from-[#0BC5EA] to-[#6B46C1] bg-clip-text text-transparent ${
            isExpanded ? "text-base" : "text-sm"
          }`}
        >
          {clientName}
        </h2>
      )}

      <h2
        className={`text-[#9F55FF] ${isExpanded ? "text-base" : "text-xs"}`}
      ></h2>
      <div
        className={`${
          isExpanded ? "" : "rotate-180"
        } absolute w-[52px] h-[52px] grid place-items-center rounded-[12px] transition-transform duration-300 right-[-37px] bottom-[-12px] bg-[#D7EFF6]  cursor-pointer pr-[3px]`}
        onClick={onClickArrow}
      >
        <ArrowIcon />
      </div>
    </div>
  );
};

export default SidebarLogoPart;
