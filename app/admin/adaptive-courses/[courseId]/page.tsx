"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  ButtonBase,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseDetail,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { CourseQuizEditor } from "@/components/admin/adaptive-course/CourseQuizEditor";

type DialogState =
  | { kind: "module" }
  | { kind: "submodule"; moduleId: number; moduleTitle: string }
  | null;

type Difficulty = "Easy" | "Medium" | "Hard";
const ALL_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
// The AI decides 2–4 sub-skills (key_concepts) per submodule; we use this for a
// best-effort estimate of how many questions a quiz will hold.
const EST_CONCEPTS_PER_SUBMODULE = 3;

export default function AdminAdaptiveCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const { showToast } = useToast();
  const [course, setCourse] = useState<AdminAdaptiveCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [topic, setTopic] = useState("");
  const [rationale, setRationale] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  function handleQuizSaved(configId: number, mcqCount: number) {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m) => ({
              ...m,
              submodules: m.submodules.map((s) => ({
                ...s,
                quizzes: s.quizzes.map((q) =>
                  q.config_id === configId ? { ...q, mcq_count: mcqCount } : q,
                ),
              })),
            })),
          }
        : prev,
    );
  }
  // Generation controls for the add dialog (so the admin sees/controls what gets added).
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["Easy", "Medium", "Hard"]);
  const [perCell, setPerCell] = useState(2);
  const [subCount, setSubCount] = useState(3);

  function openDialog(state: DialogState) {
    // Reset controls to sane defaults each time the dialog opens.
    setTopic("");
    setRationale("");
    setDifficulties(["Easy", "Medium", "Hard"]);
    setPerCell(2);
    setSubCount(3);
    setDialog(state);
  }

  async function handleSuggest() {
    if (!dialog || !course || suggesting) return;
    setSuggesting(true);
    try {
      const res = await adminAdaptiveCourseService.suggestTopic(course.id, {
        scope: dialog.kind,
        module_id: dialog.kind === "submodule" ? dialog.moduleId : undefined,
      });
      setTopic(res.topic);
      setRationale(res.rationale);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't suggest a topic.", "error");
    } finally {
      setSuggesting(false);
    }
  }

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      return ALL_DIFFICULTIES.filter((x) => next.includes(x));
    });
  }

  const submodulesToAdd = dialog?.kind === "module" ? subCount : 1;
  const perSubmodule = EST_CONCEPTS_PER_SUBMODULE * Math.max(difficulties.length, 1) * perCell;
  const estTotalQuestions = submodulesToAdd * perSubmodule;

  const load = useCallback(async () => {
    try {
      const data = await adminAdaptiveCourseService.getCourse(courseId);
      setCourse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    void load();
  }, [courseId, load]);

  async function handlePublish() {
    if (!course) return;
    try {
      const res = await adminAdaptiveCourseService.publishCourse(course.id);
      setCourse({ ...course, is_published: res.is_published });
      showToast(res.is_published ? "Course published." : "Course unpublished.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update.", "error");
    }
  }

  async function handleDialogSubmit() {
    if (!dialog || !course || topic.trim().length < 2 || difficulties.length === 0 || submitting) return;
    setSubmitting(true);
    const config = { difficulty_levels: difficulties, questions_per_cell: perCell };
    try {
      const job =
        dialog.kind === "module"
          ? await adminAdaptiveCourseService.addModule(course.id, {
              topic: topic.trim(),
              submodules_count: subCount,
              config,
            })
          : await adminAdaptiveCourseService.addSubmodule(course.id, dialog.moduleId, {
              topic: topic.trim(),
              config,
            });
      showToast("AI generation started.", "success");
      router.push(`/admin/adaptive-courses/jobs/${job.job_id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't start generation.", "error");
      setSubmitting(false);
    }
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => router.push("/admin/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Course Builder
        </ButtonBase>

        <AdaptiveSectionShell>
          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading course…
            </Typography>
          )}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {course && (
            <>
              <AdaptiveSectionHero
                chapter={course.is_published ? "Published · Adaptive Course" : "Draft · Adaptive Course"}
                title={course.title}
                subtitle={course.description}
                icon="mdi:book-cog-outline"
                accent="indigo"
                rightSlot={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <ButtonBase
                      onClick={() => openDialog({ kind: "module" })}
                      sx={pillBtnSx("outline")}
                    >
                      <Icon icon="mdi:plus" width={16} />
                      Add module (AI)
                    </ButtonBase>
                    <ButtonBase onClick={() => void handlePublish()} sx={pillBtnSx(course.is_published ? "outline" : "solid")}>
                      <Icon icon={course.is_published ? "mdi:eye-off-outline" : "mdi:earth"} width={16} />
                      {course.is_published ? "Unpublish" : "Publish"}
                    </ButtonBase>
                  </Box>
                }
              />

              {course.skills.length > 0 && (
                <Box sx={{
                  mb: 2.5, p: { xs: 2, md: 2.5 }, borderRadius: 4,
                  bgcolor: "color-mix(in srgb, #a855f7 6%, var(--card-bg))",
                  border: "1px solid color-mix(in srgb, #a855f7 25%, transparent)",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25, flexWrap: "wrap" }}>
                    <Icon icon="mdi:brain" width={18} style={{ color: "#a855f7" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#a855f7" }}>
                      Skills this course tests
                    </Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 700 }}>
                      · {course.skills.length} skill{course.skills.length === 1 ? "" : "s"} · AI-tagged across the quiz banks
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {course.skills.map((s) => (
                      <Box key={s.skill} sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.6, pl: 1.25, pr: 0.5, py: 0.5, borderRadius: 999,
                        color: "white", fontWeight: 800, fontSize: "0.78rem",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 70%, #ec4899 100%)",
                      }}>
                        {prettySkill(s.skill)}
                        <Box component="span" sx={{ px: 0.7, py: 0.1, borderRadius: 999, fontSize: "0.7rem", fontWeight: 900, bgcolor: "rgba(255,255,255,0.25)" }}>
                          {s.question_count}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {course.modules.length === 0 && (
                  <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                    No modules yet. Use <strong>Add module (AI)</strong> to generate one.
                  </Typography>
                )}
                {course.modules.map((mod, mIdx) => (
                  <Reveal key={mod.id} delay={Math.min(mIdx, 8) * 0.05}>
                    <Box
                      sx={{
                        borderRadius: 4,
                        p: { xs: 2, md: 2.5 },
                        bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          mb: 1.75,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Box
                            sx={{
                              minWidth: 36,
                              height: 36,
                              px: 1,
                              borderRadius: 2,
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              fontSize: "0.8rem",
                              color: "white",
                              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                            }}
                          >
                            W{mod.weekno}
                          </Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{mod.title}</Typography>
                        </Box>
                        <ButtonBase
                          onClick={() =>
                            openDialog({ kind: "submodule", moduleId: mod.id, moduleTitle: mod.title })
                          }
                          sx={{ ...pillBtnSx("outline"), py: 0.7, fontSize: "0.78rem" }}
                        >
                          <Icon icon="mdi:plus" width={14} />
                          Add submodule (AI)
                        </ButtonBase>
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {mod.submodules.map((sub) => (
                          <Box
                            key={sub.id}
                            sx={{
                              borderRadius: 3,
                              p: 1.75,
                              bgcolor: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{sub.title}</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
                              {sub.quizzes.map((q) => {
                                const open = expandedQuiz === q.config_id;
                                return (
                                  <Box
                                    key={q.config_id}
                                    sx={{
                                      borderRadius: 2.5,
                                      border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
                                      bgcolor: open ? "color-mix(in srgb, #6366f1 5%, transparent)" : "transparent",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <ButtonBase
                                      onClick={() => setExpandedQuiz(open ? null : q.config_id)}
                                      sx={{
                                        width: "100%",
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                        p: 1.25,
                                      }}
                                    >
                                      <Icon icon="mdi:tune-vertical" width={15} style={{ color: "#6366f1" }} />
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{q.title}</Typography>
                                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                        {q.mcq_count}-item bank · serves {q.min_questions}–{q.max_questions}
                                        {q.is_active ? "" : " · inactive"}
                                      </Typography>
                                      <Box sx={{ flex: 1 }} />
                                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: "#6366f1", fontSize: "0.75rem", fontWeight: 800 }}>
                                        <Icon icon="mdi:pencil-outline" width={14} />
                                        {open ? "Hide questions" : "View / edit questions"}
                                        <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />
                                      </Box>
                                    </ButtonBase>
                                    {open && (
                                      <Box sx={{ px: 1.25, pb: 1.5 }}>
                                        <CourseQuizEditor
                                          configId={q.config_id}
                                          topic={sub.title}
                                          onSaved={handleQuizSaved}
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                              {sub.quizzes.length === 0 && (
                                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                  No quiz generated for this submodule.
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Reveal>
                ))}
              </Box>
            </>
          )}
        </AdaptiveSectionShell>
      </Container>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {dialog?.kind === "module"
            ? "Add a module with AI"
            : `Add a submodule to "${dialog?.kind === "submodule" ? dialog.moduleTitle : ""}"`}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2 }}>
            Describe the topic / focus. The engine designs the {dialog?.kind === "module" ? "module's submodules" : "submodule"} and
            generates an adaptive quiz for each new submodule.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Topic / focus"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
            <ButtonBase
              onClick={() => void handleSuggest()}
              disabled={suggesting}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.75, py: 0.7, borderRadius: 999,
                fontWeight: 800, fontSize: "0.8rem", color: "white",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 70%, #ec4899 100%)",
                "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
              }}
            >
              <Icon icon={suggesting ? "mdi:loading" : "mdi:lightbulb-on-outline"} width={15} className={suggesting ? "acb-spin" : ""} />
              {suggesting ? "Thinking…" : topic ? "Suggest another (AI)" : "Suggest with AI"}
            </ButtonBase>
            {rationale && (
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", flex: 1, minWidth: 160 }}>
                {rationale}
              </Typography>
            )}
          </Box>

          {dialog?.kind === "module" && (
            <TextField
              type="number"
              label="Submodules to generate"
              value={subCount}
              onChange={(e) => setSubCount(clamp(Number(e.target.value), 1, 8))}
              sx={{ mt: 2, width: 220 }}
              helperText="AI may adjust slightly to fit the topic"
            />
          )}

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", mb: 1 }}>Difficulty tiers</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {ALL_DIFFICULTIES.map((d) => {
                const active = difficulties.includes(d);
                return (
                  <ButtonBase
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    sx={{
                      px: 2, py: 0.7, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem",
                      color: active ? "white" : "text.primary",
                      background: active ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                      border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                    }}
                  >
                    {d}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>

          <TextField
            type="number"
            label="Questions per skill cell"
            value={perCell}
            onChange={(e) => setPerCell(clamp(Number(e.target.value), 1, 10))}
            sx={{ mt: 2.5, width: 220 }}
          />

          <Box
            sx={{
              mt: 2.5, p: 2, borderRadius: 3,
              bgcolor: "color-mix(in srgb, #6366f1 8%, var(--card-bg))",
              border: "1px solid color-mix(in srgb, #6366f1 25%, transparent)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>
              Estimated to add
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.6 }}>
              {submodulesToAdd} submodule{submodulesToAdd === 1 ? "" : "s"} · ~{perSubmodule} questions each ·{" "}
              <strong>~{estTotalQuestions} questions total</strong>
              <br />
              ({EST_CONCEPTS_PER_SUBMODULE} concepts × {difficulties.length} difficulty tier
              {difficulties.length === 1 ? "" : "s"} × {perCell}/cell — the AI sets 2–4 concepts per submodule,
              so the real count varies a little.)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleDialogSubmit()}
            disabled={topic.trim().length < 2 || difficulties.length === 0 || submitting}
          >
            {submitting ? "Starting…" : "Generate with AI"}
          </Button>
        </DialogActions>
      </Dialog>
      <style jsx global>{`
        @keyframes acb-spin { to { transform: rotate(360deg); } }
        .acb-spin { animation: acb-spin 0.9s linear infinite; display: inline-flex; }
      `}</style>
    </MainLayout>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function prettySkill(s: string): string {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

function pillBtnSx(variant: "solid" | "outline") {
  return {
    px: 2,
    py: 1,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.82rem",
    gap: 0.5,
    display: "inline-flex",
    alignItems: "center",
    color: variant === "solid" ? "white" : "#6366f1",
    background:
      variant === "solid"
        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
    border:
      variant === "solid"
        ? "1px solid transparent"
        : "1px solid color-mix(in srgb, #6366f1 40%, transparent)",
  } as const;
}
