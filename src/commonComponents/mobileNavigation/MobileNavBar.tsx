import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookCopy,
  FileText,
  Briefcase,
  Video,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

const MobileNavBar = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/";
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl border-t border-gray-200">
      <div className="flex justify-around items-center pt-3 pb-2">
        <NavItem
          to="/courses"
          icon={<BookCopy size={22} strokeWidth={1.5} />}
          label={t("navigation.courses")}
          isActive={isActive("/courses")}
        />
        <NavItem
          to="/assessments"
          icon={<FileText size={22} strokeWidth={1.5} />}
          label={t("navigation.assessments")}
          isActive={isActive("/assessments")}
        />
        <NavItem
          to="/"
          icon={<LayoutDashboard size={22} strokeWidth={1.5} />}
          label={t("navigation.dashboard")}
          isActive={isActive("/")}
        />
        <NavItem
          to="/jobs"
          icon={<Briefcase size={22} strokeWidth={1.5} />}
          label={t("navigation.jobs")}
          isActive={isActive("/jobs")}
        />
        <NavItem
          to="/live"
          icon={<Video size={22} strokeWidth={1.5} />}
          label={t("navigation.live")}
          isActive={isActive("/live")}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => {
  const activeColor = "var(--primary-700)";
  const inactiveColor = "var(--primary-500)";

  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center w-1/5 py-1 transition-transform duration-300 ease-in-out"
    >
      <div
        className={`transform transition-transform duration-300 ${
          isActive ? "scale-110 -translate-y-1" : "scale-100"
        }`}
      >
        <div style={{ color: isActive ? activeColor : inactiveColor }}>
          {icon}
        </div>
      </div>
      <span
        className="text-xs mt-1 transition-colors duration-300"
        style={{ color: isActive ? activeColor : inactiveColor }}
      >
        {label}
      </span>
      <div
        className={`h-1 w-1 rounded-full bg-[${activeColor}] transition-opacity duration-300 mt-1 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
};

export default MobileNavBar;
