"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminCohortsService,
  PAID_COURSE_NEEDS_GRANT,
  type CohortListItem,
  type CohortArtifact,
} from "@/lib/services/admin/admin-cohorts.service";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseListItem,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";
import { TAP, useIsPhone } from "./cohortPhone";

/**
 * Courses ↔ Cohorts matrix — rendered as a VIEW inside /admin/cohorts (not its own nav item,
 * because it is a way of looking at cohorts rather than a separate destination).
 *
 * Assigning a course to a cohort already existed, but only as a generic "add artifact" dialog buried
 * in a cohort's tab and as an action on the course builder — so nobody could find it, and neither
 * view showed the overall picture. This is the matrix: cohorts down the side, courses across the top,
 * one click per cell. Assigning enrols the cohort's active students and auto-enrols anyone who joins
 * later (backend), so a tick here genuinely means "these students have this course".
 */

/** cohortId -> (courseId -> the active artifact row linking them) */
type LinkMap = Map<number, Map<number, CohortArtifact>>;

export function CohortCourseMatrix() {
  const { showToast } = useToast();
  const isPhone = useIsPhone();

  const [cohorts, setCohorts] = useState<CohortListItem[]>([]);
  const [courses, setCourses] = useState<AdminAdaptiveCourseListItem[]>([]);
  const [links, setLinks] = useState<LinkMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** `${cohortId}:${courseId}` while that one cell is being written. */
  const [busyCell, setBusyCell] = useState<string | null>(null);
  /** A paid course the backend refused without an explicit grant - the admin is asked, not blocked. */
  const [grantAsk, setGrantAsk] = useState<{
    cohort: CohortListItem;
    course: AdminAdaptiveCourseListItem;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cohortList, courseList] = await Promise.all([
        adminCohortsService.listCohorts(),
        adminAdaptiveCourseService.listCourses(),
      ]);
      const live = cohortList.filter((c) => c.status !== "archived");
      setCohorts(live);
      setCourses(courseList);

      // One artifact fetch per cohort, in parallel — the API is per-cohort.
      const rows = await Promise.all(
        live.map(async (c) => {
          try {
            return [c.id, await adminCohortsService.listArtifacts(c.id)] as const;
          } catch {
            return [c.id, [] as CohortArtifact[]] as const;
          }
        })
      );
      const next: LinkMap = new Map();
      for (const [cohortId, artifacts] of rows) {
        const byCourse = new Map<number, CohortArtifact>();
        for (const a of artifacts) {
          if (a.artifact_type === "adaptive_course" && a.status === "active" && a.target) {
            byCourse.set(a.target.id, a);
          }
        }
        next.set(cohortId, byCourse);
      }
      setLinks(next);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setError(
        status === 403
          ? "The Cohort Builder isn't enabled for this account. Ask your platform admin to enable it."
          : "Couldn't load cohorts and courses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (
    cohort: CohortListItem,
    course: AdminAdaptiveCourseListItem,
    grantPaidAccess = false,
  ) => {
    const key = `${cohort.id}:${course.id}`;
    if (busyCell) return;
    const existing = links.get(cohort.id)?.get(course.id);
    setBusyCell(key);
    try {
      if (existing) {
        await adminCohortsService.removeArtifact(cohort.id, existing.id);
        setLinks((prev) => {
          const next = new Map(prev);
          const inner = new Map(next.get(cohort.id) ?? []);
          inner.delete(course.id);
          next.set(cohort.id, inner);
          return next;
        });
        // Deliberately explicit: unassigning never revokes access from students who already have it.
        showToast(
          `Removed ${course.title} from ${cohort.name}. Students already enrolled keep their access.`,
          "info"
        );
      } else {
        const art = await adminCohortsService.assignArtifact(cohort.id, {
          artifact_type: "adaptive_course",
          target_id: course.id,
          ...(grantPaidAccess ? { grant_paid_access: true } : {}),
        });
        setLinks((prev) => {
          const next = new Map(prev);
          const inner = new Map(next.get(cohort.id) ?? []);
          inner.set(course.id, art);
          next.set(cohort.id, inner);
          return next;
        });
        const enrolled = art.enrolled ?? 0;
        const granted = art.grants_paid_access ? " Granted free to this batch." : "";
        showToast(
          enrolled > 0
            ? `${course.title} → ${cohort.name}: ${enrolled} student${enrolled === 1 ? "" : "s"} enrolled.${granted}`
            : `${course.title} → ${cohort.name} assigned.${granted}`,
          "success"
        );
      }
    } catch (e: unknown) {
      const response = (e as { response?: { status?: number; data?: { error?: unknown; code?: string } } })
        ?.response;
      // A paid course is refused unless an admin grants it to the batch on purpose. Ask, rather
      // than dead-ending on an error that tells them to go and change the course's price.
      if (!grantPaidAccess && response?.status === 400 && response.data?.code === PAID_COURSE_NEEDS_GRANT) {
        setGrantAsk({ cohort, course });
        return;
      }
      const serverMessage = typeof response?.data?.error === "string" ? response.data.error : null;
      showToast(
        response?.status === 409
          ? "Already assigned — an adaptive course can only be the primary batch of one cohort."
          : serverMessage || "Couldn't update that assignment.",
        "error"
      );
    } finally {
      setBusyCell(null);
    }
  };

  const assignedCount = useMemo(
    () => [...links.values()].reduce((n, m) => n + m.size, 0),
    [links]
  );

  const confirmGrant = () => {
    const ask = grantAsk;
    setGrantAsk(null);
    if (ask) void toggle(ask.cohort, ask.course, true);
  };

  const grantCopy = grantAsk && (
    <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.6 }}>
      <strong>{grantAsk.course.title}</strong> is a paid course. Granting it gives it free to{" "}
      {grantAsk.cohort.member_count > 0
        ? `all ${grantAsk.cohort.member_count} member${grantAsk.cohort.member_count === 1 ? "" : "s"}`
        : "every member"}{" "}
      of <strong>{grantAsk.cohort.name}</strong>, and to anyone who joins the batch later. Learners
      outside the batch still have to buy it.
    </Typography>
  );

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Icon icon="mdi:alert-circle-outline" width={40} style={{ color: "var(--font-tertiary)" }} />
          <Typography sx={{ mt: 1.5, color: "var(--font-secondary)", fontWeight: 600 }}>{error}</Typography>
        </Box>
      ) : cohorts.length === 0 || courses.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
            {cohorts.length === 0
              ? "No cohorts yet — create one in Admin → Cohorts first."
              : "No adaptive courses yet — create one in the course builder first."}
          </Typography>
        </Box>
      ) : (
        <>
          <Typography sx={{ fontSize: "0.85rem", color: "var(--font-tertiary)", mb: 1.5 }}>
            {cohorts.length} cohort{cohorts.length === 1 ? "" : "s"} · {courses.length} course
            {courses.length === 1 ? "" : "s"} · {assignedCount} assignment
            {assignedCount === 1 ? "" : "s"}
          </Typography>

          {/* The matrix. Scrolls horizontally on its own so the page body never does. */}
          <Box
            sx={{
              overflowX: "auto",
              border: "1px solid var(--border-default)",
              borderRadius: "16px",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Box component="table" sx={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "100%" }}>
              <Box component="thead">
                <Box component="tr">
                  <Box
                    component="th"
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      bgcolor: "var(--card-bg)",
                      textAlign: "left",
                      p: 2,
                      minWidth: 220,
                      borderBottom: "1px solid var(--border-default)",
                      fontSize: "0.72rem",
                      // PHONE ONLY: a 220px pinned column left 170px of a 390px screen for the
                      // courses - barely one. 132px keeps names readable and shows two.
                      [PHONE]: { minWidth: 132, maxWidth: 132, p: 1.5, fontSize: "0.75rem" },
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--font-tertiary)",
                    }}
                  >
                    Cohort
                  </Box>
                  {courses.map((course) => (
                    <Box
                      component="th"
                      key={course.id}
                      sx={{
                        p: 1.5,
                        minWidth: 132,
                        maxWidth: 160,
                        [PHONE]: { minWidth: 112, maxWidth: 124, p: 1, "& .MuiTypography-root": { maxWidth: 104, mx: "auto" } },
                        borderBottom: "1px solid var(--border-default)",
                        borderLeft: "1px solid var(--border-default)",
                        verticalAlign: "bottom",
                      }}
                    >
                      <Tooltip title={course.title}>
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "var(--font-primary)",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textAlign: "center",
                          }}
                        >
                          {course.title}
                        </Typography>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {cohorts.map((cohort) => (
                  <Box component="tr" key={cohort.id}>
                    <Box
                      component="th"
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        bgcolor: "var(--card-bg)",
                        textAlign: "left",
                        p: 2,
                        borderBottom: "1px solid var(--border-default)",
                        borderRight: "1px solid var(--border-default)",
                        // PHONE ONLY: the narrower pinned column wraps a long cohort name rather than
                        // cutting it to "Introduction t...".
                        [PHONE]: { p: 1.5, "& .MuiTypography-root": { width: 108, whiteSpace: "normal", overflowWrap: "anywhere" } },
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--font-primary)" }} noWrap>
                        {cohort.name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "var(--font-tertiary)" }}>
                        {cohort.member_count} member{cohort.member_count === 1 ? "" : "s"} · {cohort.status}
                      </Typography>
                    </Box>
                    {courses.map((course) => {
                      const key = `${cohort.id}:${course.id}`;
                      const linked = Boolean(links.get(cohort.id)?.get(course.id));
                      const busy = busyCell === key;
                      return (
                        <Box
                          component="td"
                          key={course.id}
                          sx={{
                            p: 0,
                            borderBottom: "1px solid var(--border-default)",
                            borderLeft: "1px solid var(--border-default)",
                            textAlign: "center",
                          }}
                        >
                          <Tooltip
                            title={
                              linked
                                ? `Remove ${course.title} from ${cohort.name}`
                                : `Give ${cohort.name} (${cohort.member_count} students) access to ${course.title}`
                            }
                          >
                            <Box
                              role="button"
                              tabIndex={0}
                              aria-pressed={linked}
                              onClick={() => void toggle(cohort, course)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") void toggle(cohort, course);
                              }}
                              sx={{
                                display: "grid",
                                placeItems: "center",
                                width: "100%",
                                minHeight: 62,
                                cursor: busyCell ? "default" : "pointer",
                                bgcolor: linked
                                  ? "color-mix(in srgb, #10b981 12%, transparent)"
                                  : "transparent",
                                transition: "background-color .15s",
                                "&:hover": {
                                  bgcolor: linked
                                    ? "color-mix(in srgb, #ef4444 12%, transparent)"
                                    : "color-mix(in srgb, #6366f1 10%, transparent)",
                                },
                              }}
                            >
                              {busy ? (
                                <CircularProgress size={16} />
                              ) : linked ? (
                                <Icon icon="mdi:check-circle" width={22} style={{ color: "#10b981" }} />
                              ) : (
                                <Icon
                                  icon="mdi:plus-circle-outline"
                                  width={20}
                                  style={{ color: "var(--font-tertiary)", opacity: 0.5 }}
                                />
                              )}
                            </Box>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Typography sx={{ mt: 1.5, fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
            Removing an assignment stops future auto-enrolment. Students who already started the course
            keep their access and progress.
          </Typography>
        </>
      )}
      {isPhone ? (
        // PHONE: the same question as a bottom sheet. It closes the moment "Grant" is tapped (the
        // write then runs against the cell, which shows its own spinner), so there is no in-flight
        // state for the sheet to guard.
        <ResponsiveDialog
          open={Boolean(grantAsk)}
          onClose={() => setGrantAsk(null)}
          title="Grant a paid course to this batch?"
          data-testid="grant-paid-sheet"
          footer={
            <>
              <Button onClick={() => setGrantAsk(null)} sx={{ textTransform: "none", fontWeight: 600, minHeight: TAP }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={confirmGrant} sx={{ textTransform: "none", fontWeight: 700, minHeight: TAP }}>
                Grant to batch
              </Button>
            </>
          }
        >
          {grantCopy}
        </ResponsiveDialog>
      ) : (
      <Dialog open={Boolean(grantAsk)} onClose={() => setGrantAsk(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Grant a paid course to this batch?</DialogTitle>
        <DialogContent>
          {grantCopy}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGrantAsk(null)} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmGrant}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Grant to batch
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </>
  );
}
