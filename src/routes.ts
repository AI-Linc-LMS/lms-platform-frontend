import Learn from "./features/learn/pages/Learn";
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
];

export default routes;
