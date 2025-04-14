import SidebarLogo from "../sidebar/components/SidebarLogo";
import SidebarMenu from "./components/SidebarMenu";
interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  return (
    <div
      className={`side-navigation   top-0 left-0 h-[calc(100vh-2px)]  ${
        isExpanded ? "w-[220px]" : "w-[80px]"
      } rounded-lg text-black px-0 flex flex-col items-center py-4 transition-all duration-300 ease-in-out`}
    >
      <SidebarLogo isExpanded={isExpanded} onClickArrow={toggleSidebar} />
      <nav className="flex w-full flex-col space-y-2">
        <SidebarMenu isExpanded={isExpanded} />
      </nav>
    </div>
  );
};

export default Sidebar;
