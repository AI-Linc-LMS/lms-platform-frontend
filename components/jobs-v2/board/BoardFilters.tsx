"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  ActiveFilters,
  FacetList,
  FilterBar,
  FilterPopover,
  FilterSheet,
  JButton,
  JCard,
  JRadioGroup,
  SearchInput,
  SegmentedToggle,
  SkillChip,
  J,
  TYPE,
  type ChoiceOption,
  type FacetOption as KitFacetOption,
  type FilterSheetGroup,
} from "@/components/jobs-v2/ui";
import type { ClientFilterInput, UseJobFiltersResult } from "./useJobFilters";

/**
 * The search and filter rail.
 *
 * **One row of pills, no sidebar at any breakpoint.** Three columns at 1280px would leave a
 * 300px facet rail, a 380px result rail and a 500px pane — worse than either two-column layout.
 * Naukri can afford a rail because it has no pane. We take Naukri's *counts*, which are the
 * load-bearing half, and leave the rail behind.
 *
 * Two things changed from the shipped bar, and both are load-bearing:
 *
 * 1. **Eligibility is promoted out of the popovers** into a `SegmentedToggle` that is always
 *    visible and always first, because it is the question this audience asks before any other.
 *    It is offered only when the payload actually answers it — a toggle that empties the board
 *    because a field is missing is a filter blaming the student for our own response shape.
 * 2. **Every client-side option carries a live, leave-one-out count** over the student's own
 *    visible set, and a zero-count option renders *disabled rather than hidden*, so the list
 *    does not shift under the cursor between openings.
 *
 * **Location, job type and employment type deliberately carry no counts.** Those three are
 * applied by the server and we do not hold the predicate it applies, so a locally computed count
 * would be a lower bound printed as a fact. They keep today's plain option lists. It is also why
 * they stay *outside* the mobile sheet: the sheet defers, and a deferred filter whose outcome we
 * cannot count is a footer button that lies. Everything inside the sheet is evaluated on the
 * client, so "Show 84 jobs" is the real number.
 */
export interface BoardFiltersProps {
  filters: UseJobFiltersResult;
}

/** The client facets: pills at `md+`, and the whole of the mobile sheet below it. */
const CLIENT_PILL_SX = { display: { xs: "none", md: "inline-flex" } } as const;

