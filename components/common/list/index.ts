/**
 * Shared list-page toolkit — one search/filter/tabs/stats/view-toggle language
 * across every module list. The search + tabs + stat primitives already exist
 * (from the assessment-management redesign); this barrel re-exports them under
 * generic names so any module can adopt them without an assessment-specific
 * import path. `ViewToggle` is the one new piece.
 */
export { ViewToggle, type ListView } from "./ViewToggle";

export {
  AssessmentFilterBar as SearchFilterBar,
  type FilterSelectDef,
  type ActiveFilterChip,
} from "@/components/admin/assessment/shared/AssessmentFilterBar";

export {
  SegmentedTabs,
  type SegmentedTab,
  StatStrip,
  type StatItem,
} from "@/components/admin/assessment/shared";
