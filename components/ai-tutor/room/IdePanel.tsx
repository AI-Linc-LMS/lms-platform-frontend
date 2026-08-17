"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { aiTutorService } from "@/lib/services/ai-tutor.service";

/**
 * The coding panel, and the thing that makes it feel like someone is sitting next to you:
 * the tutor watches what you type.
 *
 * The watching is deliberately restrained. Pushing every keystroke would be expensive and,
 * worse, annoying: a tutor that talks over your typing is more irritating than one that
 * waits. So a push happens only when all three are true - watch mode is on, you have
 * paused for a couple of seconds, and the buffer has actually changed materially since the
 * last push. There is a visible toggle, because some people want to think in silence.
 *
 * Running code is NOT a model-callable backend tool. Judge0 is a synchronous call with a
 * long timeout, and the platform serves every request from four gunicorn slots; a
 * model-triggered run in the tool path would mean up to thirty seconds of silence AND a
 * quarter of the platform's request capacity held open. The model asks via
 * `request_code_run`, which resolves instantly, the browser runs on its own timeline, and
 * the output is injected back into the conversation when it lands.
 *
 * The run itself goes to AI Tutor's OWN endpoint, not adaptive-quiz's. The two features
 * are gated separately, so borrowing that route meant a tenant with the tutor and no
 * adaptive courses got a 403 the first time a learner pressed Run.
 */

const IDLE_PUSH_MS = 2500;
const MIN_CHANGE_CHARS = 12;

export function IdePanel({
  open,
  sessionId,
  language,
  task,
  starterCode,
  onClose,
  onShareCode,
  onRunResult,
  registerReader,
  runRequestNonce,
}: {
  open: boolean;
  /** Runs are scoped to the session server-side; without it there is nothing to run against. */
  sessionId: string | null;
  language: string;
  task: string;
  starterCode?: string;
  onClose: () => void;
  onShareCode: (language: string, code: string) => void;
  onRunResult: (summary: string) => void;
  registerReader: (reader: () => { language: string; code: string } | null) => void;
  runRequestNonce: number;
}) {
  const [code, setCode] = useState(starterCode ?? "");
  const [watching, setWatching] = useState(true);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string>("");

  const codeRef = useRef(code);
  codeRef.current = code;
  const lastPushedRef = useRef("");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (starterCode !== undefined) setCode(starterCode);
  }, [starterCode]);

  // Let the hook read the buffer when the model calls read_student_code.
  useEffect(() => {
    registerReader(() => ({ language, code: codeRef.current }));
  }, [language, registerReader]);

  const runCode = useCallback(async () => {
    if (running || !codeRef.current.trim() || !sessionId) return;
    setRunning(true);
    setOutput("");
    try {
      const result = await aiTutorService.runCode(sessionId, {
        source: codeRef.current,
        language,
      });
      // A refusal is a normal 200 carrying a learner-facing sentence. Show it as-is
      // rather than turning "add a main() method" into "something went wrong".
      const summary = result.ok
        ? [result.stdout, result.stderr, result.compile_output]
            .filter(Boolean)
            .join("\n")
            .trim() || "(no output)"
        : result.detail || "Could not run that.";
      setOutput(summary);
      onRunResult(summary.slice(0, 1200));
    } catch (err) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not run that just now.";
      setOutput(message);
      onRunResult(message);
    } finally {
      setRunning(false);
    }
  }, [language, onRunResult, running, sessionId]);

  // The model can ask for a run; the browser performs it on its own timeline.
  useEffect(() => {
    if (runRequestNonce > 0) void runCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runRequestNonce]);

  const handleChange = (value: string | undefined) => {
    const next = value ?? "";
    setCode(next);
    if (!watching) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      const current = codeRef.current;
      const changed = Math.abs(current.length - lastPushedRef.current.length);
      if (current.trim() && changed >= MIN_CHANGE_CHARS) {
        lastPushedRef.current = current;
        onShareCode(language, current);
      }
    }, IDLE_PUSH_MS);
  };

  useEffect(
    () => () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    },
    []
  );

  if (!open) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "var(--card-bg)",
        borderLeft: "1px solid var(--border-default)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Icon
          icon="solar:code-square-bold-duotone"
          width={17}
          height={17}
          style={{ color: "var(--ai-violet)" }}
        />
        <Typography sx={{ fontSize: "0.86rem", fontWeight: 500 }}>{language}</Typography>
        <Box sx={{ flex: 1 }} />
        <Box
          component="button"
          type="button"
          onClick={() => setWatching((w) => !w)}
          title={
            watching
              ? "Your tutor is watching as you type"
              : "Your tutor is not watching right now"
          }
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            px: 1.25,
            py: 0.5,
            borderRadius: 9999,
            fontFamily: "inherit",
            fontSize: "0.74rem",
            cursor: "pointer",
            border: "1px solid",
            borderColor: watching ? "var(--ai-violet)" : "var(--border-default)",
            color: watching ? "var(--ai-violet)" : "var(--font-tertiary)",
            bgcolor: "transparent",
          }}
        >
          <Icon icon={watching ? "solar:eye-bold" : "solar:eye-closed-bold"} width={13} />
          {watching ? "Watching" : "Not watching"}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={runCode}
          disabled={running}
          sx={{
            px: 1.75,
            py: 0.6,
            borderRadius: "8px",
            border: "none",
            fontFamily: "inherit",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#fff",
            bgcolor: "var(--ai-violet)",
            cursor: "pointer",
            opacity: running ? 0.5 : 1,
          }}
        >
          {running ? "Running…" : "Run"}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onClose}
          aria-label="Close editor"
          sx={{
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            p: 0.5,
          }}
        >
          <Icon icon="mdi:close" width={17} style={{ color: "var(--font-tertiary)" }} />
        </Box>
      </Box>

      {task ? (
        <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid var(--border-default)" }}>
          <Typography sx={{ fontSize: "0.84rem", color: "var(--font-secondary)" }}>
            {task}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <CodeEditor
          value={code}
          onChange={handleChange}
          language={language}
          height="100%"
          allowClipboard
        />
      </Box>

      {output ? (
        <Box
          sx={{
            borderTop: "1px solid var(--border-default)",
            bgcolor: "var(--night, #140b2b)",
            maxHeight: 160,
            overflowY: "auto",
            p: 1.5,
          }}
        >
          <Typography
            component="pre"
            sx={{
              m: 0,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.8rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {output}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
