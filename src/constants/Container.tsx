import Sidebar from "../commonComponents/sidebar/Sidebar";
import AdminSidebar from "../commonComponents/sidebar/AdminSidebar";
import TopNav from "../constants/TopNav"; 
import MobileNavBar from "../commonComponents/mobileNavigation/MobileNavBar";
import AdminMobileNavBar from "../commonComponents/mobileNavigation/AdminMobileNavBar";
import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';

function Container({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Default expanded
  const [showSidebar, setShowSidebar] = useState(true); // Control sidebar visibility
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    // Hide sidebar and mobile nav on CourseTopicDetailPage
    const isCourseTopicPage = location.pathname.includes('/learn/course/');
    // Check if current route is an admin route
    const isAdmin = location.pathname.startsWith('/admin');
    
    setShowSidebar(!isCourseTopicPage);
    setShowMobileNav(!isCourseTopicPage);
    setIsAdminRoute(isAdmin);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Top Navigation */}
      <TopNav />

      {/* Sidebar and Navbar */}
      {showSidebar && (
        <nav className="fixed z-[1111] top-0 w-full hidden md:block">
          {isAdminRoute ? (
            <AdminSidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
          ) : (
            <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
          )}
          {/* <div className="flex flex-col">
            <Navbar isSidebarExpanded={isSidebarExpanded} />
          </div> */}
        </nav>
      )}

      {/* Main Content Area */}
      <main
        className={`${
          showSidebar ? (isSidebarExpanded ? "md:ml-[250px]" : "md:ml-[90px]") : "ml-0"
        } pb-20 md:pb-0 mt-10 relative transition-all pl-4 pr-4 md:pl-7 md:pr-4 h-full`}
      >
        {children}
      </main>

      {/* Mobile Navigation Bar */}
      {showMobileNav && (
        isAdminRoute ? <AdminMobileNavBar /> : <MobileNavBar />
      )}
    </div>
  );
}

export default Container;
