export interface SidebarLinkInfo {
  id: number;
  title: string;
  /**
   * Machine-friendly identifier used for feature gating and filtering
   * e.g., "dashboard", "courses", "jobs", "admin_dashboard"
   */
  slug: string;
  links: LinkInfo[];
}
export interface LinkInfo {
  id: number;
  title: string;
  href: string;
  icon: React.ReactNode;
}
