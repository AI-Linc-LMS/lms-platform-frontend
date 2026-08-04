"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, CircularProgress, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adminInstructorsService, type InstructorRow } from "@/lib/services/admin/admin-instructors.service";
import { instructorService, type StaffAssignment } from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

/** Admin panel to assign/unassign instructors on a course or cohort. Reuses the existing approved-
 *  instructor list for the picker; writes go through the admin-only assignment API. */
export function InstructorAssignPanel({ scope, id }: { scope: "course" | "cohort"; id: number }) {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffAssignment[]>([]);
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState<number>(0); // 0 = none selected
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        scope === "course" ? instructorService.listCourseStaff(id) : instructorService.listCohortStaff(id),
        adminInstructorsService.listInstructors("approved"),
      ]);
      setStaff(s);
      setInstructors(list);
    } catch {
      showToast("Couldn't load instructor assignments.", "error");
    } finally {
      setLoading(false);
    }
  }, [scope, id, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const assignedIds = useMemo(() => new Set(staff.map((s) => s.profile_id)), [staff]);
  const available = useMemo(
    () => instructors.filter((i) => !assignedIds.has(i.id)),
    [instructors, assignedIds],
  );

  async function handleAdd() {
    if (!pick || busy) return;
    setBusy(true);
    try {
      const row =
        scope === "course"
          ? await instructorService.assignCourseStaff(id, { profile_id: pick, role: "instructor" })
          : await instructorService.assignCohortStaff(id, { profile_id: pick, role: "instructor" });
      setStaff((prev) => [...prev.filter((s) => s.profile_id !== row.profile_id), row]);
      setPick(0);
      showToast("Instructor assigned.", "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't assign instructor."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(profileId: number) {
    setBusy(true);
    try {
      if (scope === "course") await instructorService.removeCourseStaff(id, profileId);
      else await instructorService.removeCohortStaff(id, profileId);
      setStaff((prev) => prev.filter((s) => s.profile_id !== profileId));
      showToast("Instructor unassigned.", "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't unassign."), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ p: 2, borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Icon icon="mdi:account-tie-outline" width={20} style={{ color: "#6366f1" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Instructors</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
          · assigned instructors own this {scope}&apos;s students.
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 3 }}>
          <CircularProgress size={22} />
        </Box>
      ) : (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: staff.length ? 2 : 0 }}>
            {staff.map((s) => (
              <Chip
                key={s.profile_id}
                label={s.name || s.email}
                onDelete={busy ? undefined : () => handleRemove(s.profile_id)}
                sx={{ fontWeight: 600 }}
              />
            ))}
            {staff.length === 0 && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                No instructors assigned yet.
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <Select
              size="small"
              value={pick}
              displayEmpty
              onChange={(e) => setPick(Number(e.target.value))}
              sx={{ minWidth: 240, borderRadius: 2, bgcolor: "var(--surface)" }}
              renderValue={(v) =>
                !v ? (
                  <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>Add an instructor…</Typography>
                ) : (
                  instructors.find((i) => i.id === v)?.full_name ||
                  instructors.find((i) => i.id === v)?.email ||
                  String(v)
                )
              }
            >
              {available.length === 0 && (
                <MenuItem disabled value={0}>
                  {instructors.length ? "All instructors already assigned" : "No approved instructors"}
                </MenuItem>
              )}
              {available.map((i) => (
                <MenuItem key={i.id} value={i.id} sx={{ fontSize: "0.88rem" }}>
                  {i.full_name || i.email}
                </MenuItem>
              ))}
            </Select>
            <Button
              onClick={() => void handleAdd()}
              disabled={!pick || busy}
              variant="contained"
              disableElevation
              startIcon={<Icon icon="mdi:plus" width={18} />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
                // Explicit: the custom `background` overrides MUI's contained variant, so without
                // this the label inherited a dark colour and read as dark-on-dark on the gradient.
                color: "#fff",
                "&:hover": { background: "linear-gradient(135deg,#5457e5,#9333ea)" },
                "&.Mui-disabled": { background: "var(--border-default)", color: "var(--font-tertiary)" },
              }}
            >
              Assign
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