export function BoardFilters({ filters }: BoardFiltersProps) {
  const { t } = useTranslation("common");
  const {
    url,
    locationOptions,
    jobTypeOptions,
    employmentOptions,
    skillFacets,
    skillOverflow,
    facets,
    eligibleCount,
    canFilterByEligibility,
    eligibleOnly,
    setEligibleOnly,
    countFor,
  } = filters;
  const { state, set } = url;

  const anyLabel = t("jobsV2.board.filter.any", { defaultValue: "Any" }) as string;

  const withAny = useCallback(
    (options: Array<{ value: string; label: string }>): ChoiceOption[] => [
      { value: "", label: anyLabel },
      ...options,
    ],
    [anyLabel],
  );

  const selectedSkills = useMemo(
    () => new Set(state.skills.map((s) => s.toLowerCase())),
    [state.skills],
  );

  /**
   * ONE search semantic. The URL holds the SUBMITTED query; `draft` holds what is being typed.
   * `SearchInput` owns the single 300ms debounce and fires `onSubmit` once, so there is no
   * second client-side filter running on every keystroke — the board no longer changes its
   * results before you finish searching and again after. It also means the back button steps
   * through searches rather than through individual characters.
   */
  const [draft, setDraft] = useState(state.q);
  /**
   * The last value of `state.q` this component has SEEN — not the last one it submitted. The
   * difference matters: tracking what we submitted would make the box wipe itself in the frame
   * between a submit and the URL catching up with it.
   *
   * Adjusted during render rather than in an effect, because this is state derived from a prop
   * and an effect would paint the stale query once before correcting it.
   */
  const [seenQuery, setSeenQuery] = useState(state.q);
  if (state.q !== seenQuery) {
    // The URL moved without us — a back button, a pasted link — so the box adopts it.
    setSeenQuery(state.q);
    setDraft(state.q);
  }

  /* ---- the deferred mobile sheet --------------------------------------- */

  /**
   * Desktop filtering is instant: the result count is already on screen, so a toggle should just
   * work. Mobile is the opposite — the list is behind the sheet — so the sheet holds a **draft**
   * and applies on "Show N jobs". Instahyre's discipline, and the only one of the five boards
   * that gets mobile right.
   */
  type SheetDraft = Pick<
    ClientFilterInput,
    "role" | "wm" | "exp" | "skills" | "posted" | "close" | "salary"
  >;

  const applied = useMemo<SheetDraft>(
    () => ({
      role: state.role,
      wm: state.wm,
      exp: state.exp,
      skills: state.skills,
      posted: state.posted,
      close: state.close,
      salary: state.salary,
    }),
    [state.role, state.wm, state.exp, state.skills, state.posted, state.close, state.salary],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState<SheetDraft>(applied);
  // The sheet always opens on what is actually applied, never on a stale edit from last time.
  // Seeded by the opener rather than by an effect, so there is no frame in which the sheet is
  // open and showing the previous visit's draft.
  const openSheet = useCallback(() => {
    setSheetDraft(applied);
    setSheetOpen(true);
  }, [applied]);

  /**
   * An option's number inside the sheet is the size of the result set **that option would give
   * you on top of the rest of the draft** — not on top of what is currently applied. Counting
   * against the applied set would disable an option the draft has already unblocked.
   */
  const draftCount = useCallback(
    (patch: Partial<SheetDraft>) => countFor({ ...sheetDraft, ...patch }),
    [countFor, sheetDraft],
  );

  const recount = useCallback(
    (key: keyof SheetDraft, options: KitFacetOption[]): KitFacetOption[] =>
      options.map((option) => ({
        ...option,
        count: draftCount({ [key]: option.value } as Partial<SheetDraft>),
      })),
    [draftCount],
  );

  /** Single-select inside the sheet: choosing the selected value clears it. */
  const toggleDraft = useCallback(
    (key: Exclude<keyof SheetDraft, "skills">, value: string) =>
      setSheetDraft((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value })),
    [],
  );

  const toggleDraftSkill = useCallback(
    (label: string) =>
      setSheetDraft((prev) => ({
        ...prev,
        skills: prev.skills.some((s) => s.toLowerCase() === label.toLowerCase())
          ? prev.skills.filter((s) => s.toLowerCase() !== label.toLowerCase())
          : [...prev.skills, label],
      })),
    [],
  );

  const sheetGroups: FilterSheetGroup[] = [
    ...(facets.role.length
      ? [
          {
            key: "role",
            label: t("jobsV2.board.filter.role", { defaultValue: "Role" }) as string,
            node: (
              <FacetList
                options={recount("role", facets.role)}
                selected={sheetDraft.role ? [sheetDraft.role] : []}
                onToggle={(value) => toggleDraft("role", value)}
                multiple={false}
                initialVisible={6}
              />
            ),
          },
        ]
      : []),
    ...(facets.wm.length
      ? [
          {
            key: "wm",
            label: t("jobsV2.board.filter.workMode", { defaultValue: "Work mode" }) as string,
            node: (
              <FacetList
                options={recount("wm", facets.wm)}
                selected={sheetDraft.wm ? [sheetDraft.wm] : []}
                onToggle={(value) => toggleDraft("wm", value)}
                multiple={false}
                initialVisible={3}
              />
            ),
          },
        ]
      : []),
    {
      key: "exp",
      label: t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string,
      node: (
        <FacetList
          options={recount("exp", facets.exp)}
          selected={sheetDraft.exp ? [sheetDraft.exp] : []}
          onToggle={(value) => toggleDraft("exp", value)}
          multiple={false}
          initialVisible={5}
        />
      ),
    },
    {
      key: "skills",
      label: t("jobsV2.board.filter.skills", { defaultValue: "Skills" }) as string,
      node: (
        <FacetList
          options={facets.skills.map((option) => ({
            ...option,
            count: draftCount({ skills: [...sheetDraft.skills, option.value] }),
          }))}
          selected={sheetDraft.skills}
          onToggle={toggleDraftSkill}
          initialVisible={6}
          emptyLabel={
            t("jobsV2.board.noSkills", {
              defaultValue: "No skills are listed on the current results.",
            }) as string
          }
        />
      ),
    },
    {
      key: "posted",
      label: t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string,
      node: (
        <FacetList
          options={recount("posted", facets.posted)}
          selected={sheetDraft.posted ? [sheetDraft.posted] : []}
          onToggle={(value) => toggleDraft("posted", value)}
          multiple={false}
          initialVisible={3}
        />
      ),
    },
    {
      key: "close",
      label: t("jobsV2.board.filter.closing", { defaultValue: "Closing" }) as string,
      node: (
        <FacetList
          options={recount("close", facets.close)}
          selected={sheetDraft.close ? [sheetDraft.close] : []}
          onToggle={(value) => toggleDraft("close", value)}
          multiple={false}
          initialVisible={3}
        />
      ),
    },
    {
      key: "salary",
      label: t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string,
      node: (
        <FacetList
          options={recount("salary", facets.salary)}
          selected={sheetDraft.salary ? [sheetDraft.salary] : []}
          onToggle={(value) => toggleDraft("salary", value)}
          multiple={false}
          initialVisible={2}
        />
      ),
    },
  ];

  /** How many of the sheet's own facets are set — the "Filters (N)" badge. */
  const sheetActiveCount =
    (state.role ? 1 : 0) +
    (state.wm ? 1 : 0) +
    (state.exp ? 1 : 0) +
    (state.skills.length ? 1 : 0) +
    (state.posted ? 1 : 0) +
    (state.close ? 1 : 0) +
    (state.salary ? 1 : 0);

  return (
    <JCard padded={false} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 1.5 }}>
        <SearchInput
          data-tour-id="jobs-search"
          value={draft}
          onChange={setDraft}
          onSubmit={(value) => set({ q: value })}
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
        {/* 0 — always visible, always first, and only ever offered when the payload can
            actually answer it. */}
        {canFilterByEligibility && (
          <SegmentedToggle
            label={
              t("jobsV2.board.filter.eligibleOnly", {
                defaultValue: "Only jobs I'm eligible for",
              }) as string
            }
            icon="mdi:check-decagram-outline"
            checked={eligibleOnly}
            onChange={setEligibleOnly}
            count={eligibleCount}
          />
        )}

        {/* 1 — Role / function. Client-side, counted. */}
        {facets.role.length > 0 && (
          <FilterPopover
            label={t("jobsV2.board.filter.role", { defaultValue: "Role" }) as string}
            icon="mdi:shape-outline"
            active={Boolean(state.role)}
            onClear={state.role ? () => set({ role: "" }) : undefined}
            sx={CLIENT_PILL_SX}
          >
            <FacetList
              options={facets.role}
              selected={state.role ? [state.role] : []}
              onToggle={(value) => set({ role: state.role === value ? "" : value })}
              multiple={false}
              initialVisible={4}
              ariaLabel={t("jobsV2.board.filter.role", { defaultValue: "Role" }) as string}
            />
          </FilterPopover>
        )}

        {/* 2, 3 and 7 — the three SERVER-side facets. No counts, and instant at every
            breakpoint, because they are the only ones the mobile sheet cannot honestly defer. */}
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

        {/* 4 — Work mode. Offered only for modes the postings themselves state. */}
        {facets.wm.length > 0 && (
          <FilterPopover
            label={t("jobsV2.board.filter.workMode", { defaultValue: "Work mode" }) as string}
            icon="mdi:home-city-outline"
            active={Boolean(state.wm)}
            onClear={state.wm ? () => set({ wm: "" }) : undefined}
            sx={CLIENT_PILL_SX}
          >
            <FacetList
              options={facets.wm}
              selected={state.wm ? [state.wm] : []}
              onToggle={(value) => set({ wm: state.wm === value ? "" : value })}
              multiple={false}
              initialVisible={3}
              ariaLabel={
                t("jobsV2.board.filter.workMode", { defaultValue: "Work mode" }) as string
              }
            />
          </FilterPopover>
        )}

        {/* 5 — Experience. The fact that decides whether a fresher clicks. */}
        <FilterPopover
          label={t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string}
          icon="mdi:chart-timeline-variant"
          active={Boolean(state.exp)}
          onClear={state.exp ? () => set({ exp: "" }) : undefined}
          sx={CLIENT_PILL_SX}
        >
          <FacetList
            options={facets.exp}
            selected={state.exp ? [state.exp] : []}
            onToggle={(value) => set({ exp: state.exp === value ? "" : value })}
            multiple={false}
            initialVisible={5}
            ariaLabel={
              t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string
            }
          />
        </FilterPopover>

        {/* 6 — Skills. Keeps the chip grid: 60 windowed tags read better as chips than rows. */}
        <FilterPopover
          label={t("jobsV2.board.filter.skills", { defaultValue: "Skills" }) as string}
          icon="mdi:tag-multiple-outline"
          badge={state.skills.length}
          onClear={state.skills.length ? () => set({ skills: [] }) : undefined}
          sx={CLIENT_PILL_SX}
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

        {/* 8 — Posted. */}
        <FilterPopover
          label={t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string}
          icon="mdi:clock-outline"
          active={Boolean(state.posted)}
          onClear={state.posted ? () => set({ posted: "" }) : undefined}
          sx={CLIENT_PILL_SX}
        >
          <FacetList
            options={facets.posted}
            selected={state.posted ? [state.posted] : []}
            onToggle={(value) => set({ posted: state.posted === value ? "" : value })}
            multiple={false}
            initialVisible={3}
            ariaLabel={t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string}
          />
        </FilterPopover>

        {/* 9 — Closing. The employer's own stated deadline, which is the only urgency we ship:
            never "urgently hiring", never "be an early applicant". */}
        <FilterPopover
          label={t("jobsV2.board.filter.closing", { defaultValue: "Closing" }) as string}
          icon="mdi:calendar-clock"
          active={Boolean(state.close)}
          onClear={state.close ? () => set({ close: "" }) : undefined}
          sx={CLIENT_PILL_SX}
        >
          <FacetList
            options={facets.close}
            selected={state.close ? [state.close] : []}
            onToggle={(value) => set({ close: state.close === value ? "" : value })}
            multiple={false}
            initialVisible={3}
            ariaLabel={t("jobsV2.board.filter.closing", { defaultValue: "Closing" }) as string}
          />
        </FilterPopover>

        {/* 10 — Salary. Disclosed / not disclosed, and NEVER a band: `salary` is unparsed free
            text, so a "6-10 LPA" facet over it would be a filter that lies. It ships the day a
            numeric salary_min / salary_max lands, and not before. */}
        <FilterPopover
          label={t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string}
          icon="mdi:cash-multiple"
          active={Boolean(state.salary)}
          onClear={state.salary ? () => set({ salary: "" }) : undefined}
          sx={CLIENT_PILL_SX}
        >
          <FacetList
            options={facets.salary}
            selected={state.salary ? [state.salary] : []}
            onToggle={(value) => set({ salary: state.salary === value ? "" : value })}
            multiple={false}
            initialVisible={2}
            ariaLabel={t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string}
          />
          <Typography sx={{ ...TYPE.micro, mt: 1, color: J.ink4, maxWidth: 260 }}>
            {t("jobsV2.board.salaryHelper", {
              defaultValue:
                "Employers write salary as free text, so we can only tell you whether a figure was disclosed.",
            })}
          </Typography>
        </FilterPopover>

        {/* Below md the seven client facets collapse into one deferred sheet. */}
        <Box sx={{ display: { xs: "inline-flex", md: "none" }, flexShrink: 0 }}>
          <JButton
            variant="secondary"
            startIcon="mdi:filter-variant"
            onClick={openSheet}
          >
            {sheetActiveCount > 0
              ? (t("jobsV2.filters.buttonCount", {
                  count: sheetActiveCount,
                  defaultValue: "Filters ({{count}})",
                }) as string)
              : (t("jobsV2.filters.title", { defaultValue: "Filters" }) as string)}
          </JButton>
        </Box>
      </FilterBar>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groups={sheetGroups}
        resultCount={countFor(sheetDraft)}
        activeCount={sheetActiveCount}
        onApply={() => set(sheetDraft)}
        onClearAll={() =>
          setSheetDraft({
            role: "",
            wm: "",
            exp: "",
            skills: [],
            posted: "",
            close: "",
            salary: "",
          })
        }
      />

      {filters.activeChips.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <ActiveFilters chips={filters.activeChips} onClearAll={filters.clearFilters} />
        </Box>
      )}
    </JCard>
  );
}
