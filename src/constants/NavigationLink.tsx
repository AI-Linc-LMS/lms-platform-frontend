import { SidebarLinkInfo } from "./typings";
import LiveIconController from "../commonComponents/icons/sidebarIcons/LiveIconController";
import JobsIconController from "../commonComponents/icons/sidebarIcons/JobsIconController";
import DashboardController from "../commonComponents/icons/sidebarIcons/DashboardController";
import CoursesIconController from "../commonComponents/icons/sidebarIcons/CoursesIconController";
import AssessmentsIconController from "../commonComponents/icons/sidebarIcons/AssessmentsIconController";
import CommunityIconController from "../commonComponents/icons/sidebarIcons/CommunityIconController";

export const NavigationLinks: SidebarLinkInfo[] = [
  {
    id: 1,
    title: "Dashboard",
    slug: "dashboard",
    links: [
      {
        id: 1,
        title: "Dashboard",
        href: "/",
        icon: <DashboardController />,
      },
    ],
  },
  {
    id: 4,
    title: "Courses",
    slug: "course",
    links: [
      {
        id: 1,
        title: "Courses",
        href: "/courses",
        icon: <CoursesIconController />,
      },
    ],
  },
  {
    id: 5,
    title: "Assessments",
    slug: "assessment",
    links: [
      {
        id: 1,
        title: "Assessments",
        href: "/assessments",
        icon: <AssessmentsIconController />,
      },
    ],
  },
  {
    id: 2,
    title: "Live",
    slug: "live_class",
    links: [
      {
        id: 1,
        title: "Live",
        href: "/live",
        icon: <LiveIconController />,
      },
    ],
  },
  {
    id: 3,
    title: "Jobs",
    slug: "job_portal",
    links: [
      {
        id: 1,
        title: "Jobs",
        href: "/jobs",
        icon: <JobsIconController />,
      },
    ],
  },
  {
    id: 6,
    title: "Community",
    slug: "community_forum",
    links: [
      {
        id: 1,
        title: "Community",
        href: "/community",
        icon: <CommunityIconController />,
      },
    ],
  },
];
