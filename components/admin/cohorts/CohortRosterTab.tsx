"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, ButtonBase, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminCohortsService,
  type CohortMember,
} from "@/lib/services/admin/admin-cohorts.service";
import { EnrollCohortStudentsDialog } from "./EnrollCohortStudentsDialog";
import { BulkEnrollmentDialog } from "@/components/admin/manage-students/BulkEnrollmentDialog";

const PAGE_SIZE = 25;

export function CohortRosterTab({
  cohortId,
  cohortName,
  onChanged,
}: {
  cohortId: number;
  cohortName: string;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCohortsService.listMembers(cohortId, {
        search: search || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setMembers(res.results);
      setCount(res.count);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't load the roster.", "error");
    } finally {
      setLoading(false);
    }
  }, [cohortId, page, search, showToast]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  async function remove(m: CohortMember) {
    if (!window.confirm(`Remove ${m.name || m.email} from this cohort?`)) return;
    try {
      await adminCohortsService.removeMembers(cohortId, [m.student_id]);
      showToast("Removed.", "success");
      void load();
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't remove.", "error");
    }
  }

  const enrolledIds = new Set(members.map((m) => m.student_id));
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Members <span style={{ color: "#a855f7" }}>{count}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          size="small"
          sx={{ minWidth: 220 }}
        />
        <Button
          onClick={() => setBulkOpen(true)}
          variant="outlined"
          startIcon={<Icon icon="mdi:upload-outline" width={16} />}
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
        >
          Upload CSV
        </Button>
        <Button
          onClick={() => setEnrollOpen(true)}
          variant="contained"
          startIcon={<Icon icon="mdi:account-plus" width={16} />}
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700, background: "var(--gradient-ai)" }}
        >
          Enroll students
        </Button>
      </Box>

      {loading && <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>Loading…</Typography>}
      {!loading && members.length === 0 && (
        <Box
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: "center",
            border: "1px dashed var(--border-default)",
          }}
        >
          <Typography sx={{ color: "text.secondary" }}>
            No members yet - click <strong>Enroll students</strong> to add a batch.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {members.map((m) => (
          <Box
            key={m.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderRadius: 3,
              bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
                color: "white",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
              }}
            >
              {(m.name || m.email || "?").slice(0, 1).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }} noWrap>
                {m.name || m.email}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }} noWrap>
                {m.email} · joined {m.enrolled_at?.slice(0, 10)} · {m.source}
              </Typography>
            </Box>
            <ButtonBase
              onClick={() => void remove(m)}
              sx={{ p: 0.75, borderRadius: 2, color: "text.secondary", "&:hover": { color: "#ef4444" } }}
              aria-label="Remove member"
            >
              <Icon icon="mdi:account-remove-outline" width={18} />
            </ButtonBase>
          </Box>
        ))}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 2 }}>
          <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} sx={{ textTransform: "none" }}>
            Prev
          </Button>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
            {page} / {totalPages}
          </Typography>
          <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} sx={{ textTransform: "none" }}>
            Next
          </Button>
        </Box>
      )}

      <EnrollCohortStudentsDialog
        open={enrollOpen}
        cohortId={cohortId}
        enrolledIds={enrolledIds}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={() => {
          setPage(1);
          void load();
          onChanged();
        }}
      />

      <BulkEnrollmentDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        lockedCohort={{ id: cohortId, name: cohortName }}
        onSuccess={() => {
          setPage(1);
          void load();
          onChanged();
        }}
      />
    </Box>
  );
}
