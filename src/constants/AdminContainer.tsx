import { useState } from "react";
import TopNav from "./TopNav";
import AdminSidebar from "../commonComponents/sidebar/AdminSidebar";

interface AdminContainerProps {
  children: React.ReactNode;
}

const AdminContainer = ({ children }: AdminContainerProps) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Top Navigation */}
      <TopNav />

      {/* Admin Sidebar */}
      <nav className="fixed z-[1111] top-0 w-full">
        <AdminSidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
      </nav>

      {/* Main Content Area */}
      <main
        className={`${
          isSidebarExpanded ? "ml-[250px]" : "ml-[90px]"
        } pb-0 mt-10 relative transition-all pl-7 pr-4 h-full`}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminContainer; 