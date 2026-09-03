"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import {
  AssessmentBreadcrumb,
  AssessmentFormSkeleton,
  AssessmentSectionHero,
  SegmentedTabs,
  StatusChip,
} from "@/components/admin/assessment/shared";
import ProjectFileEditor from "@/components/projects/ProjectFileEditor";
import {
  AUTO_GRADEABLE,
  PREVIEWABLE,
  RUNTIME_LABELS,
  VerifierUnavailableError,
  createProject,
  getProject,
  updateProject,
  verifyProject,
  type AdminProjectTemplate,
  type ProjectTemplateDraft,
  type RubricCriterion,
} from "@/lib/services/admin/admin-projects.service";
import type { ProjectRuntime, ProjectTier } from "@/lib/services/project-workspace.service";

/**
 * Author one project brief.
 *
 * The three panes map to the three questions an author has to answer: what are they building
 * (Brief), what do they start from (Starter files, with the live preview beside it), and how is
 * it marked (Grading).
 *
 * Verify is the load-bearing control. It runs the brief's own reference solution through the
 * exact harness the learner will be graded by, so "this is solvable" is measured rather than
 * believed — and the server refuses to put an unverified auto-graded brief on an assessment.
 */

type Tab = "brief" | "files" | "grading";

const BLANK_STARTER: Record<ProjectRuntime, Record<string, string>> = {
  web_static: {
    "index.html":
      '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>My project</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <h1>Hello</h1>\n  <script src="app.js"></script>\n</body>\n</html>\n',
    "styles.css": "body {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n}\n",
    "app.js": "// Your JavaScript goes here.\n",
  },
  web_js: { "index.js": "// Your JavaScript goes here.\n" },
  react: { "App.jsx": "export default function App() {\n  return <h1>Hello</h1>;\n}\n" },
  python: { "solution.py": "def main():\n    pass\n\n\nif __name__ == '__main__':\n    main()\n" },
  java: { "Main.java": "public class Main {\n    public static void main(String[] args) {\n    }\n}\n" },
};

const BLANK_GRADER =
  '"""Checks for this project.\n\nRun with `python3 grade.py`. Import the learner\'s work through the harness so their\noutput stays captured, and exit 0 when every check passes or 1 when some fail — any other\nexit code is treated as the harness having crashed rather than the learner having failed.\n"""\n\nimport _harness_support as h\n\nchecks = []\n\n# Example: read the learner\'s HTML and assert something about it.\n# with open("student/index.html") as f:\n#     html = f.read()\n# checks.append("<h1>" in html)\n\nh._emit(sum(1 for c in checks if c), len(checks))\nraise SystemExit(0 if all(checks) else 1)\n';

