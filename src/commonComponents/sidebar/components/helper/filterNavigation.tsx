import { AdminNavigationLinks } from "../../../../constants/AdminNavigationLinks";
import { NavigationLinks } from "../../../../constants/NavigationLink";
import { SidebarLinkInfo } from "../../../../constants/typings";

export interface ClientFeature {
  id: number;
  name: string;
}

export const filterNavigationByFeatures = (
  features: ClientFeature[] = [],
  navigationLinks: SidebarLinkInfo[] = NavigationLinks
): SidebarLinkInfo[] => {
  // Always include dashboard
  const enabledFeatures = new Set(["dashboard"]);

  // Add enabled features to the set
  features.forEach((feature) => {
    enabledFeatures.add(feature.name.toLowerCase());
  });

  return navigationLinks.filter((link) => {
    const linkSlugLower = link.slug.toLowerCase();

    // Include if slug matches enabled features or is dashboard
    return (
      enabledFeatures.has(linkSlugLower) ||
      linkSlugLower === "dashboard" ||
      linkSlugLower === "admin_dashboard"
    );
  });
};

export const filterNavigationByAdminFeatures = (
  features: ClientFeature[] = []
): SidebarLinkInfo[] => {
  // Always include dashboard
  const enabledFeatures = new Set(["admin_dashboard"]);

  // Add enabled features to the set
  features.forEach((feature) =>
    enabledFeatures.add(feature.name.toLowerCase())
  );

  return AdminNavigationLinks.filter((link) => {
    const linkSlugLower = link.slug.toLowerCase();

    // Include if slug matches enabled features or is dashboard
    return (
      enabledFeatures.has(linkSlugLower) || linkSlugLower === "admin_dashboard"
    );
  });
};
