import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useMemo } from "react";
import { filterNavigationByAdminFeatures } from "../sidebar/components/helper/filterNavigation";
import { AdminNavigationLinks } from "../../constants/AdminNavigationLinks";
import {
  LayoutGrid,
  Users,
  BookOpen,
  CalendarIcon,
  ClipboardList,
} from "lucide-react"; // import required icons

const iconMap: Record<string, React.ReactNode> = {
  admin_dashboard: <LayoutGrid size={24} strokeWidth={1.5} />,
  admin_manage_students: <Users size={24} strokeWidth={1.5} />,
  admin_course_builder: <BookOpen size={24} strokeWidth={1.5} />,
  admin_attendance: <CalendarIcon size={24} strokeWidth={1.5} />,
  admin_workshop_registrations: <ClipboardList size={24} strokeWidth={1.5} />,
  admin_assessment_result: <ClipboardList size={24} strokeWidth={1.5} />,
};

const AdminMobileNavBar = () => {
  const location = useLocation();
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  const filteredNavigationLinks = useMemo(() => {
    return filterNavigationByAdminFeatures(clientInfo?.data?.features || []);
  }, [clientInfo?.data?.features]);

  const mobileNavItems = useMemo(() => {
    const allowedSlugs = new Set(
      filteredNavigationLinks.map((link) => link.slug)
    );

    return AdminNavigationLinks.filter((link) => allowedSlugs.has(link.slug))
      .flatMap((link) =>
        link.links.map((child) => ({
          slug: link.slug,
          title: child.title,
          href: child.href,
        }))
      )
      .slice(0, 5);
  }, [filteredNavigationLinks]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  if (!mobileNavItems.length) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#E9F4FB] shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        {mobileNavItems.map((item) => (
          <>
            <NavItem
              key={item.href}
              to={item.href}
              label={item.title}
              icon={iconMap[item.slug as keyof typeof iconMap]}
              isActive={isActive(item.href)}
            />
          </>
        ))}
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors duration-200 ${
        isActive
          ? "text-[#0E1F2F] bg-white/70"
          : "text-gray-600 hover:text-[#0E1F2F]"
      }`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[8px] font-medium">{label}</span>
    </Link>
  );
};

export default AdminMobileNavBar;
