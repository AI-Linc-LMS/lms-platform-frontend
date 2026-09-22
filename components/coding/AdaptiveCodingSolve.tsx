"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Button, CircularProgress, FormControl, MenuItem, Select, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import { CodeEditor } from "@/components/editor/MonacoEditor";
import { AdaptiveCodingProblemPanel } from "@/components/coding/AdaptiveCodingProblemPanel";
import { AdaptiveCodingSubmissions } from "@/components/coding/AdaptiveCodingSubmissions";
import { useToast } from "@/components/common/Toast";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import {
  getCodingLanguages,
  starterCodeFor,
  getLanguageId,
  getMonacoLanguage,
} from "@/components/coding/utils/languageUtils";
import { MentorAnalysisCard } from "@/components/coding/MentorAnalysisCard";
import { CodingMasteryPanel } from "@/components/coding/CodingMasteryPanel";
import { CodingTimerPoints } from "@/components/coding/CodingTimerPoints";
import {
  adaptiveCodingService,
  type CodingProblem,
  type CodingSession,
  type CodingSubmissionRecord,
  type CustomRunResult,
  type HintResult,
  type MasteryDelta,
  type MentorDiagnosis,
  type OptimizationChallenge,
  type TestResults,
} from "@/lib/services/adaptive-coding.service";
import { PHONE } from "@/components/common/mobile/phone";

/** The phone workspace's three panes. Desktop shows all of them side by side. */
type PhoneTab = "problem" | "code" | "results";

interface AdaptiveCodingSolveProps {
  configId: number;
  problemId: number;
  onBack?: () => void;
  /** Fired when the problem is solved - now, or already on an earlier visit. */
  onSolved?: () => void;
}

/** Languages a problem can't be solved in are stubbed with a placeholder comment (e.g. SQL for an
 *  array problem: "SQL version not applicable…" / "not suitable…"), so we never default to them. */
function isUnsuitableTemplate(tpl: string | undefined): boolean {
  return /not\s+(suitable|applicable)/i.test(tpl ?? "");
}

// Preference order when several languages are suitable - pick the most natural for a general problem.
const LANGUAGE_PREFERENCE = ["python", "java", "cpp", "javascript", "typescript", "c#"];

/** The language a problem is best answered in: among the OFFERED languages, the first (by
 *  preference) that has a real template, else the first offered. */
function pickDefaultLanguage(templateCode: Record<string, string>, offered: string[]): string {
  const suitable = offered.filter((l) => !isUnsuitableTemplate(templateCode[l]));
  const pool = suitable.length ? suitable : offered;
  for (const p of LANGUAGE_PREFERENCE) if (pool.includes(p)) return p;
  return pool[0] ?? "python";
}

// Per-language editor drafts persisted locally so typed code survives a refresh AND a language
// switch (the adaptive flow only persisted code to the server on Run/Submit). Keyed by problem +
// language, plus the last-used language per problem so a reload restores the right dropdown.
const draftKey = (pid: number, lang: string) => `adaptiveCoding:draft:${pid}:${lang}`;
const langKey = (pid: number) => `adaptiveCoding:lang:${pid}`;
function readDraft(pid: number, lang: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(draftKey(pid, lang)) : null;
  } catch {
    return null;
  }
}
function writeDraft(pid: number, lang: string, code: string) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(draftKey(pid, lang), code ?? "");
  } catch {
    /* quota / private mode - drafts are best-effort */
  }
}
function readLangPref(pid: number): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(langKey(pid)) : null;
  } catch {
    return null;
  }
}
function writeLangPref(pid: number, lang: string) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(langKey(pid), lang);
  } catch {
    /* ignore */
  }
}

/**
 * Student-facing AI Coding Mentor solver. Reuses the Monaco editor + language
 * utils, but routes Run/Submit/Hint at the adaptive-coding endpoints so every
 * action earns a mentor response (Mode 2 On-Run diagnosis, Mode 3 On-Submit
 * grade + diagnosis/optimization, scaffolded hint ladder).
 */
