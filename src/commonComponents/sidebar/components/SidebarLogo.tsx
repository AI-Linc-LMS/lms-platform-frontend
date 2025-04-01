// import ArrowIcon from '../Icons/ArrowIcon';

interface SidebarLogoPartProps {
  isExpanded: boolean;
  onClickArrow: () => void;
}

const SidebarLogoPart = ({
  isExpanded,
  onClickArrow,
}: SidebarLogoPartProps) => {
  return (
    <div className="relative overflow-visible w-full text-center items-center h-14 border-b-[0.5px] border-[#D3D3D318]">
      <h2 className={`font-bruno ${isExpanded ? 'text-base' : 'text-sm'}`}>
        X- ACK
      </h2>
      <h2 className={`text-[#9F55FF] ${isExpanded ? 'text-base' : 'text-xs'}`}>
        βeta
      </h2>
      <div
        className={`${isExpanded ? '' : 'rotate-180'} absolute w-[24px] h-[24px] grid place-items-center rounded-full transition-transform duration-300 right-[-12px] bottom-[-12px] bg-black border-[0.5px] border-[#B86E9F5A] cursor-pointer pr-[3px]`}
        onClick={onClickArrow}
      >
        {/* <ArrowIcon /> */}
      </div>
    </div>
  );
};

export default SidebarLogoPart;
