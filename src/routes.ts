import Jobs from "./features/jobs/pages/Jobs";
import Learn from "./features/learn/pages/Learn";
import Live from "./features/live/pages/Live";
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
    path: '/live',
    component: Live,
    isPrivate:true,
  },
  {
    path:'/jobs',
    component: Jobs,
    isPrivate: true,
  }
];

export default routes;