export function AdaptiveCodingSolve({ configId, problemId, onBack, onSolved }: AdaptiveCodingSolveProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [phoneTab, setPhoneTab] = useState<PhoneTab>("problem");

  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<CodingSession | null>(null);
  const [started, setStarted] = useState(false);   // false on a fresh problem → "ready to begin" gate
  const [starting, setStarting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [diagnosis, setDiagnosis] = useState<MentorDiagnosis | null>(null);
  const [optimization, setOptimization] = useState<OptimizationChallenge | null>(null);
  const [masteryDelta, setMasteryDelta] = useState<MasteryDelta | null>(null);
  const [revealedHints, setRevealedHints] = useState<HintResult[]>([]);
  const [hintLayers, setHintLayers] = useState(3);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [solvedAlready, setSolvedAlready] = useState(false);
  // Tell the page once, whether the problem was solved on an earlier visit or just now. The page
  // uses it to offer "Next"; a ref keeps a re-rendered parent from firing it twice.
  const solvedReportedRef = useRef(false);
  useEffect(() => {
    if (solvedAlready && !solvedReportedRef.current) {
      solvedReportedRef.current = true;
      onSolved?.();
    }
  }, [solvedAlready, onSolved]);
  const [masteryRefresh, setMasteryRefresh] = useState(0);

  // On a phone the verdict lands on a tab the learner is not looking at, so when a Run or Submit
  // finishes, show them the Results tab. Watching the busy flags (not the handlers) leaves every
  // request path exactly as it was, and a resumed session's old result does not steal the view.
  const wasBusyRef = useRef(false);
  const resultsAtStartRef = useRef<TestResults | null>(null);
  const [resultsUnseen, setResultsUnseen] = useState(false);
  useEffect(() => {
    const busy = running || submitting;
    if (busy && !wasBusyRef.current) resultsAtStartRef.current = testResults;
    if (wasBusyRef.current && !busy && isPhone) {
      // A request that failed left the old results in place: do not present them as this run's.
      const fresh = testResults !== resultsAtStartRef.current;
      // Moving to another tab would blur the editor and drop the phone keyboard mid-sentence, so
      // while focus is in the Code pane the Results tab only gets a "ready" dot.
      const focused = document.activeElement as HTMLElement | null;
      const typing = !!focused?.closest?.('[data-phone-pane="code"]') && !!focused.matches?.('textarea, input, [contenteditable="true"]');
      if (fresh && typing) setResultsUnseen(true);
      else if (fresh) setPhoneTab("results");
    }
    wasBusyRef.current = busy;
  }, [running, submitting, isPhone, testResults]);
  const openTab = (tab: PhoneTab) => {
    setPhoneTab(tab);
    if (tab === "results") setResultsUnseen(false);
  };
  const [allowClipboard, setAllowClipboard] = useState(false);

  // Offer a consistent algorithmic language set (Python/JS/TS/Java/C++/C#) rather than only the
  // languages this problem happened to be generated with — so C++/TypeScript are always available
  // and SQL never shows on a non-SQL problem. Every option runs on Judge0; the editor seeds from
  // the problem's own template when present, else a minimal stub (see starterCodeFor).
  const availableLanguages = useMemo(
    () => getCodingLanguages(problem?.template_code),
    [problem?.template_code],
  );

  // Rehydrate the UI from a persisted submission (re-entry / reload).
  const applySubmissionRecord = useCallback((record: CodingSubmissionRecord | null | undefined) => {
    if (!record) return;
    setTestResults(record.test_results ?? null);
    const opt = record.diagnosis?.optimization_challenge ?? null;
    if (opt) {
      setOptimization(opt);
      setDiagnosis(null);
    } else if (record.diagnosis) {
      setDiagnosis(record.diagnosis);
    }
  }, []);

  // Load the problem + PEEK an existing session (no create). A fresh problem shows the "ready to
  // begin" gate; an active session resumes the (still-ticking) timer; a completed one is solved.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prob = await adaptiveCodingService.getProblem(problemId);
        // Selectable languages = the curated set actually offered in the dropdown (not just the
        // languages the problem was generated with), so a saved "cpp"/"typescript" is honored.
        const langs = getCodingLanguages(prob.template_code).map((l) => l.value);
        const existing = await adaptiveCodingService.getActiveSession(configId, problemId);
        if (cancelled) return;
        setProblem(prob);
        // Priority for language: local last-used -> server session language -> best default.
        const savedLang = readLangPref(problemId);
        const pickLang = (serverLang?: string | null) => {
          if (savedLang && langs.includes(savedLang)) return savedLang;
          if (serverLang && langs.includes(serverLang)) return serverLang;
          return pickDefaultLanguage(prob.template_code, langs);
        };
        // Priority for code: local draft for that language -> server last_source (only if it was
        // that language) -> the language's starter template (or a stub if it has none).
        const codeFor = (lang: string, serverSource?: string | null, serverLang?: string | null) => {
          const draft = readDraft(problemId, lang);
          if (draft !== null) return draft;
          if (serverSource && lang === serverLang) return serverSource;
          return starterCodeFor(lang, prob.template_code);
        };
        if (existing) {
          setSessionData(existing);
          setSessionId(existing.id);
          const lang = pickLang(existing.language);
          setLanguage(lang);
          setCode(codeFor(lang, existing.last_source, existing.language));
          setHintsRevealed(existing.hints_revealed);
          setSolvedAlready(existing.passed || existing.status === "completed");
          setStarted(existing.status === "active");  // live timer only while active
          setAllowClipboard(Boolean(existing.allow_clipboard));
          applySubmissionRecord(existing.latest_submission);
        } else {
          const lang = pickLang();
          setLanguage(lang);
          setCode(codeFor(lang));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load this problem.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configId, problemId, applySubmissionRecord]);

  // "Begin" - create the session (server stamps started_at = the timer anchor) and reveal the editor.
  const begin = useCallback(async () => {
    if (starting || started || !problem) return;
    setStarting(true);
    try {
      const session = await adaptiveCodingService.startSession({
        config_id: configId,
        problem_id: problemId,
        language,
      });
      setSessionData(session);
      setSessionId(session.id);
      setAllowClipboard(Boolean(session.allow_clipboard));
      setStarted(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't start the session.", "error");
    } finally {
      setStarting(false);
    }
  }, [starting, started, problem, configId, problemId, language, showToast]);

  const resetMentorState = useCallback(() => {
    setDiagnosis(null);
    setOptimization(null);
    setMasteryDelta(null);
  }, []);

  function handleLanguageChange(next: string) {
    if (next === language) return;
    // Stash the current language's work before switching, then restore the target language's
    // draft if it has one - never blow away typed code with the fresh template.
    writeDraft(problemId, language, code);
    writeLangPref(problemId, next);
    const draft = readDraft(problemId, next);
    setLanguage(next);
    setCode(draft !== null ? draft : starterCodeFor(next, problem?.template_code));
    setTestResults(null);
    resetMentorState();
  }

  // Autosave the working draft locally (debounced) so a refresh or a language switch never loses
  // typed code - the server only persists on Run/Submit.
  useEffect(() => {
    if (!problem) return;
    const t = setTimeout(() => {
      writeDraft(problemId, language, code);
      writeLangPref(problemId, language);
    }, 700);
    return () => clearTimeout(t);
  }, [code, language, problem, problemId]);

  // The scratch pad below the editor. `customResult === null` is "not run yet"; an empty stdout
  // on a result object is a program that genuinely printed nothing, and the two must look
  // different or a silent program reads as a broken button.
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customResult, setCustomResult] = useState<CustomRunResult | null>(null);
  const [runningCustom, setRunningCustom] = useState(false);

  async function handleRun() {
    if (!sessionId || running || submitting || solvedAlready) return;
    setRunning(true);
    resetMentorState();
    try {
      const res = await adaptiveCodingService.runWithDiagnosis(sessionId, {
        source: code,
        language_id: getLanguageId(language),
        language,
      });
      setTestResults(res.test_results);
      setDiagnosis(res.diagnosis);
      if (res.test_results.failed === 0 && res.test_results.total > 0) {
        showToast("All visible tests passed - hit Submit to grade it.", "success");
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Run failed.", "error");
    } finally {
      setRunning(false);
    }
  }

  /**
   * Run the code against input the learner typed, and show what it printed.
   *
   * Deliberately separate from handleRun: that one reports a verdict against the problem's own
   * tests, and this one has nothing to be right about. Sharing the results panel would put a
   * pass/fail chip next to output that was never compared to anything.
   */
  async function handleRunCustom() {
    if (!sessionId || running || runningCustom || submitting) return;
    setRunningCustom(true);
    setCustomResult(null);
    try {
      const res = await adaptiveCodingService.runWithCustomInput(sessionId, {
        source: code,
        language_id: getLanguageId(language),
        stdin: customInput,
        language,
      });
      setCustomResult(res);
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Could not run that."), "error");
    } finally {
      setRunningCustom(false);
    }
  }

  async function handleSubmit() {
    if (!sessionId || running || submitting || solvedAlready || !code.trim()) return;
    setSubmitting(true);
    resetMentorState();
    try {
      const res = await adaptiveCodingService.submitWithDiagnosis(sessionId, {
        source: code,
        language_id: getLanguageId(language),
        language,
      });
      setTestResults({
        results: res.grade.results ?? [],
        passed: res.grade.passed,
        failed: res.grade.failed,
        total: res.grade.total,
        first_failing_index: res.grade.first_failing_index ?? null,
        compile_error: res.grade.compile_error ?? null,
        status: res.grade.status,
        all_passed: res.grade.all_passed,
      });
      setDiagnosis(res.diagnosis);
      setOptimization(res.optimization_challenge);
      // Surface the durable Student Model on EVERY submit (up on pass, down on fail).
      setMasteryDelta(res.mastery_delta ?? null);
      setMasteryRefresh((n) => n + 1);
      if (res.detail) {
        // Ungradeable (no test cases / runner outage) - not graded, no penalty.
        showToast(res.detail, "warning");
      } else if (res.grade.all_passed) {
        setSolvedAlready(true);
        setPointsEarned(res.points_earned ?? 0);  // freezes the timer HUD on the earned points
        const pts = res.points_earned ? ` · +${res.points_earned} pts` : "";
        showToast(`Passed - clean & correct${pts}`, "success");
      } else {
        const pts = res.points_earned ? ` (+${res.points_earned} pts)` : "";
        showToast(`${res.grade.passed}/${res.grade.total} passed${pts} - read the mentor's diagnosis.`, "warning");
      }
      // A graded submit counts as a completion (server scores it) - fire the streak celebration.
      if (!res.detail) notifyContentCompleted();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Submit failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevealHint() {
    if (!sessionId || hintLoading || solvedAlready) return;
    setHintLoading(true);
    try {
      const hint = await adaptiveCodingService.revealHint(sessionId, code);
      setHintLayers(hint.hint_layers);
      setHintsRevealed(hint.hints_revealed);
      setRevealedHints((prev) => {
        if (prev.some((h) => h.layer === hint.layer)) return prev;
        return [...prev, hint].sort((a, b) => a.layer - b.layer);
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "The mentor couldn't write a hint just now.", "error");
    } finally {
      setHintLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || !problem) {
    return (
      <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 6 }}>
        {error || "Problem not found."}
      </Typography>
    );
  }

  // Gate the whole problem behind "Begin": until the timer starts, show ONLY the ready card - no
  // statement, examples or constraints - so the question can't be studied before the clock runs.
  // (An already-solved problem on re-entry skips the gate and shows the full layout.)
  if (!started && !solvedAlready) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {onBack && (
          <Box
            component="button"
            onClick={onBack}
            sx={{
              all: "unset", cursor: "pointer", color: "#6366f1", fontWeight: 700, fontSize: "0.85rem", [PHONE]: { minHeight: 44 },
              display: "inline-flex", alignItems: "center", gap: 0.5,
            }}
          >
            <Icon icon="mdi:arrow-left" width={16} /> Back to submodule
          </Box>
        )}
        <CodingReadyGate problem={problem} starting={starting} onBegin={begin} />
      </Box>
    );
  }

  // The workspace pieces, composed two ways: the desktop grid below (unchanged), and on a phone
  // a Problem / Code / Results tab set so the editor is not a screen and a half below the statement.
  const backLink = onBack && (
    <Box
      component="button"
      onClick={onBack}
      sx={{
        all: "unset", cursor: "pointer", color: "#6366f1", fontWeight: 700, fontSize: "0.85rem", [PHONE]: { minHeight: 44 },
        display: "inline-flex", alignItems: "center", gap: 0.5,
      }}
    >
      <Icon icon="mdi:arrow-left" width={16} /> Back to submodule
    </Box>
  );
  const problemPanel = (
    <AdaptiveCodingProblemPanel problem={problem} />
  );
  const solvedBanner = solvedAlready && (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1, borderRadius: 2,
        background: "color-mix(in srgb, #10b981 12%, transparent)",
        border: "1px solid color-mix(in srgb, #10b981 30%, transparent)",
      }}
    >
      <Icon icon="mdi:check-circle" width={18} style={{ color: "#10b981" }} />
      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f9d6b" }}>
        You&apos;ve solved this - keep refining or try the challenge below.
      </Typography>
    </Box>
  );
  const mentorCard = (
    <MentorAnalysisCard
      diagnosis={diagnosis}
      optimization={optimization}
      failedCount={testResults?.failed ?? 0}
      totalCount={testResults?.total ?? 0}
      masteryDelta={masteryDelta}
      hintLayers={hintLayers}
      hintsRevealed={hintsRevealed}
      revealedHints={revealedHints}
      hintLoading={hintLoading}
      onRevealHint={handleRevealHint}
    />
  );
  const masteryPanel = (
    <CodingMasteryPanel refreshKey={masteryRefresh} />
  );
  const submissionsPanel = (
    <AdaptiveCodingSubmissions
      problemId={problemId}
      refreshKey={masteryRefresh}
      onRestore={(src, lang) => {
        // Stash the current work, then load the chosen submission back into the editor.
        writeDraft(problemId, language, code);
        const l = lang && problem?.template_code?.[lang] != null ? lang : language;
        if (l !== language) writeLangPref(problemId, l);
        setLanguage(l);
        setCode(src);
        resetMentorState();
        showToast("Loaded that submission into the editor.", "success");
      }}
    />
  );
  const timerHud = sessionData?.points != null && started && (
    <CodingTimerPoints
      decay={sessionData.points}
      startedAt={sessionData.started_at}
      serverNow={sessionData.server_now}
      running={!solvedAlready}
      earned={solvedAlready ? pointsEarned : null}
      hints={hintsRevealed}
    />
  );
  const toolbar = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", [PHONE]: { "& .MuiButton-root, & .MuiInputBase-root": { minHeight: 44 } } }}>
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <Select
          value={language}
          onChange={(e) => handleLanguageChange(String(e.target.value))}
          sx={{ fontWeight: 700, fontSize: "0.85rem" }}
        >
          {availableLanguages.map((l) => (
            <MenuItem key={l.value} value={l.value} sx={{ fontSize: "0.85rem" }}>
              {l.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ flex: 1 }} />
      <Button
        onClick={() => setCustomOpen((v) => !v)}
        startIcon={<Icon icon="mdi:console-line" width={16} />}
        variant="text"
        sx={{ textTransform: "none", fontWeight: 700, color: "var(--font-secondary)" }}
      >
        Custom input
      </Button>
      <Button
        onClick={handleRun}
        disabled={running || submitting || solvedAlready}
        startIcon={running ? <CircularProgress size={14} /> : <Icon icon="mdi:play" width={16} />}
        variant="outlined"
        sx={{ textTransform: "none", fontWeight: 800, borderColor: "#6366f1", color: "#6366f1" }}
      >
        Run
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={running || submitting || solvedAlready || !code.trim()}
        startIcon={submitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : <Icon icon="mdi:check" width={16} />}
        variant="contained"
        sx={{
          textTransform: "none", fontWeight: 800, color: "white",
          background: "linear-gradient(135deg,#10b981,#059669)",
        }}
      >
        Submit
      </Button>
    </Box>
  );
  const editor = (
    <CodeEditor
      value={code}
      onChange={(v) => setCode(v || "")}
      language={getMonacoLanguage(language)}
      height={isPhone ? "55vh" : "60vh"}
      theme="vs-dark"
      allowClipboard={allowClipboard}
      glyphLine={diagnosis?.root_cause_line ?? null}
      glyphMessage={diagnosis?.whats_wrong || ""}
    />
  );
  const customPanel = customOpen && (
    <Box
      sx={{
        display: "flex", flexDirection: "column", gap: 1.25, p: 1.75, borderRadius: 2, [PHONE]: { "& .MuiButton-root": { minHeight: 44 } },
        border: "1px solid var(--border-subtle, rgba(148,163,184,0.35))",
        backgroundColor: "var(--surface, rgba(15,23,42,0.03))",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon icon="mdi:console-line" width={16} />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>
          Try your own input
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleRunCustom}
          disabled={running || runningCustom || submitting || !code.trim()}
          startIcon={
            runningCustom
              ? <CircularProgress size={13} />
              : <Icon icon="mdi:play-outline" width={15} />
          }
          size="small"
          variant="outlined"
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Run with this input
        </Button>
      </Box>

      <TextField
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        placeholder={"Whatever your program reads from input.\nOne value per line, as the problem describes."}
        multiline
        minRows={3}
        fullWidth
        size="small"
        // The input IS the data: a program reading two lines must get two lines, so nothing
        // here trims or reflows what was typed.
        InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.8rem" } }}
      />

      {customResult && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {customResult.status && (
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--error-500)" }}>
              {customResult.status}
            </Typography>
          )}
          <Typography sx={{ fontSize: "0.7rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 700, color: "text.secondary" }}>
            OUTPUT
          </Typography>
          {/* A program that printed nothing must not look like a button that did nothing. */}
          <Box
            component="pre"
            sx={{
              m: 0, p: 1.25, borderRadius: 1.5, overflowX: "auto", whiteSpace: "pre-wrap",
              fontFamily: "monospace", fontSize: "0.78rem",
              backgroundColor: "rgba(15,23,42,0.06)",
            }}
          >
            {customResult.stdout !== ""
              ? customResult.stdout
              : "(your program printed nothing)"}
          </Box>
          {(customResult.compile_output || customResult.stderr) && (
            <Box
              component="pre"
              sx={{
                m: 0, p: 1.25, borderRadius: 1.5, overflowX: "auto", whiteSpace: "pre-wrap",
                fontFamily: "monospace", fontSize: "0.75rem",
                color: "var(--error-500)", backgroundColor: "rgba(239,68,68,0.08)",
              }}
            >
              {customResult.compile_output || customResult.stderr}
            </Box>
          )}
          <Typography sx={{ fontSize: "0.68rem", [PHONE]: { fontSize: "0.75rem" }, color: "text.secondary" }}>
            Nothing here is graded - this is only what your code prints for this input.
          </Typography>
        </Box>
      )}
    </Box>
  );
  const testStrip = testResults && (testResults.total > 0 || testResults.compile_error) && (
    <TestStrip testResults={testResults} />
  );
  const mentorNote = (
    <Typography sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, color: "text.secondary" }}>
      The mentor reads your code on Run and Submit - it names the line and the concept, never writes the fix.
    </Typography>
  );

  const hasResults = Boolean(testResults && (testResults.total > 0 || testResults.compile_error));
  const tabs: Array<{ key: PhoneTab; label: string; badge?: string }> = [
    { key: "problem", label: t("learningPlayerMobile.problemTab") },
    { key: "code", label: t("learningPlayerMobile.codeTab") },
    {
      key: "results",
      label: t("learningPlayerMobile.resultsTab"),
      badge: testResults && testResults.total > 0 ? `${testResults.passed}/${testResults.total}` : undefined,
    },
  ];
  // Where each piece sits on a phone: its tab, and its order in the single stacked column.
  const slot = (pane: PhoneTab | "always", order: number) => ({ isPhone, pane, order, active: phoneTab });

  // ONE tree at every width. A phone and a desktop render the same components in the same
  // positions; only styles differ (the columns become `display: contents` and each piece's slot
  // gets an order and a visibility). Rotating across 600px therefore never remounts the editor,
  // the timer, or the panels that fetch on mount.
  return (
    // minmax(0,1fr) + minWidth:0 keep the Monaco editor and wide test output from blowing a column
    // past 50% and shoving the page into horizontal overflow (esp. after a run/submit adds output).
    <Box
      data-testid="coding-workspace"
      data-layout={isPhone ? "phone" : "desktop"}
      sx={{
        display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2.5, alignItems: "start",
        ...(isPhone ? { display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 } : {}),
      }}
    >
      {isPhone && (
        <Box
          role="tablist"
          aria-label={t("learningPlayerMobile.workspaceTabs")}
          sx={{
            order: 2, position: "sticky", top: 0, zIndex: 3, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.5,
            p: 0.5, borderRadius: 3, bgcolor: "var(--card-bg, #fff)",
            border: "1px solid var(--border-default, #e5e7eb)", boxShadow: "0 8px 20px -16px rgba(15,23,42,0.35)",
          }}
        >
          {tabs.map((tab) => {
            const active = phoneTab === tab.key;
            const unseen = tab.key === "results" && resultsUnseen && !active;
            return (
              <Box
                key={tab.key}
                component="button"
                role="tab"
                aria-selected={active}
                onClick={() => openTab(tab.key)}
                sx={{
                  all: "unset", cursor: "pointer", minHeight: 44, borderRadius: 2.5, display: "inline-flex", position: "relative",
                  alignItems: "center", justifyContent: "center", gap: 0.6, fontSize: "0.85rem", fontWeight: 800,
                  color: active ? "white" : "var(--font-secondary)",
                  background: active ? "linear-gradient(135deg, var(--module-tile-from, #6366f1), var(--module-tile-to, #a855f7))" : "transparent",
                  "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 2 },
                }}
              >
                {tab.label}
                {tab.badge && (
                  <Box component="span" sx={{ px: 0.75, borderRadius: 999, fontSize: "0.75rem", bgcolor: active ? "rgba(255,255,255,0.22)" : "color-mix(in srgb, currentColor 12%, transparent)" }}>
                    {tab.badge}
                  </Box>
                )}
                {unseen && (
                  <Box
                    component="span"
                    data-testid="results-ready"
                    aria-label={t("learningPlayerMobile.resultsReady")}
                    sx={{ position: "absolute", top: 6, insetInlineEnd: 8, width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}
      {/* Left - problem + mentor analysis */}
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2, ...(isPhone ? { display: "contents" } : {}) }}>
        <Slot {...slot("always", 0)}>{backLink}</Slot>

        <Slot {...slot("problem", 10)}>{problemPanel}</Slot>

        <Slot {...slot("problem", 11)}>{solvedBanner}</Slot>

        <Slot {...slot("results", 31)}>{mentorCard}</Slot>

        <Slot {...slot("problem", 12)}>{masteryPanel}</Slot>

        <Slot {...slot("problem", 13)}>{submissionsPanel}</Slot>
      </Box>

      {/* Right - editor + live timer/points HUD + toolbar (the ready gate is shown earlier, before
          the problem is revealed) */}
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1.25, ...(isPhone ? { display: "contents" } : {}) }}>
        <Slot {...slot("always", 1)}>{timerHud}</Slot>
        <Slot {...slot("code", 20)}>{toolbar}</Slot>

        <Slot {...slot("code", 21)}>{editor}</Slot>
        <Slot {...slot("code", 22)}>{customPanel}</Slot>
        <Slot {...slot("results", 30)}>
          {testStrip}
          {isPhone && !hasResults && (
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textAlign: "center", py: 3 }}>
              {t("learningPlayerMobile.noResultsYet")}
            </Typography>
          )}
        </Slot>
        <Slot {...slot("results", 32)}>{mentorNote}</Slot>
      </Box>
    </Box>
  );
}

/**
 * One piece of the coding workspace. From 600px up it is `display: contents` - no box of its own -
 * so the desktop columns lay out exactly as if the piece were their direct child. On a phone it is
 * a box in the single stacked column with an `order`, shown only while its tab is open.
 *
 * Defined at module scope so its identity is stable: a component declared inside the parent would
 * be a new type on every render and remount everything under it.
 */
function Slot({ isPhone, pane, order, active, children }: {
  isPhone: boolean; pane: PhoneTab | "always"; order: number; active: PhoneTab; children: ReactNode;
}) {
  return (
    <Box
      data-phone-pane={pane}
      sx={
        isPhone
          ? { order, minWidth: 0, display: pane === "always" || pane === active ? "block" : "none", "&:empty": { display: "none" } }
          : { display: "contents" }
      }
    >
      {children}
    </Box>
  );
}

function CodingReadyGate({ problem, starting, onBegin }: { problem: CodingProblem; starting: boolean; onBegin: () => void }) {
  const diffColor =
    problem.difficulty_level === "Easy" ? "#10b981" : problem.difficulty_level === "Hard" ? "#ef4444" : "#f59e0b";
  const points: { icon: string; text: string }[] = [
    { icon: "mdi:timer-play-outline", text: "Your timer starts the moment you begin." },
    { icon: "mdi:trending-down", text: "Points start full and decay the longer you take - submit fast to keep more." },
    { icon: "mdi:clock-alert-outline", text: "Leave and come back? The clock keeps running - even days later." },
  ];
  return (
    <Box
      sx={{
        borderRadius: 3, p: { xs: 3, md: 4 }, textAlign: "center",
        border: "1px solid color-mix(in srgb, #6366f1 22%, transparent)",
        background:
          "linear-gradient(160deg, color-mix(in srgb,#6366f1 9%,var(--card-bg)) 0%, color-mix(in srgb,#a855f7 7%,var(--card-bg)) 100%)",
      }}
    >
      <Box sx={{ width: 56, height: 56, mx: "auto", mb: 1.5, borderRadius: "50%", display: "grid", placeItems: "center",
        color: "white", background: "linear-gradient(135deg,var(--module-tile-from, #6366f1),var(--module-tile-to, #a855f7))", boxShadow: "0 14px 30px -12px rgba(124,58,237,0.7)" }}>
        <Icon icon="mdi:flash" width={28} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.25rem" }}>Ready to begin?</Typography>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 0.5, mb: 2 }}>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>{problem.title}</Typography>
        <Box sx={{ px: 0.9, py: 0.2, borderRadius: 999, fontSize: "0.66rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800, color: diffColor,
          bgcolor: `color-mix(in srgb, ${diffColor} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${diffColor} 30%, transparent)` }}>
          {problem.difficulty_level}
        </Box>
      </Stack>
      <Stack spacing={1} sx={{ maxWidth: 380, mx: "auto", mb: 2.5, textAlign: "left" }}>
        {points.map((p) => (
          <Stack key={p.icon} direction="row" spacing={1} alignItems="flex-start">
            <Icon icon={p.icon} width={18} style={{ color: "#7c3aed", flexShrink: 0, marginTop: 2 }} />
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.45 }}>{p.text}</Typography>
          </Stack>
        ))}
      </Stack>
      <Button
        onClick={onBegin}
        disabled={starting}
        startIcon={starting ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:flash" width={18} />}
        variant="contained"
        sx={{ textTransform: "none", fontWeight: 800, color: "white", px: 3, py: 1,
          background: "linear-gradient(135deg,var(--module-tile-from, #6366f1),var(--module-tile-to, #a855f7))", [PHONE]: { minHeight: 48 } }}
      >
        Begin · start the timer
      </Button>
    </Box>
  );
}

function TestStrip({ testResults }: { testResults: TestResults }) {
  const [selected, setSelected] = useState<number | null>(testResults.first_failing_index);
  // Follow the new first-failing case when a fresh run/submit lands, so the
  // detail panel never shows a stale case from the previous result set.
  useEffect(() => {
    setSelected(testResults.first_failing_index);
  }, [testResults]);
  const rows = testResults.results || [];
  const sel = rows.find((r) => r.index === selected) || rows.find((r) => !r.passed) || rows[0];

  if (testResults.compile_error) {
    return (
      <Box sx={{ p: 1.5, borderRadius: 2, background: "color-mix(in srgb,#ef4444 8%,transparent)", border: "1px solid color-mix(in srgb,#ef4444 28%,transparent)" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#ef4444" }}>Compile error</Typography>
        <Box component="pre" sx={{ mt: 0.5, fontSize: "0.76rem", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          {testResults.compile_error}
        </Box>
      </Box>
    );
  }

  const allPassed = testResults.total > 0 && testResults.failed === 0;
  const tone = allPassed ? "#10b981" : "#ef4444";
  const pct = testResults.total ? Math.round((testResults.passed / testResults.total) * 100) : 0;

  return (
    <Box
      sx={{
        borderRadius: 3, overflow: "hidden",
        border: `1px solid color-mix(in srgb, ${tone} 24%, transparent)`,
        background: "var(--card-bg, #fff)",
      }}
    >
      {/* Summary header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1.1, background: `color-mix(in srgb, ${tone} 8%, transparent)` }}>
        <Icon icon={allPassed ? "mdi:check-circle" : "mdi:alert-circle-outline"} width={18} style={{ color: tone }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: tone }}>
          {allPassed ? `All ${testResults.total} tests passed` : `${testResults.passed} / ${testResults.total} tests passed`}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ width: 90, height: 6, borderRadius: 999, background: "color-mix(in srgb, var(--border-default) 50%, transparent)", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${pct}%`, background: tone, borderRadius: 999, transition: "width 400ms ease" }} />
        </Box>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", mb: sel ? 1.25 : 0 }}>
          {rows.map((r) => {
            const active = r.index === (sel?.index ?? -1);
            const c = r.passed ? "#10b981" : "#ef4444";
            return (
              <Box
                key={r.index}
                component="button"
                onClick={() => setSelected(r.index)}
                sx={{
                  all: "unset", cursor: "pointer", px: 1, py: 0.4, borderRadius: 1.5, fontSize: "0.74rem", [PHONE]: { fontSize: "0.75rem", minHeight: 44, px: 1.5 }, fontWeight: 800,
                  display: "inline-flex", alignItems: "center", gap: 0.4, color: c,
                  background: active ? `color-mix(in srgb, ${c} 16%, transparent)` : `color-mix(in srgb, ${c} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${c} ${active ? 45 : 28}%, transparent)`,
                  transition: "background 120ms ease",
                }}
              >
                <Icon icon={r.passed ? "mdi:check" : "mdi:close"} width={13} />
                TC {r.index}
              </Box>
            );
          })}
        </Box>
        {sel && (
          <Box
            sx={{
              p: 1.25, borderRadius: 2, fontFamily: "monospace", fontSize: "0.76rem",
              background: `color-mix(in srgb, ${sel.passed ? "#10b981" : "#ef4444"} 5%, transparent)`,
              border: `1px solid color-mix(in srgb, ${sel.passed ? "#10b981" : "#ef4444"} 22%, transparent)`,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5,
                display: "flex", alignItems: "center", gap: 0.4, color: sel.passed ? "#10b981" : "#ef4444",
              }}
            >
              <Icon icon={sel.passed ? "mdi:check-circle-outline" : "mdi:close-circle-outline"} width={13} />
              Test case {sel.index} · {sel.passed ? "passed" : "failed"}
            </Typography>
            <Row label="Input" value={sel.input} />
            <Row label="Expected" value={sel.expected} />
            <Row label="Got" value={sel.actual || (sel.stderr ?? "-")} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.25 }}>
      <Typography component="span" sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800, color: "text.secondary", minWidth: 64 }}>
        {label}
      </Typography>
      <Typography component="span" sx={{ fontSize: "0.76rem", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default AdaptiveCodingSolve;
