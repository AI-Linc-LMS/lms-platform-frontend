import { SidebarLinkInfo } from "./typings";
import DashboardIconController from "../commonComponents/icons/adminIcons/DashboardIconController";
import CourseBuilderIconController from "../commonComponents/icons/adminIcons/CourseBuilderIconController";
import UsersIconController from "../commonComponents/icons/adminIcons/UsersIconController";
import AnalyticsIconController from "../commonComponents/icons/adminIcons/AnalyticsIconController";
import SettingsIconController from "../commonComponents/icons/adminIcons/SettingsIconController";

export const AdminNavigationLinks: SidebarLinkInfo[] = [
  {
    id: 1,
    title: "Dashboard",
    links: [
      {
        id: 1,
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: <DashboardIconController />,
      },
    ],
  },
  {
    id: 2,
    title: "Course Builder",
    links: [
      {
        id: 1,
        title: "Course Builder",
        href: "/admin/course-builder",
        icon: <CourseBuilderIconController />,
      },
    ],
  },
  {
    id: 3,
    title: "Users",
    links: [
      {
        id: 1,
        title: "User Management",
        href: "/admin/users",
        icon: <UsersIconController />,
      },
    ],
  },
  {
    id: 4,
    title: "Analytics",
    links: [
      {
        id: 1,
        title: "Analytics",
        href: "/admin/analytics",
        icon: <AnalyticsIconController />,
      },
    ],
  },
  {
    id: 5,
    title: "Settings",
    links: [
      {
        id: 1,
        title: "Settings",
        href: "/admin/settings",
        icon: <SettingsIconController />,
      },
    ],
  },
]; 