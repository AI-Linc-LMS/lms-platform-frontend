import { SidebarLinkInfo } from "./typings";
import LearnIconController from "../commonComponents/icons/sidebarIcons/LearnIconController";
import LiveIconController from "../commonComponents/icons/sidebarIcons/LiveIconController";
import JobsIconController from "../commonComponents/icons/sidebarIcons/JobsIconController";

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
];
