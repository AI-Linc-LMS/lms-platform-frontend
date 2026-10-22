"use client";

/**
 * Recordings: the archive, on its own route, filtered on the server and paginated.
 *
 * It used to be a tab on the live-sessions page, which meant every student who opened that page
 * to check when their next class was also downloaded the tenant's entire recorded history, and
 * then downloaded it again every 60 seconds while a class was near. On 2026-10-22 that reached
 * 125 seconds for one tenant and the load balancer answered 504 at its 60s idle timeout.
 *
 * Three things keep this page cheap, and all of them matter:
 *
 *  - it reads `recordings/`, which carries playback FLAGS and a short plain-text preview of the
 *    AI notes: no prep state, no reminder state, no join links, no Zoom URLs, no transcripts.
 *    Playback and the full notes still go through their own per-occurrence endpoints, one request
 *    at the moment a student presses Watch or Read notes.
 *  - it pages. The archive only grows, so a page that loads all of it gets slower every week it
 *    exists. Twenty rows at a time stays twenty rows at a time forever.
 *  - it filters on the server. Search, course, batch and period change the SQL of the one page
 *    query rather than pulling the archive down to sift it here, and the facet lists ride with the
 *    first page only, never with Load more.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { HeaderActionButton, ModulePageHeader } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE } from "@/components/common/mobile/phone";
import { AssessmentStatusFilter } from "@/components/assessment/AssessmentStatusFilter";
import {
  SearchFilterBar,
  type ActiveFilterChip,
  type FilterSelectDef,
} from "@/components/common/list";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { StudentSessionSummaryDialog } from "@/components/live-sessions/StudentSessionSummaryDialog";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { studentLiveSessionsService } from "@/lib/services/live-sessions";
import type { RecordingSession, RecordingsFacets } from "@/lib/services/live-sessions";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Recordings lists classes with a video; Notes lists classes with AI notes or a transcript. A
 *  class with both is in both. A notes-only class (a recording that failed, or a class held
 *  before a learner joined their batch) is under Notes, which is where "catch up" lands. */
type View = "recordings" | "notes";
type Period = "" | "7d" | "30d" | "90d" | "year";

