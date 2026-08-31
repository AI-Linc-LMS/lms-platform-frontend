"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  ActiveFilters,
  FilterPopover,
  J,
  JRadioGroup,
  JSelect,
  SearchInput,
  Toolbar,
  TYPE,
} from "@/components/jobs-v2/ui";
import { JOB_STATUS, JOB_STATUS_ORDER, VISIBILITY, VISIBILITY_ORDER } from "@/lib/jobs-v2/status";

/** The admin jobs list's sort keys. All of them are applied client-side (see `JobsSortKey`). */
export type JobsSortKey =
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "applicants_desc"
  | "closes_asc";

export interface JobsFilterState {
  /** The debounced, submitted search term (title / company / location). */
  search: string;
  /** A `JobStatus` value, or "" for all. Sent to the API as `status`, exactly as before. */
  status: string;
  /** A `Visibility` value, or "" for all. Client-side: the list endpoint has no such param. */
  visibility: string;
  /** Client-side: only jobs whose deadline falls inside the next seven days. */
  closingSoon: boolean;
  sort: JobsSortKey;
}

export const JOBS_FILTER_DEFAULTS: JobsFilterState = {
  search: "",
  status: "",
  visibility: "",
  closingSoon: false,
  sort: "created_desc",
};

export function isJobsFiltered(state: JobsFilterState): boolean {
  return Boolean(
    state.search || state.status || state.visibility || state.closingSoon,
  );
}

export interface JobsToolbarProps {
  /** The raw input text. Owned by the page so the box never lags its own keystroke. */
  searchInput: string;
  onSearchInput: (value: string) => void;
  /** Fires debounced, and immediately on Enter / the magnifier. */
  onSearchSubmit: (value: string) => void;
  state: JobsFilterState;
  onChange: (patch: Partial<JobsFilterState>) => void;
  onClearFilters: () => void;
  busy?: boolean;
}

/**
 * The jobs list toolbar: search, Status, Visibility, sort — plus the mandatory `ActiveFilters`
 * row beneath it.
 *
 * This is where the jobs list gains search and sort, so all three admin lists finally have the
 * same three features. The lone `justifyContent: flex-end` row that held one "Reports" button
 * (separated from its two siblings up in the header) is deleted; all three destinations live in
 * the page header now.
 */
export function JobsToolbar({
  searchInput,
  onSearchInput,
  onSearchSubmit,
  state,
  onChange,
  onClearFilters,
  busy,
}: JobsToolbarProps) {
  const { t } = useTranslation("common");

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("jobsV2.admin.filters.anyStatus", "Any status") as string },
      ...JOB_STATUS_ORDER.map((value) => ({
        value,
        label: t(JOB_STATUS[value].labelKey) as string,
      })),
    ],
    [t],
  );

  const visibilityOptions = useMemo(
    () => [
      { value: "", label: t("jobsV2.admin.filters.anyVisibility", "Any visibility") as string },
      ...VISIBILITY_ORDER.map((value) => ({
        value,
        label: t(VISIBILITY[value].labelKey) as string,
      })),
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "created_desc", label: t("jobsV2.admin.sort.newest", "Newest first") as string },
      { value: "created_asc", label: t("jobsV2.admin.sort.oldest", "Oldest first") as string },
      { value: "title_asc", label: t("jobsV2.admin.sort.title", "Job title A-Z") as string },
      {
        value: "applicants_desc",
        label: t("jobsV2.admin.sort.applicants", "Most applicants") as string,
      },
      { value: "closes_asc", label: t("jobsV2.admin.sort.closes", "Closing soonest") as string },
    ],
    [t],
  );

  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (state.search) {
      list.push({
        key: "search",
        label: t("jobsV2.admin.filters.searchChip", 'Search: "{{q}}"', {
          q: state.search,
        }) as string,
        onRemove: () => {
          onSearchInput("");
          onSearchSubmit("");
        },
      });
    }
    if (state.status) {
      list.push({
        key: "status",
        label: `${t("jobsV2.admin.filters.status", "Status") as string}: ${
          statusOptions.find((o) => o.value === state.status)?.label ?? state.status
        }`,
        onRemove: () => onChange({ status: "" }),
      });
    }
    if (state.visibility) {
      list.push({
        key: "visibility",
        label: `${t("jobsV2.admin.filters.visibility", "Visibility") as string}: ${
          visibilityOptions.find((o) => o.value === state.visibility)?.label ?? state.visibility
        }`,
        onRemove: () => onChange({ visibility: "" }),
      });
    }
    if (state.closingSoon) {
      list.push({
        key: "closingSoon",
        label: t("jobsV2.admin.filters.closingSoon", "Closing this week") as string,
        onRemove: () => onChange({ closingSoon: false }),
      });
    }
    return list;
  }, [onChange, onSearchInput, onSearchSubmit, state, statusOptions, t, visibilityOptions]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Toolbar
        data-tour-id="jobs-v2-filter"
        start={
          <>
            <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 260 }, maxWidth: 520 }}>
              <SearchInput
                value={searchInput}
                onChange={onSearchInput}
                onSubmit={onSearchSubmit}
                loading={busy}
                ariaLabel={
                  t("jobsV2.admin.searchLabel", "Search jobs by title, company or location") as string
                }
                placeholder={
                  t("jobsV2.admin.searchPlaceholder", "Search title, company, location") as string
                }
              />
            </Box>
            <FilterPopover
              label={t("jobsV2.admin.filters.status", "Status") as string}
              icon="mdi:label-outline"
              active={Boolean(state.status)}
              onClear={state.status ? () => onChange({ status: "" }) : undefined}
            >
              {(close) => (
                <JRadioGroup
                  label={t("jobsV2.admin.filters.status", "Status") as string}
                  value={state.status}
                  onChange={(value) => {
                    onChange({ status: value });
                    close();
                  }}
                  options={statusOptions}
                />
              )}
            </FilterPopover>
            <FilterPopover
              label={t("jobsV2.admin.filters.visibility", "Visibility") as string}
              icon="mdi:eye-outline"
              active={Boolean(state.visibility)}
              onClear={state.visibility ? () => onChange({ visibility: "" }) : undefined}
            >
              {(close) => (
                <JRadioGroup
                  label={t("jobsV2.admin.filters.visibility", "Visibility") as string}
                  value={state.visibility}
                  onChange={(value) => {
                    onChange({ visibility: value });
                    close();
                  }}
                  options={visibilityOptions}
                />
              )}
            </FilterPopover>
          </>
        }
        end={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box component="span" sx={{ ...TYPE.small, whiteSpace: "nowrap", color: J.ink3 }}>
              {t("jobsV2.admin.sortLabel", "Sort")}
            </Box>
            <JSelect
              value={state.sort}
              onChange={(value) => onChange({ sort: value as JobsSortKey })}
              options={sortOptions}
              aria-label={t("jobsV2.admin.sortLabel", "Sort") as string}
              fullWidth={false}
              sx={{ minWidth: 190 }}
            />
          </Box>
        }
      />
      <ActiveFilters chips={chips} onClearAll={onClearFilters} />
    </Box>
  );
}
