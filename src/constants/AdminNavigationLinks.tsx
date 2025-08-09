import { SidebarLinkInfo } from "./typings";
import AdminDashboardController from "../commonComponents/icons/sidebarIcons/AdminDashboardController";
import CourseBuilderController from "../commonComponents/icons/sidebarIcons/CourseBuilderController";
import ManageStudentsController from "../commonComponents/icons/sidebarIcons/ManagestudentsController";
import WorkshopRegistrationController from "../commonComponents/icons/sidebarIcons/WorkshopRegistrationController";
import AssesmentStudentResultsController from "../commonComponents/icons/sidebarIcons/AssesmentStudentsResultsController";
import ReferalsController from "../commonComponents/icons/sidebarIcons/ReferalsController";
import EmailIconController from "../commonComponents/icons/sidebarIcons/EmailIconController";
import LiveAdminIconController from "../commonComponents/icons/sidebarIcons/LiveAdminIconController";
import PaymentIconsController from "../commonComponents/icons/sidebarIcons/PaymentIconsController";
import WebinarManagementController from "../commonComponents/icons/sidebarIcons/WebinarManagementController";
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
    id: 5,
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
  {
    id: 6,
    title: "Referrals",
    links: [
      {
        id: 1,
        title: "Referrals",
        href: "/admin/referals",
        icon: <ReferalsController />,
      },
    ],
  },
  {
    id: 7,
    title: "Emails",
    links: [
      {
        id: 1,
        title: "Emails",
        href: "/admin/email-send",
        icon: <EmailIconController />,
      },
    ],
  },
  {
    id: 8,
    title: "Live",
    links: [
      {
        id: 1,
        title: "Live",
        href: "/admin/live",
        icon: <LiveAdminIconController />,
      },
    ],
  },
  {
    id: 9,
    title: "Payment Links",
    links: [
      {
        id: 1,
        title: "Payment Links",
        href: "/admin/payment-links",

        icon: <PaymentIconsController />,
      },
    ],
  },
  {
    id: 10,
    title: "Webinar Management",
    links: [
      {
        id: 1,
        title: "Webinar Management",
        href: "/admin/webinar-management",
        icon: <WebinarManagementController />,
      },
    ],
  },
];
