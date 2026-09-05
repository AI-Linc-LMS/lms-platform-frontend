"use client";

/**
 * The paper an instructor is teaching from, answers included.
 *
 * The gradebook listed assessments and stopped there - no card was clickable, so an instructor
 * could see that six people were waiting on their marking and had no way to read the questions
 * they were marking against. This is that page.
 *
 * Access is the backend's call, not this component's: the export endpoint is scoped to the
 * assessments assigned to this instructor's batches, so an id typed into the URL bar for another
 * batch's paper comes back 403 and is rendered as such.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { config } from "@/lib/config";
import {
  getQuestionsExportJson,
  isCodingQuestion,
  isMCQQuestion,
  isSubjectiveQuestion,
  type QuestionsExportCodingQuestion,
  type QuestionsExportMCQQuestion,
  type QuestionsExportResponse,
  type QuestionsExportSection,
  type QuestionsExportSubjectiveQuestion,
} from "@/lib/services/admin/admin-assessment.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { instructorService, type InstructorSubmissionRow } from "@/lib/services/instructor.service";
import {
  getSubmissionsExportJson,
  type SubmissionsExportResponse,
} from "@/lib/services/admin/admin-assessment.service";
import { mapSubmissionsExportRowToAssessmentResult, safeAssessmentPdfFileName } from "@/lib/utils/admin-submission-export-to-assessment-result.utils";
import { generateAssessmentResultPdfVector } from "@/lib/utils/assessment-result-pdf.utils";
import { preloadPdfBrandAssets } from "@/lib/utils/assessment-pdf-assets";
import { useToast } from "@/components/common/Toast";

const CARD = {
  p: 2.25,
  borderRadius: 3,
  bgcolor: "var(--card-bg)",
  border: "1px solid var(--border-default)",
} as const;

const MONO = {
  fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: "0.82rem",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
} as const;

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="pre"
      sx={{ ...MONO, m: 0, p: 1.25, borderRadius: 2, bgcolor: "var(--surface-muted, rgba(127,127,127,0.08))", overflowX: "auto" }}
    >
      {children}
    </Box>
  );
}

/** The answer key for a multiple-choice question. */
function MCQCard({ q, index }: { q: QuestionsExportMCQQuestion; index: number }) {
  const options: Array<[string, string]> = [
    ["A", q.option_a],
    ["B", q.option_b],
    ["C", q.option_c],
    ["D", q.option_d],
  ];
  // correct_option has been stored as "A" and as "option_a" over the years; match on the letter.
  const correct = (q.correct_option || "").trim().slice(-1).toUpperCase();

  return (
    <Box sx={CARD}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Chip size="small" label={`Q${index + 1}`} sx={{ fontWeight: 800 }} />
        <Typography sx={{ fontWeight: 700, flex: 1, minWidth: 0 }}>{q.question_text}</Typography>
        {q.difficulty_level && <Chip size="small" label={q.difficulty_level} sx={{ textTransform: "capitalize" }} />}
      </Stack>

      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        {options.map(([letter, text]) => {
          const isCorrect = letter === correct;
          return (
            <Stack
              key={letter}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                p: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: isCorrect ? "#10b981" : "var(--border-default)",
                bgcolor: isCorrect ? "color-mix(in srgb, #10b981 12%, transparent)" : "transparent",
              }}
            >
              <Box
                sx={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                  fontWeight: 800, fontSize: "0.72rem",
                  color: isCorrect ? "#fff" : "text.secondary",
                  bgcolor: isCorrect ? "#10b981" : "var(--surface-muted, rgba(127,127,127,0.12))",
                }}
              >
                {letter}
              </Box>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: isCorrect ? 700 : 400 }}>{text}</Typography>
              {isCorrect && <Icon icon="mdi:check-circle" width={16} color="#10b981" />}
            </Stack>
          );
        })}
      </Stack>

      {q.explanation && (
        <Box sx={{ mt: 1.5 }}>
          <Labelled label="Why">
            <Typography sx={{ fontSize: "0.88rem", color: "text.secondary" }}>{q.explanation}</Typography>
          </Labelled>
        </Box>
      )}
    </Box>
  );
}

