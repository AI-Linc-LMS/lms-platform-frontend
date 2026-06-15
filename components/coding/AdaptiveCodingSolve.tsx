"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { CodeEditor } from "@/components/editor/MonacoEditor";
import { AdaptiveCodingProblemPanel } from "@/components/coding/AdaptiveCodingProblemPanel";
import { AdaptiveCodingPreviousAttempts } from "@/components/coding/AdaptiveCodingPreviousAttempts";
import { useToast } from "@/components/common/Toast";
import {
  getAvailableLanguages,
  getLanguageId,
  getMonacoLanguage,
} from "@/components/coding/utils/languageUtils";
import { MentorAnalysisCard } from "@/components/coding/MentorAnalysisCard";
import { CodingMasteryPanel } from "@/components/coding/CodingMasteryPanel";
import {
  adaptiveCodingService,
  type CodingProblem,
  type CodingSubmissionRecord,
  type HintResult,
  type MasteryDelta,
  type MentorDiagnosis,
  type OptimizationChallenge,
  type TestResults,
} from "@/lib/services/adaptive-coding.service";

interface AdaptiveCodingSolveProps {
  configId: number;
  problemId: number;
  onBack?: () => void;
}

/**
 * Student-facing AI Coding Mentor solver. Reuses the Monaco editor + language
 * utils, but routes Run/Submit/Hint at the adaptive-coding endpoints so every
 * action earns a mentor response (Mode 2 On-Run diagnosis, Mode 3 On-Submit
 * grade + diagnosis/optimization, scaffolded hint ladder).
 */
export function AdaptiveCodingSolve({ configId, problemId, onBack }: AdaptiveCodingSolveProps) {
  const { showToast } = useToast();

  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
  const [masteryRefresh, setMasteryRefresh] = useState(0);
  const [allowClipboard, setAllowClipboard] = useState(false);

  const availableLanguages = useMemo(
    () => getAvailableLanguages(problem?.template_code),
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

  // Load problem + start (or reuse) a session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prob = await adaptiveCodingService.getProblem(problemId);
        const langs = Object.keys(prob.template_code);
        const session = await adaptiveCodingService.startSession({
          config_id: configId,
          problem_id: problemId,
          language: langs[0],
        });
        if (cancelled) return;
        setProblem(prob);
        setSessionId(session.id);
        const initialLang = session.language && langs.includes(session.language) ? session.language : langs[0];
        setLanguage(initialLang);
        // Re-entry: restore the last edited source if the session has one,
        // else open the template.
        setCode(session.last_source || prob.template_code[initialLang] || "");
        setHintsRevealed(session.hints_revealed);
        setSolvedAlready(session.passed || session.status === "completed");
        setAllowClipboard(Boolean(session.allow_clipboard));
        // Rehydrate the last mentor analysis so a reload doesn't reset to blank.
        applySubmissionRecord(session.latest_submission);
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

  const resetMentorState = useCallback(() => {
    setDiagnosis(null);
    setOptimization(null);
    setMasteryDelta(null);
  }, []);

  function handleLanguageChange(next: string) {
    setLanguage(next);
    setCode(problem?.template_code[next] ?? "");
    setTestResults(null);
    resetMentorState();
  }

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
        showToast("All visible tests passed — hit Submit to grade it.", "success");
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Run failed.", "error");
    } finally {
      setRunning(false);
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
        // Ungradeable (no test cases / runner outage) — not graded, no penalty.
        showToast(res.detail, "warning");
      } else if (res.grade.all_passed) {
        setSolvedAlready(true);
        const skills = Object.entries(res.mastery_delta);
        const gain = skills.length ? ` · ${skills[0][0]} ${skills[0][1].before}→${skills[0][1].after}%` : "";
        showToast(`Passed — clean & correct${gain}`, "success");
      } else {
        showToast(`${res.grade.passed}/${res.grade.total} passed — read the mentor's diagnosis.`, "warning");
      }
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

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5, alignItems: "start" }}>
      {/* Left — problem + mentor analysis + test strip */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {onBack && (
          <Box
            component="button"
            onClick={onBack}
            sx={{
              all: "unset", cursor: "pointer", color: "#6366f1", fontWeight: 700, fontSize: "0.85rem",
              display: "inline-flex", alignItems: "center", gap: 0.5,
            }}
          >
            <Icon icon="mdi:arrow-left" width={16} /> Back to submodule
          </Box>
        )}

        <AdaptiveCodingProblemPanel problem={problem} />

        {solvedAlready && (
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1, borderRadius: 2,
              background: "color-mix(in srgb, #10b981 12%, transparent)",
              border: "1px solid color-mix(in srgb, #10b981 30%, transparent)",
            }}
          >
            <Icon icon="mdi:check-circle" width={18} style={{ color: "#10b981" }} />
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f9d6b" }}>
              You&apos;ve solved this — keep refining or try the challenge below.
            </Typography>
          </Box>
        )}

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

        {testResults && (testResults.total > 0 || testResults.compile_error) && (
          <TestStrip testResults={testResults} />
        )}

        <CodingMasteryPanel refreshKey={masteryRefresh} />

        <AdaptiveCodingPreviousAttempts problemId={problemId} refreshKey={masteryRefresh} />
      </Box>

      {/* Right — editor + toolbar */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
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

        <CodeEditor
          value={code}
          onChange={(v) => setCode(v || "")}
          language={getMonacoLanguage(language)}
          height="60vh"
          theme="vs-dark"
          allowClipboard={allowClipboard}
          glyphLine={diagnosis?.root_cause_line ?? null}
          glyphMessage={diagnosis?.whats_wrong || ""}
        />
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
          The mentor reads your code on Run and Submit — it names the line and the concept, never writes the fix.
        </Typography>
      </Box>
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
                  all: "unset", cursor: "pointer", px: 1, py: 0.4, borderRadius: 1.5, fontSize: "0.74rem", fontWeight: 800,
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
                fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5,
                display: "flex", alignItems: "center", gap: 0.4, color: sel.passed ? "#10b981" : "#ef4444",
              }}
            >
              <Icon icon={sel.passed ? "mdi:check-circle-outline" : "mdi:close-circle-outline"} width={13} />
              Test case {sel.index} · {sel.passed ? "passed" : "failed"}
            </Typography>
            <Row label="Input" value={sel.input} />
            <Row label="Expected" value={sel.expected} />
            <Row label="Got" value={sel.actual || (sel.stderr ?? "—")} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.25 }}>
      <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 800, color: "text.secondary", minWidth: 64 }}>
        {label}
      </Typography>
      <Typography component="span" sx={{ fontSize: "0.76rem", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default AdaptiveCodingSolve;