const PERIODS: { value: Exclude<Period, "">; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

const VIEW_TABS: { value: View; label: string; icon: string }[] = [
  { value: "recordings", label: "Recordings", icon: "mdi:play-circle-outline" },
  { value: "notes", label: "Notes", icon: "mdi:text-box-outline" },
];

/** Uppercase, tracked labels drop both under RTL: tracking breaks Arabic joins and uppercase is
 *  a no-op there (DESIGN.md, section 4). */
const RTL_RESET = { '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" } } as const;

const CARD_SX = {
  borderRadius: 3,
  border: "1px solid var(--border-default)",
  bgcolor: "var(--card-bg)",
} as const;

function heldOn(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/** A LOCAL calendar date, because "last 7 days" is counted on the student's calendar and the
 *  server reads a bare date as midnight in the tenant's timezone. toISOString() would hand over
 *  the UTC date, which is yesterday for anyone east of Greenwich in the morning. */
function localDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function sinceFor(period: Period): string | undefined {
  if (!period) return undefined;
  const now = new Date();
  if (period === "year") return `${now.getFullYear()}-01-01`;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[period];
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return localDate(d);
}

export default function RecordingsPage() {
  const { push } = useInstantNavigation();

  // ---- Filters. `q` is the settled search; the box itself is instant. ----
  const [view, setView] = useState<View>("recordings");
  const [searchInput, setSearchInput] = useState("");
  const q = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [period, setPeriod] = useState<Period>("");
  const since = useMemo(() => sinceFor(period), [period]);

  // ---- The list. ----
  const [rows, setRows] = useState<RecordingSession[]>([]);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [facets, setFacets] = useState<RecordingsFacets | null>(null);
  /** A replace request (first page) in flight; `loadingMore` is an append. */
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState<"page" | "more" | null>(null);
  const [playing, setPlaying] = useState<RecordingSession | null>(null);
  const [reading, setReading] = useState<RecordingSession | null>(null);

  // Every request takes a ticket; only the newest one is allowed to land. Typing "py" then "pyt"
  // issues two requests, and nothing guarantees the server answers them in order: without this
  // the "py" page could arrive last and sit under a box that says "pyt".
  const requestSeq = useRef(0);

  const load = useCallback(
    async ({ offset, replace, facets: wantFacets }: { offset: number; replace: boolean; facets: boolean }) => {
      const ticket = ++requestSeq.current;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const page = await studentLiveSessionsService.getRecordings({
          limit: PAGE_SIZE,
          offset,
          q: q || undefined,
          course: course ? Number(course) : undefined,
          batch: batch ? Number(batch) : undefined,
          has_recording: view === "recordings",
          has_notes: view === "notes",
          since,
          facets: wantFacets,
        });
        if (ticket !== requestSeq.current) return;
        // Append on Load more, so it builds the list instead of paging past it.
        setRows((prev) => (replace ? page.sessions : [...prev, ...page.sessions]));
        setCount(page.count);
        setHasMore(page.has_more);
        if (page.facets) setFacets(page.facets);
        setFailed(null);
      } catch {
        if (ticket !== requestSeq.current) return;
        if (replace) {
          // The rows on screen belong to the previous filters; keeping them under the new ones
          // would be a quiet lie. Say so and offer to try again.
          setRows([]);
          setCount(0);
          setHasMore(false);
        }
        setFailed(replace ? "page" : "more");
      } finally {
        if (ticket === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [q, course, batch, since, view]
  );

  // Any change to the filters or the view starts over from the first page, with facets.
  useEffect(() => {
    void load({ offset: 0, replace: true, facets: true });
  }, [load]);

  const filtering = Boolean(q || course || batch || since);
  const firstLoad = loading && rows.length === 0;
  const refetching = loading && rows.length > 0;

  const clearAll = () => {
    setSearchInput("");
    setCourse("");
    setBatch("");
    setPeriod("");
  };

  // ---- Toolbar. A facet select is only worth its pixels when there are at least two. ----
  const selects: FilterSelectDef[] = [];
  if ((facets?.courses.length ?? 0) >= 2) {
    selects.push({
      key: "course",
      label: "Course",
      value: course,
      options: (facets?.courses ?? []).map((c) => ({ value: String(c.id), label: `${c.title} · ${c.count}` })),
      onChange: setCourse,
    });
  }
  if ((facets?.batches.length ?? 0) >= 2) {
    selects.push({
      key: "batch",
      label: "Batch",
      value: batch,
      options: (facets?.batches ?? []).map((b) => ({ value: String(b.id), label: `${b.name} · ${b.count}` })),
      onChange: setBatch,
    });
  }
  selects.push({
    key: "held",
    label: "Held",
    value: period,
    options: PERIODS,
    onChange: (v) => setPeriod(v as Period),
  });

  const typed = searchInput.trim();
  const activeChips: ActiveFilterChip[] = [];
  if (typed) activeChips.push({ key: "q", label: `Search: ${typed}`, onClear: () => setSearchInput("") });
  if (course) {
    const title = facets?.courses.find((c) => String(c.id) === course)?.title ?? "Course";
    activeChips.push({ key: "course", label: title, onClear: () => setCourse("") });
  }
  if (batch) {
    const name = facets?.batches.find((b) => String(b.id) === batch)?.name ?? "Batch";
    activeChips.push({ key: "batch", label: name, onClear: () => setBatch("") });
  }
  if (period) {
    const label = PERIODS.find((p) => p.value === period)?.label ?? "Held";
    activeChips.push({ key: "held", label, onClear: () => setPeriod("") });
  }

  const tabs = VIEW_TABS.map((t) => ({
    ...t,
    count: t.value === "recordings" ? facets?.totals.recordings : facets?.totals.notes,
  }));

  const notesView = view === "notes";
  const noun = notesView ? "notes" : "recordings";

  return (
    <PageShell maxWidth={1040}>
      <ModulePageHeader
        eyebrow="LEARN · LIVE"
        title="Recordings"
        description="Every class that left something behind: a recording, a transcript or AI notes. This is also where to find a class held before you joined your batch."
        accent="indigo"
        icon="mdi:play-circle-outline"
        action={
          // `display: contents` keeps this wrapper out of the layout; it only carries the
          // phone-only 44px height for a pill that is 38px tall.
          <Box sx={{ display: "contents", [PHONE]: { "& .MuiButtonBase-root": { minHeight: 44 } } }}>
            <HeaderActionButton
              icon="mdi:calendar-blank-outline"
              variant="ghost"
              onClick={() => push("/live-sessions")}
            >
              All sessions
            </HeaderActionButton>
          </Box>
        }
      />

      {/* Recordings | Notes. The segmented track from sm up, a 44px chip row on a phone. */}
      <AssessmentStatusFilter tabs={tabs} value={view} onChange={setView} ariaLabel="Recordings or notes" />

      <Box
        sx={{
          mt: 2,
          // The shared bar's fields are MUI small, 40px. A thumb needs 44; desktop is untouched.
          [PHONE]: { "& .MuiOutlinedInput-root": { minHeight: 44 } },
        }}
      >
        <SearchFilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by class, course or batch"
          selects={selects}
          activeChips={activeChips}
          onClearAll={clearAll}
        />
      </Box>

      <Box sx={{ mt: 2.5 }}>
        {firstLoad && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {!loading && failed === "page" && rows.length === 0 && (
          <Box sx={{ ...CARD_SX, p: 3, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Could not load {noun}</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
              Check your connection and try again.
            </Typography>
            <Button
              onClick={() => void load({ offset: 0, replace: true, facets: true })}
              variant="contained"
              sx={{ textTransform: "none", fontWeight: 700, minHeight: 44, mt: 1.5 }}
            >
              Try again
            </Button>
          </Box>
        )}

        {!loading && !failed && rows.length === 0 && (
          filtering ? (
            <EmptyState
              icon="mdi:magnify-close"
              title={`No ${noun} match these filters`}
              body="Try a different search, course, batch or period."
              action={
                <Chip
                  label="Clear filters"
                  onClick={clearAll}
                  sx={{ mt: 1.75, fontWeight: 700, cursor: "pointer", [PHONE]: { height: 44, px: 1, fontSize: "0.9rem" } }}
                />
              }
            />
          ) : (
            <EmptyState
              icon={notesView ? "mdi:text-box-outline" : "mdi:play-circle-outline"}
              title={notesView ? "No notes yet" : "No recordings yet"}
              body={
                notesView
                  ? "Once a class has been held and its AI notes or transcript are ready, they will appear here."
                  : "Once a class has been held and its recording is ready, it will appear here."
              }
            />
          )
        )}

        {rows.length > 0 && (
          <>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Typography
                data-testid="recordings-count"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  ...RTL_RESET,
                }}
              >
                Showing {rows.length} of {count}
                {filtering ? " matching" : ""}
              </Typography>
              {refetching && <CircularProgress size={14} />}
            </Stack>

            {/* A filter change keeps the rows on screen, dimmed, until the next page lands. A
                spinner card in their place would make every keystroke flash the list away. */}
            <Stack
              data-testid="recordings-list"
              spacing={1.5}
              aria-busy={refetching || undefined}
              sx={{ opacity: refetching ? 0.55 : 1, transition: "opacity .15s ease" }}
            >
              {rows.map((s) => (
                <RecordingRow
                  key={s.occurrence_id}
                  s={s}
                  view={view}
                  onWatch={() => setPlaying(s)}
                  onRead={() => setReading(s)}
                />
              ))}
            </Stack>

            {hasMore && (
              <Stack alignItems="center" sx={{ mt: 2.5 }}>
                <Button
                  data-testid="load-more-recordings"
                  onClick={() => void load({ offset: rows.length, replace: false, facets: false })}
                  disabled={loadingMore || loading}
                  startIcon={
                    loadingMore ? <CircularProgress size={16} /> : <IconWrapper icon="mdi:chevron-down" size={18} />
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 44,
                    px: 3,
                    borderRadius: 2,
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {loadingMore ? "Loading" : `Load ${Math.max(1, Math.min(PAGE_SIZE, count - rows.length))} more`}
                </Button>
              </Stack>
            )}

            {failed === "more" && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", textAlign: "center", mt: 2 }}>
                Could not load more just now.
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Playback and notes both resolve per OCCURRENCE. Asking by session id alone returns the
          series-latest file, which is how every date of a recurring series once played the same
          video, and it belonged to none of them. The notes reader is the dialog Live Sessions and
          the instructor page share: it fetches the summary and transcript lazily for the one
          occurrence that was opened, so the list never carries them. */}
      {playing && (
        <RecordingPlayerDialog
          liveClassId={playing.session_id}
          occurrenceId={playing.occurrence_id}
          title={playing.title}
          open
          onClose={() => setPlaying(null)}
        />
      )}
      {reading && (
        <StudentSessionSummaryDialog
          activityId={reading.session_id}
          occurrenceId={reading.occurrence_id}
          topicName={reading.title}
          open
          onClose={() => setReading(null)}
        />
      )}
    </PageShell>
  );
}

// ---- Pieces ------------------------------------------------------------------------------- //

const PILL_TONES = {
  ai: "var(--ai-violet, #7c3aed)",
  transcript: "var(--accent-indigo)",
  files: "var(--font-secondary)",
} as const;

function Pill({ tone, icon, children }: { tone: keyof typeof PILL_TONES; icon: string; children: string }) {
  const color = PILL_TONES[tone];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.4,
        borderRadius: 999,
        fontSize: "0.64rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        lineHeight: 1,
        color,
        bgcolor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`,
        // 0.64rem is 10px. Nothing on a phone reads below 12px.
        [PHONE]: { fontSize: "0.75rem" },
        ...RTL_RESET,
      }}
    >
      <IconWrapper icon={icon} size={12} color={color} />
      {children}
    </Box>
  );
}

function RecordingRow({
  s,
  view,
  onWatch,
  onRead,
}: {
  s: RecordingSession;
  view: View;
  onWatch: () => void;
  onRead: () => void;
}) {
  const notesView = view === "notes";
  const hasNotes = s.has_transcript || s.has_summary;
  const meta = [heldOn(s.held_at), s.course, s.batch].filter(Boolean).join(" · ");

  const actionSx = { textTransform: "none", fontWeight: 800, px: 2, borderRadius: 2 } as const;
  const quietSx = {
    textTransform: "none",
    fontWeight: 700,
    color: "var(--accent-indigo, #6366f1)",
    px: 1.5,
    borderRadius: 2,
    border: "1px solid var(--border-default)",
  } as const;

  return (
    <Box
      data-testid="recording-row"
      sx={{
        ...CARD_SX,
        p: { xs: 1.75, sm: 2 },
        display: "flex",
        gap: { xs: 1, sm: 1.75 },
        alignItems: { xs: "flex-start", sm: "center" },
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", minWidth: 0, overflowWrap: "anywhere" }}>
          {s.title}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", mt: 0.25 }}>{meta}</Typography>

        {(s.has_summary || s.has_transcript || (!notesView && s.has_materials)) && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
            {s.has_summary && (
              <Pill tone="ai" icon="mdi:star-four-points">
                {notesView ? "AI summary" : "AI notes"}
              </Pill>
            )}
            {s.has_transcript && (
              <Pill tone="transcript" icon="mdi:text-box-outline">
                Transcript
              </Pill>
            )}
            {!notesView && s.has_materials && (
              <Pill tone="files" icon="mdi:paperclip">
                Files
              </Pill>
            )}
          </Stack>
        )}

        {notesView && s.notes_preview && (
          <Typography
            data-testid="notes-preview"
            sx={{
              mt: 1,
              color: "var(--font-primary)",
              fontSize: "0.88rem",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {s.notes_preview}
          </Typography>
        )}
        {notesView && !s.notes_preview && s.has_transcript && (
          <Typography data-testid="transcript-only" sx={{ color: "text.secondary", fontSize: "0.82rem", mt: 1 }}>
            Transcript only
          </Typography>
        )}

        {!s.attended && (
          // Said plainly on the archive, where catching up is the point. History deliberately
          // does not stamp anyone "Missed"; here it is just a reason to press Watch.
          <Typography data-testid="did-not-attend" sx={{ color: "text.secondary", fontSize: "0.78rem", mt: 0.75 }}>
            You were not marked present for this one
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          width: { xs: "100%", sm: "auto" },
          mt: { xs: 1.5, sm: 0 },
          flexShrink: 0,
          "& > *": { flex: { xs: 1, sm: "0 0 auto" } },
          [PHONE]: { "& > *": { minHeight: 44 } },
        }}
      >
        {notesView ? (
          <>
            {hasNotes && (
              <Button
                onClick={onRead}
                variant="contained"
                startIcon={<IconWrapper icon="mdi:text-box-outline" size={16} />}
                sx={actionSx}
              >
                Read notes
              </Button>
            )}
            {s.has_recording && (
              <Button onClick={onWatch} startIcon={<IconWrapper icon="mdi:play" size={16} />} sx={quietSx}>
                Watch
              </Button>
            )}
          </>
        ) : (
          <>
            {hasNotes && (
              <Button onClick={onRead} startIcon={<IconWrapper icon="mdi:text-box-outline" size={16} />} sx={quietSx}>
                Notes
              </Button>
            )}
            {s.has_recording && (
              <Button
                onClick={onWatch}
                variant="contained"
                startIcon={<IconWrapper icon="mdi:play" size={16} />}
                sx={actionSx}
              >
                Watch
              </Button>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        textAlign: "center",
        bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
        border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
      }}
    >
      <Box sx={{ display: "inline-flex", opacity: 0.45 }}>
        <IconWrapper icon={icon} size={36} />
      </Box>
      <Typography sx={{ fontWeight: 800, mt: 1.5, mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", maxWidth: 480, mx: "auto", lineHeight: 1.5 }}>
        {body}
      </Typography>
      {action}
    </Box>
  );
}
