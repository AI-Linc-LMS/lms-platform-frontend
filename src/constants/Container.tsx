import Sidebar from "../commonComponents/sidebar/Sidebar";
import AdminSidebar from "../commonComponents/sidebar/AdminSidebar";
import TopNav from "../constants/TopNav";
import MobileNavBar from "../commonComponents/mobileNavigation/MobileNavBar";
import AdminMobileNavBar from "../commonComponents/mobileNavigation/AdminMobileNavBar";
import StreakCongratulationsModal from "../components/StreakCongratulationsModal";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStreakTableData } from "../services/dashboardApis";
import { useStreakCongratulations } from "../hooks/useStreakCongratulations";

function Container({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Default expanded
  const [showSidebar, setShowSidebar] = useState(true); // Control sidebar visibility
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Get client ID from localStorage
  const user = localStorage.getItem("user");
  const clientId = user ? JSON.parse(user).client_id : null;

  // Query streak data
  const { data: streakData } = useQuery({
    queryKey: ["streakTable", clientId],
    queryFn: () => getStreakTableData(clientId),
    enabled: !!clientId,
    refetchInterval: 10000, // Refetch every 10 seconds to catch streak updates
  });

  // Use the streak congratulations hook
  const { showCongratulations, handleClose } = useStreakCongratulations(
    streakData?.current_streak
  );

  useEffect(() => {
    // Hide sidebar and mobile nav on CourseTopicDetailPage
    const isCourseTopicPage = location.pathname.includes("/learn/course/");
    // Check if current route is an admin route
    const isAdmin = location.pathname.startsWith("/admin");

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
            <AdminSidebar
              isExpanded={isSidebarExpanded}
              toggleSidebar={toggleSidebar}
            />
          ) : (
            <Sidebar
              isExpanded={isSidebarExpanded}
              toggleSidebar={toggleSidebar}
            />
          )}
          {/* <div className="flex flex-col">
            <Navbar isSidebarExpanded={isSidebarExpanded} />
          </div> */}
        </nav>
      )}

      {/* Main Content Area */}
      <main
        className={`animate-children-fade-up ${
          showSidebar
            ? isSidebarExpanded
              ? "md:ml-[180px] lg:ml-[250px]"
              : "md:ml-[90px]"
            : "ml-0"
        } pb-20 md:pb-0 md:mt-10 relative transition-all pl-4 pr-4 md:pl-7 md:pr-4 h-full`}
      >
        {children}
      </main>

      {/* Mobile Navigation Bar */}
      {showMobileNav &&
        (isAdminRoute ? <AdminMobileNavBar /> : <MobileNavBar />)}

      {/* Streak Congratulations Modal */}
      <StreakCongratulationsModal
        isOpen={showCongratulations}
        onClose={handleClose}
        currentStreak={streakData?.current_streak || 0}
      />
    </div>
  );
}

export default Container;