/** A coding problem, with the reference solution the export withheld until now. */
function CodingCard({ q, index }: { q: QuestionsExportCodingQuestion; index: number }) {
  const solutions = useMemo(
    () => Object.entries(q.solution || {}).filter(([, code]) => (code || "").trim().length > 0),
    [q.solution]
  );
  const [lang, setLang] = useState(0);
  const activeLang = solutions[Math.min(lang, Math.max(solutions.length - 1, 0))];

  return (
    <Box sx={CARD}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Chip size="small" label={`Q${index + 1}`} sx={{ fontWeight: 800 }} />
        <Typography sx={{ fontWeight: 800, flex: 1, minWidth: 0 }}>{q.title}</Typography>
        {q.difficulty_level && <Chip size="small" label={q.difficulty_level} sx={{ textTransform: "capitalize" }} />}
      </Stack>

      {q.problem_statement && (
        <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "text.secondary", whiteSpace: "pre-wrap" }}>
          {q.problem_statement}
        </Typography>
      )}

      {(q.sample_input || q.sample_output) && (
        <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
          {q.sample_input && <Labelled label="Sample input"><Pre>{q.sample_input}</Pre></Labelled>}
          {q.sample_output && <Labelled label="Sample output"><Pre>{q.sample_output}</Pre></Labelled>}
        </Box>
      )}

      {q.constraints && (
        <Box sx={{ mt: 1.5 }}>
          <Labelled label="Constraints"><Pre>{q.constraints}</Pre></Labelled>
        </Box>
      )}

      <Box sx={{ mt: 1.75 }}>
        <Labelled label="Reference solution">
          {solutions.length === 0 ? (
            // 59% of the coding problems attached to a live assessment have none recorded. Saying
            // so is the honest render; an empty code box would read as "the answer is blank".
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
              <Icon icon="mdi:information-outline" width={16} />
              <Typography sx={{ fontSize: "0.85rem" }}>
                No reference solution recorded for this problem.
              </Typography>
            </Stack>
          ) : (
            <>
              {solutions.length > 1 && (
                <Tabs
                  value={Math.min(lang, solutions.length - 1)}
                  onChange={(_, v) => setLang(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: 34, mb: 0.75, "& .MuiTab-root": { minHeight: 34, py: 0, textTransform: "capitalize", fontWeight: 700 } }}
                >
                  {solutions.map(([name]) => (
                    <Tab key={name} label={name} />
                  ))}
                </Tabs>
              )}
              <Pre>{activeLang?.[1]}</Pre>
            </>
          )}
        </Labelled>
      </Box>
    </Box>
  );
}

/** A written question: the rubric is the answer key. */
function SubjectiveCard({ q, index }: { q: QuestionsExportSubjectiveQuestion; index: number }) {
  return (
    <Box sx={CARD}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Chip size="small" label={`Q${index + 1}`} sx={{ fontWeight: 800 }} />
        <Typography sx={{ fontWeight: 700, flex: 1, minWidth: 0 }}>{q.question_text}</Typography>
        <Chip size="small" label={`${q.max_marks} marks`} sx={{ fontWeight: 700 }} />
      </Stack>
      {q.evaluation_prompt && (
        <Box sx={{ mt: 1.5 }}>
          <Labelled label="What a strong answer covers">
            <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", whiteSpace: "pre-wrap" }}>
              {q.evaluation_prompt}
            </Typography>
          </Labelled>
        </Box>
      )}
    </Box>
  );
}

function SectionBlock({ section }: { section: QuestionsExportSection }) {
  const pool = section.questions?.length ?? 0;
  // A section can hold a pool and serve a subset - saying so avoids "why are there 20 questions
  // when the paper has 10?".
  const served = section.number_of_questions;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25, flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{section.section_title}</Typography>
        <Chip size="small" label={section.section_type} sx={{ fontWeight: 700, textTransform: "capitalize" }} />
        {served > 0 && served < pool && (
          <Chip size="small" variant="outlined" label={`${served} of ${pool} served per attempt`} />
        )}
        {section.time_limit_minutes != null && (
          <Chip size="small" variant="outlined" icon={<Icon icon="mdi:timer-outline" width={14} />} label={`${section.time_limit_minutes} min`} />
        )}
      </Stack>

      <Stack spacing={1.5}>
        {section.questions.map((q, i) => {
          if (isCodingQuestion(q)) return <CodingCard key={`c-${q.id}`} q={q} index={i} />;
          if (isMCQQuestion(q)) return <MCQCard key={`m-${q.id}`} q={q} index={i} />;
          if (isSubjectiveQuestion(q)) return <SubjectiveCard key={`s-${q.id}`} q={q} index={i} />;
          return null;
        })}
      </Stack>
    </Box>
  );
}


