import type { ContentMappingResponse, ContentMappingItem } from "@/lib/services/admin/admin-scorecard.service";

export type AdminContentType = keyof ContentMappingResponse;

export type ContentTreeNode =
  | { kind: "assessments"; items: { type: AdminContentType; id: number; item: ContentMappingItem }[] }
  | {
      kind: "course";
      courseName: string;
      modules: {
        moduleTitle: string;
        submodules: {
          submoduleTitle: string;
          items: { type: AdminContentType; id: number; item: ContentMappingItem }[];
        }[];
      }[];
    };

/** Tree: Assessments (flat) + Course → Module → Submodule → Content items */
export function buildAdminScorecardContentTree(
  contentMapping: ContentMappingResponse | null,
  searchQuery: string
): ContentTreeNode[] {
  if (!contentMapping) return [];
  const q = searchQuery.toLowerCase().trim();
  const result: ContentTreeNode[] = [];

  const assessments = (contentMapping.assessments ?? []).filter((item) => !q || item.title.toLowerCase().includes(q));
  if (assessments.length > 0) {
    result.push({
      kind: "assessments",
      items: assessments.map((item) => ({ type: "assessments" as const, id: item.id, item })),
    });
  }

  const courseMap = new Map<
    string,
    { modules: Map<string, { submodules: Map<string, { type: AdminContentType; id: number; item: ContentMappingItem }[]> }> }
  >();
  const seen = new Set<string>();

  const add = (type: AdminContentType, item: ContentMappingItem) => {
    if (type === "assessments") return;
    const key = `${type}-${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (q && !item.title.toLowerCase().includes(q)) return;
    const locs = item.locations?.length ? item.locations : [{ course_name: "Other", module_title: "—", submodule_title: "—" }];
    const loc = locs[0];
    const courseName = loc.course_name || "Other";
    const moduleTitle = loc.module_title || "—";
    const submoduleTitle = loc.submodule_title || "—";

    if (!courseMap.has(courseName)) courseMap.set(courseName, { modules: new Map() });
    const course = courseMap.get(courseName)!;
    if (!course.modules.has(moduleTitle)) course.modules.set(moduleTitle, { submodules: new Map() });
    const mod = course.modules.get(moduleTitle)!;
    if (!mod.submodules.has(submoduleTitle)) mod.submodules.set(submoduleTitle, []);
    mod.submodules.get(submoduleTitle)!.push({ type, id: item.id, item });
  };

  (Object.entries(contentMapping) as [AdminContentType, ContentMappingItem[]][]).forEach(([type, items]) => {
    if (type === "assessments") return;
    for (const item of items ?? []) add(type, item);
  });

  type Mod = {
    moduleTitle: string;
    submodules: { submoduleTitle: string; items: { type: AdminContentType; id: number; item: ContentMappingItem }[] }[];
  };

  for (const [courseName, course] of Array.from(courseMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const modules: Mod[] = [];
    for (const [moduleTitle, mod] of Array.from(course.modules.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      const submodules: { submoduleTitle: string; items: { type: AdminContentType; id: number; item: ContentMappingItem }[] }[] = [];
      for (const [submoduleTitle, items] of Array.from(mod.submodules.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        if (items.length > 0) submodules.push({ submoduleTitle, items });
      }
      if (submodules.length > 0) modules.push({ moduleTitle, submodules });
    }
    if (modules.length > 0) result.push({ kind: "course", courseName, modules });
  }

  return result;
}
