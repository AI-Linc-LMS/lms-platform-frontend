import Sidebar from "../commonComponents/sidebar/Sidebar";
// import Navbar from './Navbar/Navbar';
import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';

function Container({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Default expanded
  const [showSidebar, setShowSidebar] = useState(true); // Control sidebar visibility

  useEffect(() => {
    // Hide sidebar on CourseTopicDetailPage
    const isCourseTopicPage = location.pathname.includes('/learn/course/');
    setShowSidebar(!isCourseTopicPage);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Sidebar and Navbar */}
      {showSidebar && (
        <nav className="fixed z-[1111] top-0 w-full">
          <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
          {/* <div className="flex flex-col">
            <Navbar isSidebarExpanded={isSidebarExpanded} />
          </div> */}
        </nav>
      )}

      {/* Main Content Area */}
      <main
        className={`${
          showSidebar ? (isSidebarExpanded ? "ml-[250px]" : "ml-[90px]") : "ml-0"
        } pt-8 pb-0 mt-16 relative transition-all pl-7 pr-4 h-full`}
      >
        {children}
      </main>
    </div>
  );
}

export default Container;
