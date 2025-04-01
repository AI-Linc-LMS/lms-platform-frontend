export interface SidebarLinkInfo {
    id: number,
    title: string,
    links: LinkInfo[]
}
export interface LinkInfo {
    id: number;
    title: string;
    href: string;
    icon: React.ReactNode; 
  }
  

