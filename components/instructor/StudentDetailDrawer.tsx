"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Divider, Drawer, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { instructorService, type InstructorStudentDetail } from "@/lib/services/instructor.service";

/** A right-side drawer showing a student, restricted to what the instructor shares with them
 *  (server-enforced: only the instructor's own courses/cohorts appear). */
export function StudentDetailDrawer({
  studentId,
  open,
  onClose,
}: {
  studentId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<InstructorStudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || studentId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    (async () => {
      try {
        const d = await instructorService.getStudent(studentId);
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load this student.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: {
        width: { xs: "100%", sm: 420 }, p: 2.5,
        // Clear the fixed top app bar (Toolbar minHeight 56/64) so the header isn't clipped under it.
        pt: { xs: "calc(56px + 20px)", sm: "calc(64px + 20px)" },
        overflowY: "auto",
      } }}>
      {loading && (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 200 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700 }}>{error}</Typography>}
      {detail && (
        <>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "grid", placeItems: "center",
              color: "#fff", background: "linear-gradient(135deg,#6366f1,#a855f7)", fontWeight: 800 }}>
              {(detail.name || detail.email || "?").slice(0, 1).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }} noWrap>{detail.name}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>{detail.email}</Typography>
              {detail.phone && (
                <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{detail.phone}</Typography>
              )}
            </Box>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <DetailList
            icon="mdi:book-education-outline"
            title="Courses"
            empty="No shared courses."
            items={detail.courses.map((c) => ({ id: `c${c.id}`, primary: c.title }))}
          />
          <DetailList
            icon="mdi:account-group-outline"
            title="Batches"
            empty="No shared batches."
            items={detail.cohorts.map((c) => ({ id: `h${c.id}`, primary: c.name, secondary: c.status }))}
          />
          <Typography sx={{ mt: 3, fontSize: "0.75rem", color: "text.secondary", opacity: 0.8 }}>
            You see only the courses and batches you share with this student.
          </Typography>
        </>
      )}
    </Drawer>
  );
}

function DetailList({
  icon,
  title,
  items,
  empty,
}: {
  icon: string;
  title: string;
  items: { id: string; primary: string; secondary?: string }[];
  empty: string;
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Icon icon={icon} width={18} style={{ color: "#6366f1" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>{title}</Typography>
      </Stack>
      {items.length === 0 ? (
        <Typography sx={{ color: "text.secondary", fontSize: "0.84rem", pl: 3.25 }}>{empty}</Typography>
      ) : (
        <Stack spacing={0.75}>
          {items.map((it) => (
            <Box key={it.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              p: 1, borderRadius: 2, bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
              border: "1px solid var(--border-default)" }}>
              <Typography sx={{ fontSize: "0.86rem", fontWeight: 600 }} noWrap>{it.primary}</Typography>
              {it.secondary && (
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", textTransform: "uppercase", fontWeight: 700 }}>
                  {it.secondary}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
