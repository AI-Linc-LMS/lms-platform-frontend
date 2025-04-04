import Sidebar from "../commonComponents/sidebar/Sidebar";
// import Navbar from './Navbar/Navbar';
import { useState } from "react";
// import { useLocation } from 'react-router-dom';

function Container({ children }: { children: React.ReactNode }) {
  //   const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Default expanded

  //   useEffect(() => {
  // Collapse sidebar only on MachinePreview page (/machines/:machineId)
  //     const isMachinePreviewPage = /^\/machines\/[^/]+$/.test(location.pathname);
  //     setIsSidebarExpanded(!isMachinePreviewPage); // Expanded by default elsewhere
  //   }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Sidebar and Navbar */}
      <nav className="fixed z-[1111] top-0 w-full">
        <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
        {/* <div className="flex flex-col">
          <Navbar isSidebarExpanded={isSidebarExpanded} />
        </div> */}
      </nav>

      {/* Main Content Area */}
      <main
        className={`${
          isSidebarExpanded ? "ml-[250px]" : "ml-[90px]"
        } pt-8 pb-0 mt-16 relative transition-all pl-7 pr-4 h-full`}
      >
        {children}
      </main>
    </div>
  );
}

export default Container;
