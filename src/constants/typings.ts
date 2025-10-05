export interface SidebarLinkInfo {
  id: number;
  title: string;
  links: LinkInfo[];
  slug: string;
}
export interface LinkInfo {
  id: number;
  title: string;
  href: string;
  icon: React.ReactNode;
}
