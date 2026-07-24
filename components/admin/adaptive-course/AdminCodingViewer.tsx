"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveCourseService,
  type AdminCodingProblemDetail,
} from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Admin review + edit surface for one generated coding problem - the coding
 * analogue of CourseQuizEditor / AdminArticleViewer. Unlike the learner view it
 * shows the reference solution and test cases so a creator can verify exactly
 * what the AI produced before publishing, and can toggle-active / soft-delete /
 * edit. Mounted inline under a coding tile on the course-detail page.
 */

interface AdminCodingViewerProps {
  problemId: number;
  onChanged?: () => void;
  onDeleted?: () => void;
}

export function AdminCodingViewer({ problemId, onChanged, onDeleted }: AdminCodingViewerProps) {
  const { showToast } = useToast();
  const [problem, setProblem] = useState<AdminCodingProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Editable draft fields.
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [statement, setStatement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [skills, setSkills] = useState("");
  const [cases, setCases] = useState<Array<{ input: string; expected_output: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await adminAdaptiveCourseService.getCodingProblem(problemId);
        if (cancelled) return;
        setProblem(p);
        resetDraft(p);
      } catch {
        if (!cancelled) showToast("Couldn't load the coding problem.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  function resetDraft(p: AdminCodingProblemDetail) {
    setTitle(p.title);
    setDifficulty(p.difficulty_level);
    setStatement(p.problem_statement);
    setConstraints(p.constraints);
    setSkills((p.target_skills || []).join(", "));
    setCases(p.test_cases || []);
  }

  async function handleSave() {
    if (!problem) return;
    setSaving(true);
    try {
      const updated = await adminAdaptiveCourseService.updateCodingProblem(problem.id, {
        title: title.trim(),
        difficulty_level: difficulty,
        problem_statement: statement,
        constraints,
        target_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        test_cases: cases,
      });
      setProblem(updated);
      resetDraft(updated);
      setEditing(false);
      showToast("Saved.", "success");
      onChanged?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!problem) return;
    try {
      const res = await adminAdaptiveCourseService.toggleCodingProblemActive(problem.id);
      setProblem({ ...problem, is_active: res.is_active });
      showToast(res.is_active ? "Problem activated." : "Problem hidden from learners.", "success");
      onChanged?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update.", "error");
    }
  }

  async function handleDelete() {
    if (!problem) return;
    try {
      await adminAdaptiveCourseService.deleteCodingProblem(problem.id);
      showToast("Problem removed.", "success");
      onDeleted?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't remove.", "error");
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!problem) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {!editing ? (
          <Button
            size="small"
            onClick={() => setEditing(true)}
            startIcon={<Icon icon="mdi:pencil-outline" width={15} />}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              size="small"
              variant="contained"
              disabled={saving}
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={13} sx={{ color: "white" }} /> : <Icon icon="mdi:content-save" width={15} />}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Save
            </Button>
            <Button
              size="small"
              onClick={() => {
                resetDraft(problem);
                setEditing(false);
              }}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Cancel
            </Button>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          onClick={handleToggleActive}
          startIcon={<Icon icon={problem.is_active ? "mdi:eye-off-outline" : "mdi:eye-outline"} width={15} />}
          sx={{ textTransform: "none", fontWeight: 800, color: problem.is_active ? "#f59e0b" : "#10b981" }}
        >
          {problem.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="small"
          onClick={handleDelete}
          startIcon={<Icon icon="mdi:trash-can-outline" width={15} />}
          sx={{ textTransform: "none", fontWeight: 800, color: "#ef4444" }}
        >
          Remove
        </Button>
      </Box>

      {editing ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <TextField size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
          <Select size="small" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} sx={{ width: 160 }}>
            {(["Easy", "Medium", "Hard"] as const).map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
          <TextField size="small" label="Problem statement (HTML)" value={statement} onChange={(e) => setStatement(e.target.value)} multiline minRows={4} fullWidth />
          <TextField size="small" label="Constraints (HTML)" value={constraints} onChange={(e) => setConstraints(e.target.value)} multiline minRows={2} fullWidth />
          <TextField size="small" label="Target skills (comma-separated)" value={skills} onChange={(e) => setSkills(e.target.value)} fullWidth />
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", mt: 0.5 }}>
            Test cases
          </Typography>
          {cases.map((tc, i) => (
            <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 0.75, alignItems: "center" }}>
              <TextField size="small" label={`Input ${i + 1}`} value={tc.input}
                onChange={(e) => setCases((cs) => cs.map((c, j) => (j === i ? { ...c, input: e.target.value } : c)))}
                multiline />
              <TextField size="small" label="Expected" value={tc.expected_output}
                onChange={(e) => setCases((cs) => cs.map((c, j) => (j === i ? { ...c, expected_output: e.target.value } : c)))}
                multiline />
              <Button size="small" onClick={() => setCases((cs) => cs.filter((_, j) => j !== i))} sx={{ minWidth: 0, color: "#ef4444" }}>
                <Icon icon="mdi:close" width={16} />
              </Button>
            </Box>
          ))}
          <Button size="small" onClick={() => setCases((cs) => [...cs, { input: "", expected_output: "" }])} startIcon={<Icon icon="mdi:plus" width={15} />} sx={{ textTransform: "none", fontWeight: 800, alignSelf: "flex-start" }}>
            Add test case
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ fontSize: "0.88rem", lineHeight: 1.6, "& p": { mb: 1 } }} dangerouslySetInnerHTML={{ __html: problem.problem_statement }} />
          {problem.constraints && (
            <Box sx={{ fontSize: "0.8rem", color: "text.secondary" }} dangerouslySetInnerHTML={{ __html: problem.constraints }} />
          )}
          <Field label="Target skills" value={(problem.target_skills || []).join(", ") || "-"} />
          {problem.misconception_taxonomy?.length > 0 && (
            <Field label="Misconception taxonomy" value={problem.misconception_taxonomy.map((t) => t.label).join(" · ")} />
          )}

          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
            Test cases ({problem.test_cases?.length ?? 0})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {(problem.test_cases || []).map((tc, i) => (
              <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75, p: 1, borderRadius: 1.5, border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)", fontFamily: "monospace", fontSize: "0.74rem" }}>
                <Box><b>in:</b> <span style={{ whiteSpace: "pre-wrap" }}>{tc.input}</span></Box>
                <Box><b>out:</b> <span style={{ whiteSpace: "pre-wrap" }}>{tc.expected_output}</span></Box>
              </Box>
            ))}
          </Box>

          {/* Reference solution - admin only, collapsed by default */}
          <Button
            size="small"
            onClick={() => setShowSolution((s) => !s)}
            startIcon={<Icon icon={showSolution ? "mdi:eye-off-outline" : "mdi:eye-outline"} width={15} />}
            sx={{ textTransform: "none", fontWeight: 800, alignSelf: "flex-start", color: "#ec4899" }}
          >
            {showSolution ? "Hide reference solution" : "Show reference solution (admin only)"}
          </Button>
          {showSolution &&
            Object.entries(problem.solution || {}).map(([lang, code]) => (
              <Box key={lang}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>{lang}</Typography>
                <Box component="pre" sx={{ mt: 0.25, p: 1, borderRadius: 1.5, overflowX: "auto", fontSize: "0.76rem", fontFamily: "monospace", background: "#0f1117", color: "#e6e6e6", whiteSpace: "pre-wrap" }}>
                  {code}
                </Box>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem" }}>{value}</Typography>
    </Box>
  );
}

export default AdminCodingViewer;
