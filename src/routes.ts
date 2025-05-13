import Jobs from "./features/jobs/pages/Jobs";
import Learn from "./features/learn/pages/Learn";
import Live from "./features/live/pages/Live";
// Might have potential bug
import CourseDetailPage from "./features/learn/pages/EnrolledCourseDetailPage";
import CourseTopicDetailPage from "./features/learn/pages/CourseTopicDetailPage";
import Login from "./features/auth/pages/Login";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import Signup from "./features/auth/pages/Signup";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import AdminCourseDetailPage from "./features/admin/pages/CourseDetailPage";

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  isPrivate: boolean;
  requiredPermissions?: string[];
}

const routes: RouteConfig[] = [
  {
    path: "/login",
    component: Login,
    isPrivate: false,
  },
  {
    path: "/forgot-password",
    component: ForgotPassword,
    isPrivate: false,
  },
  {
    path: "/signup",
    component: Signup,
    isPrivate: false,
  },
  {
    path: "/",
    component: Learn,
    isPrivate: true,
  },
  {
    path: "/learn",
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
    path: "/community",
    component: Learn, // Using Learn as placeholder for Community page
    isPrivate: true,
  },
  {
    path: "/courses/:courseId",
    component: CourseDetailPage,
    isPrivate: true,
  },
  {
    path: "/learn/course/:courseId/:submoduleId",
    component: CourseTopicDetailPage,
    isPrivate: true,
  },
  {
    path: "/admin/courses",
    component: AdminDashboard,
    isPrivate: true,
  },
  {
    path: "/admin/courses/:courseId",
    component: AdminCourseDetailPage,
    isPrivate: true,
  },
];

export default routes;
