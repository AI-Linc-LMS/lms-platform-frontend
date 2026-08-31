"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  ActiveFilters,
  FilterBar,
  FilterPopover,
  JCard,
  JRadioGroup,
  SearchInput,
  SkillChip,
  J,
  TYPE,
  type ChoiceOption,
} from "@/components/jobs-v2/ui";
import {
  EXPERIENCE_VALUES,
  POSTED_VALUES,
  SALARY_VALUES,
  type UseJobFiltersResult,
} from "./useJobFilters";

/**
 * The search and filter rail.
 *
 * **One row of popover buttons, identical at every breakpoint.** This is what replaced the
 * 280px "Refine results" sidebar, the separate `MobileJobFilters` block, the search bar's own
 * duplicate location and experience controls, and the desktop/mobile parity gap between them.
 * Location and Experience now exist exactly once, so the
 * `experienceInput.trim() || filters.experience` resolution — two controls writing to two
 * states that had to be reconciled at read time — is gone with them.
 *
 * The rail unmounts entirely on the Applied and Saved panes, because a full search bar and seven
 * filters visible and interactive while controlling nothing is worse than no controls at all.
 * The `ActiveFilters` row is rendered by `JobBoard` on Saved so a filter carried in from Browse
 * is still visible and still removable — it is never applied invisibly.
 */
export interface BoardFiltersProps {
  filters: UseJobFiltersResult;
}

