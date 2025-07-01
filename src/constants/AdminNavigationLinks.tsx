import { SidebarLinkInfo } from "./typings";
import AdminDashboardController from "../commonComponents/icons/sidebarIcons/AdminDashboardController";
import CourseBuilderController from "../commonComponents/icons/sidebarIcons/CourseBuilderController";
import ManageStudentsController from "../commonComponents/icons/sidebarIcons/ManagestudentsController";
import WorkshopRegistrationController from "../commonComponents/icons/sidebarIcons/WorkshopRegistrationController";
import AssesmentStudentResultsController from "../commonComponents/icons/sidebarIcons/AssesmentStudentsResultsController";
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
  {
    id: 3,
    title: "Workshop Registrations",
    links: [
      {
        id: 1,
        title: "Workshop Registrations",
        href: "/admin/workshop-registrations",
        icon: <WorkshopRegistrationController />,
      },
    ],
  },
  {
    id: 4,
    title: "Assesment Results",
    links: [
      {
        id: 1,
        title: "Assesment Results",
        href: "/admin/assesment-results",
        icon: <AssesmentStudentResultsController />,
      },
    ],
  },
]; 