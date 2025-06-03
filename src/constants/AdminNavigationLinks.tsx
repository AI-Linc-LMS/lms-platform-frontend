import { SidebarLinkInfo } from "./typings";
import AdminDashboardController from "../commonComponents/icons/sidebarIcons/AdminDashboardController";
import CourseBuilderController from "../commonComponents/icons/sidebarIcons/CourseBuilderController";
import ManageStudentsController from "../commonComponents/icons/sidebarIcons/ManagestudentsController";
export const AdminNavigationLinks: SidebarLinkInfo[] = [
  {
    id: 1,
    title: "Dashboard",
    links: [
      {
        id: 1,
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: <AdminDashboardController />,
      },
    ],
  },
  {
    id: 2,
    title: "Manage Students",
    links: [
      {
        id: 2,
        title: "Manage Students",
        href: "/admin/manage-students",
        icon: <ManageStudentsController />,
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
        href: "/admin/courses",
        icon: <CourseBuilderController />,
      },
    ],
  },
]; 