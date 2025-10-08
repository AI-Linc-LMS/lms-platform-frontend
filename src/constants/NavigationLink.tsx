import { SidebarLinkInfo } from "./typings";
import LiveIconController from "../commonComponents/icons/sidebarIcons/LiveIconController";
import JobsIconController from "../commonComponents/icons/sidebarIcons/JobsIconController";
import DashboardController from "../commonComponents/icons/sidebarIcons/DashboardController";
import CoursesIconController from "../commonComponents/icons/sidebarIcons/CoursesIconController";
import AssessmentsIconController from "../commonComponents/icons/sidebarIcons/AssessmentsIconController";
import CommunityIconController from "../commonComponents/icons/sidebarIcons/CommunityIconController";

export const getNavigationLinks = (t: (key: string) => string): SidebarLinkInfo[] => [
  {
    id: 1,
    title: t("navigation.dashboard"),
    links: [
      {
        id: 1,
        title: t("navigation.dashboard"),
        href: "/",
        icon: <DashboardController />,
      },
    ],
  },
  {
    id: 4,
    title: t("navigation.courses"),
    links: [
      {
        id: 1,
        title: t("navigation.courses"),
        href: "/courses",
        icon: <CoursesIconController />,
      },
    ],
  },
  {
    id: 5,
    title: t("navigation.assessments"),
    links: [
      {
        id: 1,
        title: t("navigation.assessments"),
        href: "/assessments",
        icon: <AssessmentsIconController />,
      },
    ],
  },
  {
    id: 2,
    title: t("navigation.live"),
    links: [
      {
        id: 1,
        title: t("navigation.live"),
        href: "/live",
        icon: <LiveIconController />,
      },
    ],
  },
  {
    id: 3,
    title: t("navigation.jobs"),
    links: [
      {
        id: 1,
        title: t("navigation.jobs"),
        href: "/jobs",
        icon: <JobsIconController />,
      },
    ],
  },
  {
    id: 6,
    title: t("navigation.community"),
    links: [
      {
        id: 1,
        title: t("navigation.community"),
        href: "/community",
        icon: <CommunityIconController />,
      },
    ],
  },
];

// Fallback static links for backward compatibility
export const NavigationLinks: SidebarLinkInfo[] = [
  {
    id: 1,
    title: "Dashboard",
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
