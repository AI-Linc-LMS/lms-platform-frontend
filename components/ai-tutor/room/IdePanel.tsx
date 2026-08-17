"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { aiTutorService } from "@/lib/services/ai-tutor.service";
import {
  ROOM_BORDER,
  ROOM_INK,
  ROOM_PANEL,
  ROOM_PANEL_RAISED,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_VIOLET,
  ROOM_VIOLET_SOLID,
  roomFocusRing,
} from "./roomTokens";

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
 * The buffer is NOT owned here. It lives in the room page and arrives as `value`/`onChange`,
 * because this panel unmounts whenever the learner opens the conversation beside it, and local
 * state would take their code with it. Losing typed code in a metered voice session is the worst
 * thing this panel could do, and it also let the tutor cause it: `close_ide` is a tool the model
 * can call on its own.
 *
 * Running code is NOT a model-callable backend tool. Judge0 is a synchronous call with a
 * long timeout, and the platform serves every request from four gunicorn slots; a
 * model-triggered run in the tool path would mean up to thirty seconds of silence AND a
 * quarter of the platform's request capacity held open. The model asks via
 * `request_code_run`, which resolves instantly, the browser runs on its own timeline, and
 * the output is injected back into the conversation when it lands.
 *
 * The chrome is styled from `roomTokens`, not from the global CSS variables. This panel used
 * to use `--card-bg` and `--border-default`, which are the light theme's, and rendered a white
 * header strip across the top of a black room. Nothing in here may reach for a global token.
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
  runRequestNonce,
  runStdin = "",
  value,
  onValueChange,
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
  runRequestNonce: number;
  /** Input the model asked to feed the program, from request_code_run. */
  runStdin?: string;
  /** The buffer, owned by the room so it survives this panel unmounting. */
  value: string;
  onValueChange: (next: string) => void;
}) {
  const code = value;
  const setCode = onValueChange;
  const [watching, setWatching] = useState(true);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string>("");

  const codeRef = useRef(code);
  codeRef.current = code;
  const lastPushedRef = useRef("");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed from the scaffold only while the buffer is empty. A second `open_ide` mid-lesson used
  // to overwrite whatever the learner had written with the new exercise's starter code.
  useEffect(() => {
    if (starterCode && !codeRef.current.trim()) setCode(starterCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterCode]);

  const runCode = useCallback(async (stdin = "") => {
    if (running || !codeRef.current.trim() || !sessionId) return;
    setRunning(true);
    setOutput("");
    try {
      const result = await aiTutorService.runCode(sessionId, {
        source: codeRef.current,
        language,
        // The model can pass input with request_code_run. Dropping it meant a program that
        // reads stdin ran against nothing and the tutor read back a confusing result.
        ...(stdin ? { stdin } : {}),
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

  /**
   * The model can ask for a run; the browser performs it on its own timeline.
   *
   * `seenNonceRef` starts at the nonce's current value rather than at zero, so mounting the panel
   * when the model has already requested runs earlier in the lesson does not immediately fire one.
   * That mattered when this panel remounted on every dock switch, and is still the correct
   * behaviour for a fresh mount.
   */
  const seenNonceRef = useRef(runRequestNonce);
  useEffect(() => {
    if (runRequestNonce === seenNonceRef.current) return;
    seenNonceRef.current = runRequestNonce;
    void runCode(runStdin);
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
        bgcolor: ROOM_PANEL,
        borderLeft: `1px solid ${ROOM_BORDER}`,
        color: ROOM_TEXT,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          bgcolor: ROOM_PANEL_RAISED,
          borderBottom: `1px solid ${ROOM_BORDER}`,
          flexShrink: 0,
        }}
      >
        <Icon
          icon="solar:code-square-bold-duotone"
          width={17}
          height={17}
          style={{ color: ROOM_VIOLET }}
        />
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: ROOM_TEXT,
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          {language}
        </Typography>
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
            fontSize: "0.85rem",
            cursor: "pointer",
            border: "1px solid",
            borderColor: watching ? ROOM_VIOLET : "rgba(255,255,255,0.18)",
            color: watching ? ROOM_VIOLET : ROOM_TEXT_DIM,
            bgcolor: watching ? "rgba(168,85,247,0.14)" : "transparent",
            transition: "border-color 160ms ease, color 160ms ease",
            "&:focus-visible": roomFocusRing,
          }}
        >
          <Icon icon={watching ? "solar:eye-bold" : "solar:eye-closed-bold"} width={13} />
          {watching ? "Watching" : "Not watching"}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => void runCode()}
          disabled={running}
          sx={{
            px: 1.75,
            py: 0.6,
            borderRadius: "8px",
            border: "none",
            fontFamily: "inherit",
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "#fff",
            bgcolor: ROOM_VIOLET_SOLID,
            cursor: running ? "not-allowed" : "pointer",
            opacity: running ? 0.55 : 1,
            transition: "filter 160ms ease",
            "&:hover:not(:disabled)": { filter: "brightness(1.12)" },
            "&:focus-visible": roomFocusRing,
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
            borderRadius: "6px",
            p: 0.5,
            color: ROOM_TEXT_DIM,
            transition: "color 160ms ease, background-color 160ms ease",
            "&:hover": { color: ROOM_TEXT, bgcolor: "rgba(255,255,255,0.08)" },
            "&:focus-visible": roomFocusRing,
          }}
        >
          <Icon icon="mdi:close" width={17} />
        </Box>
      </Box>

      {task ? (
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${ROOM_BORDER}`,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.5, color: ROOM_TEXT_DIM }}>
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
            borderTop: `1px solid ${ROOM_BORDER}`,
            bgcolor: ROOM_INK,
            maxHeight: 180,
            overflowY: "auto",
            p: 1.5,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: ROOM_TEXT_DIM,
              mb: 0.75,
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            Output
          </Typography>
          <Typography
            component="pre"
            sx={{
              m: 0,
              color: ROOM_TEXT,
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.85rem",
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