export default function ProjectEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();

  const rawId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const isNew = rawId === "new";
  const projectId = isNew ? null : Number(rawId);

  const [tab, setTab] = useState<Tab>("brief");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [title, setTitle] = useState("");
  const [briefHtml, setBriefHtml] = useState("");
  const [runtime, setRuntime] = useState<ProjectRuntime>("web_static");
  const [tier, setTier] = useState<ProjectTier>("auto");
  const [maxMarks, setMaxMarks] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [starterFiles, setStarterFiles] = useState<Record<string, string>>(BLANK_STARTER.web_static);
  const [graderFiles, setGraderFiles] = useState<Record<string, string>>({ "grade.py": BLANK_GRADER });
  const [referenceSolution, setReferenceSolution] = useState<Record<string, string>>({});
  const [editablePathsText, setEditablePathsText] = useState("");
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [verification, setVerification] = useState<AdminProjectTemplate["verification"]>(null);

  const autoAvailable = AUTO_GRADEABLE.includes(runtime);
  const previewable = PREVIEWABLE.includes(runtime);

  const hydrate = useCallback((p: AdminProjectTemplate) => {
    setTitle(p.title);
    setBriefHtml(p.brief_html || "");
    setRuntime(p.runtime);
    setTier(p.tier);
    setMaxMarks(p.max_marks);
    setIsActive(p.is_active);
    setStarterFiles(p.starter_files || {});
    setGraderFiles(p.grader_files || {});
    setReferenceSolution(p.reference_solution || {});
    setEditablePathsText((p.editable_paths || []).join("\n"));
    setRubric(p.rubric || []);
    setVerification(p.verification);
    setDirty(false);
  }, []);

  useEffect(() => {
    if (isNew || !projectId) return;
    setLoading(true);
    getProject(projectId)
      .then(hydrate)
      .catch(() => showToast("Could not load this project.", "error"))
      .finally(() => setLoading(false));
  }, [isNew, projectId, hydrate, showToast]);

  // A runtime the harness cannot drive has no auto tier to offer. Saying so here is the whole
  // point: offering auto-grading we cannot deliver means every learner run 503s forever, and the
  // author never finds out because Verify records nothing on an infrastructure failure.
  useEffect(() => {
    if (!autoAvailable && tier === "auto") setTier("rubric");
  }, [autoAvailable, tier]);

  const mark = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const draft = useMemo<ProjectTemplateDraft>(() => {
    const base: ProjectTemplateDraft = {
      title: title.trim(),
      brief_html: briefHtml,
      runtime,
      tier,
      max_marks: Number(maxMarks) || 0,
      is_active: isActive,
      starter_files: starterFiles,
      editable_paths: editablePathsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    };
    if (tier === "auto") {
      base.grader_files = graderFiles;
      base.reference_solution = referenceSolution;
    } else {
      base.rubric = rubric.filter((c) => c.criterion.trim() && Number(c.weight) > 0);
    }
    return base;
  }, [
    title, briefHtml, runtime, tier, maxMarks, isActive, starterFiles,
    editablePathsText, graderFiles, referenceSolution, rubric,
  ]);

  const save = async (): Promise<AdminProjectTemplate | null> => {
    if (!draft.title) {
      showToast("Give the project a title first.", "warning");
      setTab("brief");
      return null;
    }
    setSaving(true);
    try {
      const saved = isNew
        ? await createProject(draft)
        : await updateProject(projectId as number, draft);
      hydrate(saved);
      showToast(isNew ? "Project created." : "Project saved.", "success");
      if (isNew) router.replace(`/admin/projects/${saved.id}`);
      return saved;
    } catch {
      showToast("Could not save this project.", "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runVerify = async () => {
    // Verify runs against what is STORED, so an unsaved edit would be verified in absentia.
    const saved = dirty || isNew ? await save() : null;
    const id = saved?.id ?? projectId;
    if (!id) return;

    setVerifying(true);
    try {
      const result = await verifyProject(id);
      if (result.verified) {
        showToast(`Verified — the reference solution passes ${result.passed}/${result.total}.`, "success");
      } else {
        showToast(
          `The reference solution only passes ${result.passed}/${result.total} of its own checks. Fix the checks or the solution before setting this to anyone.`,
          "error"
        );
      }
      const refreshed = await getProject(id);
      hydrate(refreshed);
    } catch (err) {
      showToast(
        err instanceof VerifierUnavailableError
          ? "The runner is unavailable, so nothing was recorded. This is not a failed verification — try again shortly."
          : "Verification could not be completed.",
        "error"
      );
    } finally {
      setVerifying(false);
    }
  };

  const verifyChip = () => {
    if (tier === "rubric") return <StatusChip label="Marked by a person" tone="ai" icon="mdi:account-eye-outline" />;
    if (dirty && verification?.status === "passed")
      return <StatusChip label="Edited — verify again" tone="warning" icon="mdi:shield-sync-outline" />;
    if (verification?.status === "passed")
      return (
        <StatusChip
          label={`Verified ${verification.passed}/${verification.total}`}
          tone="success"
          icon="mdi:shield-check-outline"
        />
      );
    if (verification?.status === "failed")
      return <StatusChip label="Failed its own checks" tone="error" icon="mdi:shield-alert-outline" />;
    return <StatusChip label="Not verified" tone="warning" icon="mdi:shield-off-outline" />;
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <AssessmentFormSkeleton />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <AssessmentBreadcrumb
          segments={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Assessments", href: "/admin/assessment" },
            { label: "Projects", href: "/admin/projects" },
            { label: isNew ? "New project" : title || "Project" },
          ]}
        />

        <AssessmentSectionHero
          chapter={isNew ? "NEW PROJECT" : "PROJECT"}
          title={title || "Untitled project"}
          subtitle={
            previewable
              ? "The learner builds this in the browser and sees it render as they type."
              : "The learner writes and runs this against the project's own checks."
          }
          accent="violet"
          icon="mdi:hammer-wrench"
          rightSlot={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {verifyChip()}
              {tier === "auto" && (
                <LoadingButton
                  loading={verifying}
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:shield-check-outline" size={18} />}
                  onClick={runVerify}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Verify
                </LoadingButton>
              )}
              <LoadingButton
                loading={saving}
                variant="contained"
                startIcon={<IconWrapper icon="mdi:content-save-outline" size={18} />}
                onClick={save}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  backgroundColor: "var(--accent-indigo)",
                  "&:hover": { backgroundColor: "var(--accent-indigo)" },
                }}
              >
                {isNew ? "Create" : "Save"}
              </LoadingButton>
            </Box>
          }
        />

        <Box sx={{ mt: 3 }}>
          <SegmentedTabs
            tabs={[
              { value: "brief" as Tab, label: "Brief", icon: "mdi:text-box-outline" },
              {
                value: "files" as Tab,
                label: previewable ? "Starter files & preview" : "Starter files",
                icon: "mdi:file-code-outline",
                count: Object.keys(starterFiles).length,
              },
              { value: "grading" as Tab, label: "Grading", icon: "mdi:clipboard-check-outline" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Box>

        {tab === "brief" && (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 2,
              border: "1px solid var(--border-subtle, var(--neutral-200))",
              backgroundColor: "var(--surface)",
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            }}
          >
            <Box sx={{ display: "grid", gap: 2.5 }}>
              <TextField
                label="Project title"
                value={title}
                onChange={(e) => mark(setTitle)(e.target.value)}
                fullWidth
                placeholder="Build a responsive pricing page"
              />
              <TextField
                label="The brief"
                helperText="What the learner has to build, and how they will know it is done. HTML is allowed."
                value={briefHtml}
                onChange={(e) => mark(setBriefHtml)(e.target.value)}
                fullWidth
                multiline
                minRows={10}
              />
            </Box>

            <Box sx={{ display: "grid", gap: 2.5, alignContent: "start" }}>
              <TextField
                select
                label="Stack"
                value={runtime}
                onChange={(e) => {
                  const next = e.target.value as ProjectRuntime;
                  mark(setRuntime)(next);
                  // Only replace the scaffold when it is still untouched, so changing the stack
                  // never silently discards files the author has written.
                  const untouched =
                    JSON.stringify(starterFiles) === JSON.stringify(BLANK_STARTER[runtime]);
                  if (untouched) setStarterFiles(BLANK_STARTER[next]);
                }}
                fullWidth
              >
                {(Object.keys(RUNTIME_LABELS) as ProjectRuntime[]).map((r) => (
                  <MenuItem key={r} value={r}>
                    {RUNTIME_LABELS[r]}
                    {!AUTO_GRADEABLE.includes(r) && " · rubric only"}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="How it is marked"
                value={tier}
                onChange={(e) => mark(setTier)(e.target.value as ProjectTier)}
                fullWidth
                helperText={
                  autoAvailable
                    ? "Auto-graded runs hidden checks the learner can re-run as they work."
                    : "The harness cannot run this stack, so it is marked against a rubric."
                }
              >
                <MenuItem value="auto" disabled={!autoAvailable}>
                  Auto-graded by checks
                </MenuItem>
                <MenuItem value="rubric">Reviewed against a rubric</MenuItem>
              </TextField>

              <TextField
                label="Marks"
                type="number"
                value={maxMarks}
                onChange={(e) => mark(setMaxMarks)(Number(e.target.value))}
                fullWidth
              />

              <TextField
                label="Read-only paths"
                helperText="One glob per line, e.g. fixture.json or src/*.css. Leave empty to let the learner edit everything. * stops at a folder boundary."
                value={editablePathsText}
                onChange={(e) => mark(setEditablePathsText)(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                inputProps={{ style: { fontFamily: "var(--font-mono)", fontSize: 13 } }}
              />

              <FormControlLabel
                control={
                  <Switch checked={isActive} onChange={(e) => mark(setIsActive)(e.target.checked)} />
                }
                label="Available to add to assessments"
              />
            </Box>
          </Paper>
        )}

        {tab === "files" && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ mb: 1.5, fontSize: 13, color: "var(--font-secondary)" }}>
              What the learner opens on day one. Every attempt gets its own copy, so editing this
              later never rewrites work already in progress.
              {previewable && " The preview on the right is exactly what they will see."}
            </Typography>
            <ProjectFileEditor
              files={starterFiles}
              onChange={mark(setStarterFiles)}
              editablePaths={[]}
              showPreview={previewable}
              allowFileManagement
              height={560}
              label="Starter files"
              emptyHint="No starter files yet."
            />
          </Box>
        )}

        {tab === "grading" && (
          <Box sx={{ mt: 2, display: "grid", gap: 3 }}>
            {tier === "auto" ? (
              <>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>
                    The hidden checks
                  </Typography>
                  <Typography sx={{ mb: 1.5, fontSize: 13, color: "var(--font-secondary)" }}>
                    Runs as <code>python3 grade.py</code> with the learner&apos;s files under{" "}
                    <code>student/</code>. Exit 0 when everything passes and 1 when some checks fail —
                    any other exit code is read as the harness crashing, not the learner failing.
                    Learners never see these files.
                  </Typography>
                  <ProjectFileEditor
                    files={graderFiles}
                    onChange={mark(setGraderFiles)}
                    allowFileManagement
                    height={420}
                    label="Grader"
                    emptyHint="No grader yet."
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>
                    Your reference solution
                  </Typography>
                  <Typography sx={{ mb: 1.5, fontSize: 13, color: "var(--font-secondary)" }}>
                    Verify runs this through the checks above. If your own solution cannot pass them,
                    neither can a learner — which is precisely what this is here to catch, before a
                    cohort finds out instead.
                  </Typography>
                  <ProjectFileEditor
                    files={referenceSolution}
                    onChange={mark(setReferenceSolution)}
                    showPreview={previewable}
                    allowFileManagement
                    height={420}
                    label="Solution"
                    emptyHint="No reference solution yet."
                  />
                </Box>

                {verification?.log && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid var(--border-subtle, var(--neutral-200))",
                      backgroundColor: "var(--surface-muted, var(--neutral-50))",
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1, letterSpacing: 0.4 }}>
                      LAST VERIFICATION
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        whiteSpace: "pre-wrap",
                        color: "var(--font-secondary)",
                      }}
                    >
                      {verification.log}
                    </Box>
                  </Paper>
                )}
              </>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid var(--border-subtle, var(--neutral-200))",
                  backgroundColor: "var(--surface)",
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>Rubric</Typography>
                <Typography sx={{ mb: 2, fontSize: 13, color: "var(--font-secondary)" }}>
                  Each criterion is marked out of its weight. The AI drafts a mark against these for
                  the reviewer, but a draft is worth nothing until an instructor confirms it — the
                  numbers they record are the ones that count.
                </Typography>

                {rubric.map((c, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "2fr 100px 3fr 40px" },
                      gap: 1.5,
                      mb: 1.5,
                      alignItems: "start",
                    }}
                  >
                    <TextField
                      size="small"
                      label="Criterion"
                      value={c.criterion}
                      onChange={(e) => {
                        const next = [...rubric];
                        next[i] = { ...c, criterion: e.target.value };
                        mark(setRubric)(next);
                      }}
                    />
                    <TextField
                      size="small"
                      label="Weight"
                      type="number"
                      value={c.weight}
                      onChange={(e) => {
                        const next = [...rubric];
                        next[i] = { ...c, weight: Number(e.target.value) };
                        mark(setRubric)(next);
                      }}
                    />
                    <TextField
                      size="small"
                      label="What earns it"
                      value={c.guidance ?? ""}
                      onChange={(e) => {
                        const next = [...rubric];
                        next[i] = { ...c, guidance: e.target.value };
                        mark(setRubric)(next);
                      }}
                    />
                    <IconButton
                      onClick={() => mark(setRubric)(rubric.filter((_, j) => j !== i))}
                      sx={{ mt: 0.5 }}
                    >
                      <IconWrapper icon="mdi:close" size={18} />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                  onClick={() =>
                    mark(setRubric)([...rubric, { criterion: "", weight: 10, guidance: "" }])
                  }
                  sx={{ textTransform: "none", mt: 1 }}
                >
                  Add a criterion
                </Button>

                {rubric.length > 0 && (
                  <Typography sx={{ mt: 2, fontSize: 12.5, color: "var(--font-secondary)" }}>
                    Total weight {rubric.reduce((s, c) => s + (Number(c.weight) || 0), 0)}, scaled to{" "}
                    {maxMarks} marks.
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
