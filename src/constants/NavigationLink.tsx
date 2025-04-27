import { SidebarLinkInfo } from "./typings";
import LearnIconController from "../commonComponents/icons/sidebarIcons/LearnIconController";
import LiveIconController from "../commonComponents/icons/sidebarIcons/LiveIconController";
import JobsIconController from "../commonComponents/icons/sidebarIcons/JobsIconController";
import CourseBuilderIconController from "../commonComponents/icons/sidebarIcons/CourseBuilderIconController";

export const NavigationLinks: SidebarLinkInfo[] = [
  {
    id: 1,
    title: "Learn",
    links: [
      {
        id: 1,
        title: "Learn",
        href: "/",
        icon: <LearnIconController />,
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
    id: 4,
    title: "Course Builder",
    links: [
      {
        id: 1,
        title: "Course Builder",
        href: "/course-builder",
        icon: <CourseBuilderIconController />,
      },
    ],
  },
];
