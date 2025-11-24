import Sidebar from "../commonComponents/sidebar/Sidebar";
import AdminSidebar from "../commonComponents/sidebar/AdminSidebar";
import TopNav from "../constants/TopNav";
import MobileNavBar from "../commonComponents/mobileNavigation/MobileNavBar";
import AdminMobileNavBar from "../commonComponents/mobileNavigation/AdminMobileNavBar";
import StreakCongratulationsModal from "../components/StreakCongratulationsModal";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStreakCongratulations } from "../hooks/useStreakCongratulations";
import { useStreakData } from "../features/learn/hooks/useStreakData";

function Container({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Default expanded
  const [showSidebar, setShowSidebar] = useState(true); // Control sidebar visibility
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Memoize localStorage parsing to avoid re-parsing on every render
  const { clientId, userId } = useMemo(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return { clientId: null, userId: null };
      const parsedUser = JSON.parse(user);
      const rawClientId = parsedUser?.client_id ?? null;
      const parsedClientId =
        typeof rawClientId === "number"
          ? rawClientId
          : rawClientId
          ? Number(rawClientId)
          : null;
      return {
        clientId: parsedClientId,
        userId: parsedUser?.id ?? null,
      };
    } catch {
      return { clientId: null, userId: null };
    }
  }, [location.pathname]); // Only re-parse if route changes (user might change on login)

  // Query streak data
  const { data: streakData } = useStreakData(clientId, {
    enabled: !!clientId,
  });

  // Use the streak congratulations hook
  const { showCongratulations, handleClose, latestCompletionDate } =
    useStreakCongratulations({
      streakData,
      userId,
    });

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
        completionDate={latestCompletionDate}
      />
    </div>
  );
}

export default Container;