/** Nothing yet, said plainly: an empty roster and a failed load must not look the same. */
function SubmissionsPanel({ assessmentId }: { assessmentId: number }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<InstructorSubmissionRow[] | null>(null);
  const [pending, setPending] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await instructorService.getAssessmentSubmissions(assessmentId);
        if (cancelled) return;
        setRows(r.results);
        setPending(r.pending_grading);
      } catch (e) {
        if (!cancelled) setErr(getAxiosErrorDetail(e, "Couldn't load who sat this paper."));
      }
    })();
    return () => { cancelled = true; };
  }, [assessmentId]);

  /**
   * The learner's report, identical to the one an admin downloads.
   *
   * Deliberately reuses the admin submissions-export payload and the same mapper + PDF
   * generator rather than rendering a second, subtly different instructor report. That
   * endpoint is gated by SCOPED_DASHBOARD_ROLES (which includes instructor) and
   * _assessment_accessible_by_profile, so an instructor only ever gets papers already in
   * their scope.
   *
   * Fetched lazily on first click: it is a much heavier payload than the roster, and most
   * visits to this tab never download anything.
   */
  const [exportData, setExportData] = useState<SubmissionsExportResponse | null>(null);
  const [downloadingFor, setDownloadingFor] = useState<number | null>(null);

  const handleDownloadReport = useCallback(
    async (row: InstructorSubmissionRow) => {
      setDownloadingFor(row.submission_id);
      try {
        const data =
          exportData ?? (await getSubmissionsExportJson(config.clientId, assessmentId));
        if (!exportData) setExportData(data);

        const match = (data.submissions || []).find(
          (s: any) => Number(s.submission_id) === Number(row.submission_id),
        );
        if (!match) {
          showToast("That attempt is not in the export yet. Try again in a moment.", "error");
          return;
        }
        await preloadPdfBrandAssets({ name: undefined, logoUrl: undefined });
        const result = mapSubmissionsExportRowToAssessmentResult(data, match);
        const fileName = safeAssessmentPdfFileName(
          data.assessment?.title || String(assessmentId),
          row.name,
        );
        await generateAssessmentResultPdfVector(result, fileName);
        showToast("Report downloaded", "success");
      } catch (e) {
        showToast(getAxiosErrorDetail(e, "Couldn't download that report."), "error");
      } finally {
        setDownloadingFor(null);
      }
    },
    [assessmentId, exportData, showToast],
  );

  if (err) {
    return <Typography sx={{ color: "#ef4444", fontWeight: 700, py: 4, textAlign: "center" }}>{err}</Typography>;
  }
  if (rows === null) {
    return <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>Loading submissions…</Typography>;
  }
  if (rows.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
        <Typography sx={{ color: "text.secondary" }}>
          Nobody in your batches has sat this paper yet.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {pending > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, display: "inline-flex", alignItems: "center", gap: 1,
          bgcolor: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#b45309", fontWeight: 700 }}>
          <Icon icon="mdi:alert-circle-outline" width={18} />
          {pending} awaiting your review
        </Box>
      )}
      <Box sx={{ overflowX: "auto", borderRadius: 3, border: "1px solid var(--border-default)" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
          <Box component="thead" sx={{ bgcolor: "color-mix(in srgb, var(--font-primary) 4%, transparent)" }}>
            <Box component="tr">
              {["Student", "Score", "Status", "Submitted", ""].map((h) => (
                <Box key={h || "actions"} component="th" sx={{ textAlign: h === "Score" ? "right" : "left", p: 1.25,
                  fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.4, color: "text.secondary", whiteSpace: "nowrap" }}>
                  {h.toUpperCase()}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.map((r) => (
              <Box key={r.submission_id} component="tr" sx={{ borderTop: "1px solid var(--border-default)" }}>
                <Box component="td" sx={{ p: 1.25, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{r.name}</Typography>
                  {r.email && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{r.email}</Typography>}
                </Box>
                <Box component="td" sx={{ p: 1.25, textAlign: "right", whiteSpace: "nowrap" }}>
                  {r.score === null ? (
                    /* Not graded yet. Rendering 0 here would libel the student. */
                    <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", fontStyle: "italic" }}>not graded</Typography>
                  ) : (
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                      {r.score}
                      {r.max_marks ? <Box component="span" sx={{ color: "text.secondary", fontWeight: 600 }}>/{r.max_marks}</Box> : null}
                    </Typography>
                  )}
                </Box>
                <Box component="td" sx={{ p: 1.25 }}>
                  <Chip size="small"
                    label={r.review_status === "pending_evaluation" ? "Needs review" : (r.status || "submitted")}
                    sx={{ fontWeight: 700, textTransform: "capitalize",
                      ...(r.review_status === "pending_evaluation"
                        ? { bgcolor: "color-mix(in srgb,#f59e0b 16%,transparent)", color: "#b45309" }
                        : {}) }} />
                </Box>
                <Box component="td" sx={{ p: 1.25, whiteSpace: "nowrap", fontSize: "0.82rem", color: "text.secondary" }}>
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                </Box>
                <Box component="td" sx={{ p: 1.25, whiteSpace: "nowrap", textAlign: "right" }}>
                  <Button
                    size="small"
                    disabled={downloadingFor === r.submission_id}
                    onClick={() => handleDownloadReport(r)}
                    startIcon={<Icon icon="mdi:file-download-outline" width={15} />}
                    sx={{ textTransform: "none", fontWeight: 700, color: "var(--accent-indigo)" }}
                  >
                    {downloadingFor === r.submission_id ? "Preparing…" : "Download report"}
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default function InstructorAssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assessmentId = Number(params?.id);

  // Submissions first: "who sat this and what did they get" is the question the gradebook
  // was failing to answer. The paper itself is what you mark AGAINST, so it comes second.
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<QuestionsExportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(assessmentId)) {
      setError("That assessment link looks wrong.");
      setLoading(false);
      return;
    }
    try {
      setData(await getQuestionsExportJson(config.clientId, assessmentId));
    } catch (e) {
      setError(getAxiosErrorDetail(e, "Couldn't load this assessment."));
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const sections = data?.sections ?? [];
    return {
      sections: sections.length,
      questions: sections.reduce((n, s) => n + (s.questions?.length ?? 0), 0),
    };
  }, [data]);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title={data?.assessment?.title || "Assessment"}
        description={
          data
            ? `${totals.questions} question${totals.questions === 1 ? "" : "s"} across ${totals.sections} section${totals.sections === 1 ? "" : "s"}, with answers.`
            : "Questions and answers for the paper you are marking."
        }
        accent="amber"
        icon="mdi:clipboard-text-search-outline"
      />

      <Box
        component="button"
        onClick={() => router.push("/instructor/assessments")}
        sx={{
          mb: 2, px: 1.25, py: 0.5, borderRadius: 2, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5,
          border: "1px solid var(--border-default)", bgcolor: "transparent", color: "text.secondary", font: "inherit", fontWeight: 700,
        }}
      >
        <Icon icon="mdi:arrow-left" width={16} /> Gradebook
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 40,
        "& .MuiTab-root": { minHeight: 40, fontWeight: 800, textTransform: "none" } }}>
        <Tab label="Submissions" />
        <Tab label="Question paper" />
      </Tabs>

      {tab === 0 && <SubmissionsPanel assessmentId={assessmentId} />}

      {tab === 1 && error && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "#ef4444", fontWeight: 700 }}>{error}</Typography>
        </Box>
      )}

      {tab === 1 && !error && loading && (
        <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>Loading the paper…</Typography>
      )}

      {tab === 1 && !error && !loading && totals.questions === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>This assessment has no questions in it yet.</Typography>
        </Box>
      )}

      {tab === 1 &&
        !error &&
        !loading &&
        (data?.sections ?? []).map((s, i) => (
          <Reveal key={s.section_id} delay={Math.min(i, 6) * 0.05}>
            <SectionBlock section={s} />
          </Reveal>
        ))}
    </PageShell>
  );
}
