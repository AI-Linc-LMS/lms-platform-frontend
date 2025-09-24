import SidebarLogo from "./components/SidebarLogo";
import AdminSidebarMenu from "./components/AdminSidebarMenu";

interface AdminSidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isExpanded,
  toggleSidebar,
}) => {
  return (
    <div
      className={`side-navigation top-0 left-0 h-[calc(100vh-2px)] ${
        isExpanded ? "w-[220px]" : "w-[80px]"
      } rounded-lg text-[var(--font-dark)] px-0 flex flex-col items-center py-4 transition-all duration-300 ease-in-out`}
    >
      <SidebarLogo isExpanded={isExpanded} onClickArrow={toggleSidebar} />
      <nav className="flex w-full flex-col">
        <AdminSidebarMenu isExpanded={isExpanded} />
      </nav>
    </div>
  );
};

export default AdminSidebar;