export function BoardFilters({ filters }: BoardFiltersProps) {
  const { t } = useTranslation("common");
  const { url, locationOptions, jobTypeOptions, employmentOptions, skillFacets, skillOverflow } =
    filters;
  const { state, set } = url;

  const anyLabel = t("jobsV2.board.filter.any", { defaultValue: "Any" }) as string;

  const withAny = (options: Array<{ value: string; label: string }>): ChoiceOption[] => [
    { value: "", label: anyLabel },
    ...options,
  ];

  const experienceOptions = useMemo<ChoiceOption[]>(
    () =>
      withAny(
        EXPERIENCE_VALUES.map((value) => ({
          value,
          label: t("jobsV2.meta.yearsRange", {
            range: value,
            defaultValue: `${value} years`,
          }) as string,
        })),
      ),
    // `withAny` is a stable local closure over `anyLabel`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, anyLabel],
  );

  const postedOptions = useMemo<ChoiceOption[]>(
    () =>
      withAny(
        POSTED_VALUES.map((value) => ({
          value,
          label: t(`jobsV2.board.posted.${value}`, {
            defaultValue:
              value === "1d" ? "Last 24 hours" : value === "7d" ? "Last 7 days" : "Last 30 days",
          }) as string,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, anyLabel],
  );

  const salaryOptions = useMemo<ChoiceOption[]>(
    () =>
      withAny(
        SALARY_VALUES.map((value) => ({
          value,
          label: t(`jobsV2.board.salary.${value}`, {
            defaultValue: value === "disclosed" ? "Salary disclosed" : "Salary not disclosed",
          }) as string,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, anyLabel],
  );

  const selectedSkills = new Set(state.skills.map((s) => s.toLowerCase()));

  /**
   * ONE search semantic. The URL holds the SUBMITTED query; `draft` holds what is being typed.
   * `SearchInput` owns the single 300ms debounce and fires `onSubmit` once, so there is no
   * second client-side filter running on every keystroke — the board no longer changes its
   * results before you finish searching and again after. It also means the back button steps
   * through searches rather than through individual characters.
   */
  const [draft, setDraft] = useState(state.q);
  const committedRef = useRef(state.q);
  useEffect(() => {
    // The URL moved without us (back button, a pasted link): adopt it.
    if (state.q !== committedRef.current) {
      committedRef.current = state.q;
      setDraft(state.q);
    }
  }, [state.q]);

  return (
    <JCard padded={false} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 1.5 }}>
        <SearchInput
          data-tour-id="jobs-search"
          value={draft}
          onChange={setDraft}
          onSubmit={(value) => {
            committedRef.current = value;
            set({ q: value });
          }}
          loading={filters.refetching}
          maxWidth={720}
          ariaLabel={
            t("jobsV2.board.searchLabel", {
              defaultValue: "Search jobs by title, company or skill",
            }) as string
          }
          placeholder={
            t("jobsV2.search.placeholder", {
              defaultValue: "Search jobs, companies, skills",
            }) as string
          }
        />
      </Box>

      <FilterBar data-tour-id="jobs-filters">
        <FilterPopover
          label={t("jobsV2.board.filter.location", { defaultValue: "Location" }) as string}
          icon="mdi:map-marker-outline"
          active={Boolean(state.loc)}
          onClear={state.loc ? () => set({ loc: "" }) : undefined}
        >
          <JRadioGroup
            value={state.loc}
            onChange={(value) => set({ loc: value })}
            options={withAny(locationOptions)}
            label={t("jobsV2.board.filter.location", { defaultValue: "Location" }) as string}
          />
        </FilterPopover>

        <FilterPopover
          label={t("jobsV2.board.filter.jobType", { defaultValue: "Job type" }) as string}
          icon="mdi:briefcase-outline"
          active={Boolean(state.type)}
          onClear={state.type ? () => set({ type: "" }) : undefined}
        >
          <JRadioGroup
            value={state.type}
            onChange={(value) => set({ type: value })}
            options={withAny(jobTypeOptions)}
            label={t("jobsV2.board.filter.jobType", { defaultValue: "Job type" }) as string}
          />
        </FilterPopover>

        <FilterPopover
          label={
            t("jobsV2.board.filter.employmentType", { defaultValue: "Employment type" }) as string
          }
          icon="mdi:account-clock-outline"
          active={Boolean(state.emp)}
          onClear={state.emp ? () => set({ emp: "" }) : undefined}
        >
          <JRadioGroup
            value={state.emp}
            onChange={(value) => set({ emp: value })}
            options={withAny(employmentOptions)}
            label={
              t("jobsV2.board.filter.employmentType", {
                defaultValue: "Employment type",
              }) as string
            }
          />
        </FilterPopover>

        <FilterPopover
          label={t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string}
          icon="mdi:chart-timeline-variant"
          active={Boolean(state.exp)}
          onClear={state.exp ? () => set({ exp: "" }) : undefined}
        >
          <JRadioGroup
            value={state.exp}
            onChange={(value) => set({ exp: value })}
            options={experienceOptions}
            label={t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string}
          />
        </FilterPopover>

        <FilterPopover
          label={t("jobsV2.board.filter.skills", { defaultValue: "Skills" }) as string}
          icon="mdi:tag-multiple-outline"
          badge={state.skills.length}
          onClear={state.skills.length ? () => set({ skills: [] }) : undefined}
        >
          <Box>
            <Typography sx={{ ...TYPE.label, mb: 1 }}>
              {t("jobsV2.board.filter.skills", { defaultValue: "Skills" })}
            </Typography>
            {skillFacets.length === 0 ? (
              <Typography sx={TYPE.small}>
                {t("jobsV2.board.noSkills", {
                  defaultValue: "No skills are listed on the current results.",
                })}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  maxHeight: 240,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  pr: 0.5,
                }}
              >
                {skillFacets.map((facet) => {
                  const selected = selectedSkills.has(facet.token);
                  return (
                    <SkillChip
                      key={facet.token}
                      selected={selected}
                      count={facet.count}
                      onToggle={() =>
                        set({
                          skills: selected
                            ? state.skills.filter((s) => s.toLowerCase() !== facet.token)
                            : [...state.skills, facet.label],
                        })
                      }
                    >
                      {facet.label}
                    </SkillChip>
                  );
                })}
              </Box>
            )}
            {skillOverflow > 0 && (
              <Typography sx={{ ...TYPE.micro, mt: 1, color: J.ink4 }}>
                {t("jobsV2.board.skillOverflow", {
                  count: skillOverflow,
                  defaultValue:
                    "Showing the most common skills. {{count}} more appear as you narrow the search.",
                })}
              </Typography>
            )}
          </Box>
        </FilterPopover>

        <FilterPopover
          label={t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string}
          icon="mdi:clock-outline"
          active={Boolean(state.posted)}
          onClear={state.posted ? () => set({ posted: "" }) : undefined}
        >
          <JRadioGroup
            value={state.posted}
            onChange={(value) => set({ posted: value })}
            options={postedOptions}
            label={t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string}
          />
        </FilterPopover>

        <FilterPopover
          label={t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string}
          icon="mdi:cash-multiple"
          active={Boolean(state.salary)}
          onClear={state.salary ? () => set({ salary: "" }) : undefined}
        >
          <JRadioGroup
            value={state.salary}
            onChange={(value) => set({ salary: value })}
            options={salaryOptions}
            label={t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string}
            helper={
              t("jobsV2.board.salaryHelper", {
                defaultValue:
                  "Employers write salary as free text, so we can only tell you whether a figure was disclosed.",
              }) as string
            }
          />
        </FilterPopover>
      </FilterBar>

      {filters.activeChips.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <ActiveFilters chips={filters.activeChips} onClearAll={filters.clearFilters} />
        </Box>
      )}
    </JCard>
  );
}
