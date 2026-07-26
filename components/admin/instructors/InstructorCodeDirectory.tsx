"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { instructorService, type InstructorDirectoryRow } from "@/lib/services/instructor.service";

/**
 * Admin directory of instructors: email, assigned courses/cohorts/live-sessions, and an editable
 * public CODE. When a code is set, students see it instead of the instructor's real name on
 * course/live-session surfaces (for privacy/professionalism).
 */
export function InstructorCodeDirectory() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<InstructorDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await instructorService.getInstructorDirectory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the instructor directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Typography sx={{ color: "#ef4444", fontWeight: 700, py: 3 }}>{error}</Typography>;
  }
  if (rows.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
        <Typography sx={{ color: "text.secondary" }}>No instructors yet.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
        Set a public <b>code</b> to hide an instructor&apos;s real name from students on their course and
        live-session surfaces. Leave it blank to show the real name.
      </Typography>
      {rows.map((row) => (
        <InstructorCodeRow key={row.profile_id} row={row} onSaved={(code) => {
          setRows((prev) => prev.map((r) => (r.profile_id === row.profile_id ? { ...r, instructor_code: code } : r)));
        }} showToast={showToast} />
      ))}
    </Stack>
  );
}

function InstructorCodeRow({
  row,
  onSaved,
  showToast,
}: {
  row: InstructorDirectoryRow;
  onSaved: (code: string) => void;
  showToast: (msg: string, sev: "success" | "error") => void;
}) {
  const [code, setCode] = useState(row.instructor_code);
  const [saving, setSaving] = useState(false);
  const dirty = code.trim() !== row.instructor_code;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await instructorService.setInstructorCode(row.profile_id, code.trim());
      onSaved(res.instructor_code);
      setCode(res.instructor_code);
      showToast(res.instructor_code ? `Code set to "${res.instructor_code}".` : "Code cleared.", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't save the code.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        alignItems: { md: "center" },
      }}
    >
      {/* Identity */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
          color: "#fff", fontWeight: 800, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
          {(row.name || row.email || "?").slice(0, 1).toUpperCase()}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }} noWrap>{row.name}</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }} noWrap>{row.email}</Typography>
        </Box>
      </Stack>

      {/* Assignments */}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flex: 1.4 }}>
        {row.courses.length === 0 && row.cohorts.length === 0 && row.live_sessions.length === 0 && (
          <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>No assignments</Typography>
        )}
        {row.courses.map((c) => (
          <Chip key={`c${c.id}`} size="small" icon={<Icon icon="mdi:book-education-outline" width={14} />}
            label={c.title} sx={{ maxWidth: 180 }} />
        ))}
        {row.cohorts.map((c) => (
          <Chip key={`h${c.id}`} size="small" icon={<Icon icon="mdi:account-group-outline" width={14} />}
            label={c.name} color="primary" variant="outlined" sx={{ maxWidth: 180 }} />
        ))}
        {row.live_sessions.length > 0 && (
          <Chip size="small" icon={<Icon icon="mdi:video-outline" width={14} />}
            label={`${row.live_sessions.length} live`} variant="outlined" />
        )}
      </Stack>

      {/* Code editor */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <TextField
          size="small"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. INS-042"
          onKeyDown={(e) => { if (e.key === "Enter") void save(); }}
          sx={{ width: 150, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "var(--surface)" } }}
          InputProps={{ startAdornment: <Icon icon="mdi:shield-account-outline" width={16} style={{ marginRight: 6, opacity: 0.6 }} /> }}
        />
        <Button
          onClick={() => void save()}
          disabled={!dirty || saving}
          variant="contained"
          disableElevation
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, minWidth: 72,
            background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
        >
          {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save"}
        </Button>
      </Stack>
    </Box>
  );
}
