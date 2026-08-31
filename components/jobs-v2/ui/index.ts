/**
 * The jobs-v2 kit.
 *
 * **Both student and admin screens import from here and nowhere else.** No screen may define a
 * local `SectionCard`, `InfoPill`, `formatDate`, status map, modal shell, empty state or
 * skeleton again — that duplication (four `SectionCard`s, four `formatDate`s, three status
 * maps, three bulk bars) is what this redesign exists to end, and the ESLint rule in
 * `eslint.config.mjs` enforces the colour half of it.
 */

/* ---- tokens ----------------------------------------------------------- */
export {
  J,
  R,
  SHADOW,
  MOTION,
  CTL_H,
  TYPE,
  focusRing,
  focusRingOnDark,
  cardInteraction,
  rtlLabel,
  srOnly,
  microRuleBullet,
  gradientText,
  gradientTextOnDark,
  lineClamp,
  tint,
  relevanceColor,
  RELEVANCE,
  JOB_STATUS,
  APP_STATUS,
  VISIBILITY,
  SCRAPED_STATE,
  NEUTRAL_TONE,
  JOB_STATUS_ORDER,
  APP_STATUS_ORDER,
  VISIBILITY_ORDER,
  SCRAPED_STATE_ORDER,
} from "./jobsTokens";
export type {
  Tone,
  JobStatus,
  AppStatus,
  Visibility,
  ScrapedState,
} from "./jobsTokens";

/* ---- scope ------------------------------------------------------------ */
export { JobsScope, useJobsSurface } from "./JobsScope";
export type { JobsTheme, JobsSurface, JobsSurfaceContextValue } from "./JobsScope";

/* ---- primitives ------------------------------------------------------- */
export { JButton } from "./JButton";
export type { JButtonProps, JButtonVariant, JButtonSize, JButtonTone } from "./JButton";

export { StatusPill, MetaChip, SkillChip, CountPill } from "./Chips";
export type { StatusPillProps, MetaChipProps, SkillChipProps, CountPillProps } from "./Chips";

export {
  JCard,
  JPanel,
  HairlineStrip,
  MicroRuleList,
  DefinitionList,
  Notice,
  useActivationKeys,
} from "./Surfaces";
export type {
  JCardProps,
  StripItem,
  HairlineStripProps,
  DefinitionItem,
  DefinitionListProps,
  NoticeProps,
} from "./Surfaces";

export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

export {
  JField,
  JTextField,
  JTextArea,
  JSelect,
  StatusSelect,
  JRadioGroup,
  JCheckGroup,
  JDatePicker,
  JFileDrop,
  JSwitch,
  RequiredLegend,
  controlSx,
  focusFirstError,
} from "./Field";
export type {
  BaseFieldProps,
  JFieldProps,
  JTextFieldProps,
  JTextAreaProps,
  JSelectProps,
  JSelectOption,
  StatusSelectProps,
  ChoiceOption,
  JRadioGroupProps,
  JCheckGroupProps,
  JDatePickerProps,
  JFileDropProps,
  FileDropState,
  JSwitchProps,
} from "./Field";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export {
  SkeletonShell,
  HeroSkeleton,
  JobCardSkeleton,
  JobRowSkeleton,
  JobListSkeleton,
  JobDetailSkeleton,
  AppliedListSkeleton,
  HairlineStripSkeleton,
  DataTableSkeleton,
  ScrapedTableSkeleton,
  FormSkeleton,
  ApplyStepSkeleton,
  PipelineSkeleton,
} from "./Skeletons";

export { JDataTable } from "./JDataTable";
export type {
  JDataTableProps,
  Column,
  RowId,
  JDataTableSelection,
  JDataTableSort,
} from "./JDataTable";

export { JModal, JSheet, JConfirm } from "./JModal";
export type { JModalProps, JModalSize, JConfirmProps } from "./JModal";

export { JStepper } from "./JStepper";
export type { JStepperProps, Step } from "./JStepper";

export { JTabs, JTabPanel } from "./JTabs";
export type { JTabsProps, JTab } from "./JTabs";

export { SearchInput } from "./SearchInput";
export type { SearchInputProps } from "./SearchInput";

export { FilterBar, FilterPopover, ActiveFilters } from "./FilterBar";
export type { FilterPopoverProps, ActiveFilterChip } from "./FilterBar";

export { JPagination } from "./JPagination";
export type { JPaginationProps } from "./JPagination";

export { CompanyLogo, JAvatar } from "./CompanyLogo";
export type { CompanyLogoProps, JAvatarProps } from "./CompanyLogo";

export { MetaRow, sortMeta, META_ORDER } from "./MetaRow";
export type { MetaRowProps, MetaItem, MetaKey } from "./MetaRow";

export { Toolbar, BulkActionBar } from "./Toolbar";
export type {
  BulkAction,
  BulkActionBarProps,
  BulkOutcome,
  BulkId,
} from "./Toolbar";
