import Jobs from "./features/jobs/pages/Jobs";
import Learn from "./features/learn/pages/Learn";
import Live from "./features/live/pages/Live";
// Might have potential bug
import CourseDetailPage from "./features/learn/pages/EnrolledCourseDetailPage";
import CourseTopicDetailPage from "./features/learn/pages/CourseTopicDetailPage";

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  isPrivate: boolean;
  requiredPermissions?: string[];
}

const routes: RouteConfig[] = [
  {
    path: "/",
    component: Learn,
    isPrivate: true,
  },
  {
    path: "/live",
    component: Live,
    isPrivate: true,
  },
  {
    path: "/jobs",
    component: Jobs,
    isPrivate: true,
  },
  {
    path: "/courses/:courseName",
    component: CourseDetailPage,
    isPrivate: true,
  },
  {
    path: "/learn/course/:weekId/:topicId",
    component: CourseTopicDetailPage,
    isPrivate: true,
  },
];

export default routes;
