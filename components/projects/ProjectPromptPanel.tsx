"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip } from "@/components/admin/assessment/shared";
import {
  AttemptClosedError,
  AttemptsExhaustedError,
  GenerationUnavailableError,
  generateProject,
  getGenerations,
  type AttemptState,
  type ProjectGeneration,
} from "@/lib/services/project-workspace.service";

/**
 * Brief an AI to write the project, twice at most.
 *
 * The count on this panel comes from the SERVER on every render that matters, because it is the
 * only place that can see the learner's other tab. It is never derived on the client: the
 * assessment page already does that at `app/assessments/[slug]/page.tsx`, where "1 / 2" is
 * computed from a boolean and is a fiction.
 *
 * `unmetered` is branched on rather than inferred. Staff bypass the meter, so their count never
 * moves, and rendering "2 of 2 left" for them is indistinguishable from a meter that has stopped
 * counting — which is exactly how the AI Tutor minutes bug was first reported.
 */

const POLL_MS = 2500;
/** Long enough for a frontier model to write a whole project; the server's own timeout is 180s. */
const POLL_TIMEOUT_MS = 240_000;
const MAX_PROMPT_CHARS = 4000;

const LIVE: ProjectGeneration["status"][] = ["pending", "running"];

interface ProjectPromptPanelProps {
  workspaceId: number;
  /** The attempt is submitted; the brief and the history stay readable, nothing new is generated. */
  locked?: boolean;
  /** Called when a generation lands, so the workspace can reload the files it produced. */
  onGenerated?: () => void;
}

export default function ProjectPromptPanel({
  workspaceId,
  locked = false,
  onGenerated,
}: ProjectPromptPanelProps) {
  const [attempts, setAttempts] = useState<AttemptState | null>(null);
  const [history, setHistory] = useState<ProjectGeneration[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Cleared on unmount so a poll cannot setState into a dead component, and so leaving the page
  // mid-generation does not leave a timer running for four minutes.
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const startedAt = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  const refresh = useCallback(async (): Promise<ProjectGeneration[]> => {
    const { attempts: next, generations } = await getGenerations(workspaceId);
    if (!alive.current) return generations;
    setAttempts(next);
    setHistory(generations);
    return generations;
  }, [workspaceId]);

  const poll = useCallback(async () => {
    let landed = false;
    try {
      const generations = await refresh();
      landed = !generations.some((g) => LIVE.includes(g.status));
    } catch {
      // A failed poll is not a failed generation. Keep polling: the work is server-side and
      // carries on regardless, and giving up here would leave the learner looking at a spinner
      // for a project that has already been written.
    }
    if (!alive.current) return;
    if (landed) {
      setBusy(false);
      onGenerated?.();
      return;
    }
    if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
      setBusy(false);
      setError(
        "This is taking longer than expected. Reload the page in a moment — if it did not " +
          "work, the attempt is given back to you."
      );
      return;
    }
    pollTimer.current = setTimeout(() => void poll(), POLL_MS);
  }, [onGenerated, refresh]);

  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const generations = await refresh();
        // A generation already in flight when the page opened — another tab, or a reload mid-run.
        if (generations.some((g) => LIVE.includes(g.status))) {
          startedAt.current = Date.now();
          setBusy(true);
          pollTimer.current = setTimeout(() => void poll(), POLL_MS);
        }
      } catch {
        if (alive.current) setLoadError(true);
      }
    })();
    return () => {
      alive.current = false;
      stopPolling();
    };
  }, [poll, refresh, stopPolling]);

  const submit = async () => {
    const text = prompt.trim();
    if (!text || busy || locked) return;
    setBusy(true);
    setError(null);
    try {
      const { attempts: next } = await generateProject(workspaceId, text);
      setAttempts(next);
      await refresh();
      startedAt.current = Date.now();
      pollTimer.current = setTimeout(() => void poll(), POLL_MS);
    } catch (err) {
      setBusy(false);
      if (err instanceof AttemptsExhaustedError) {
        if (err.attempts) setAttempts(err.attempts);
        setError(err.message);
      } else if (err instanceof GenerationUnavailableError) {
        setError(err.message);
      } else if (err instanceof AttemptClosedError) {
        setError(err.message);
      } else {
        setError("We could not start that generation. Your attempt has not been used.");
      }
      void refresh().catch(() => undefined);
    }
  };

  const remaining = attempts?.remaining ?? 0;
  const exhausted = Boolean(attempts) && !attempts!.unmetered && remaining <= 0;
  const canSubmit = !busy && !locked && !exhausted && prompt.trim().length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid var(--border-subtle, var(--neutral-200))",
        backgroundColor: "var(--surface)",
        display: "grid",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <IconWrapper icon="mdi:auto-fix" size={20} />
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "var(--font-primary)" }}>
            Brief the AI
          </Typography>
        </Box>
        {attempts?.unmetered ? (
          <StatusChip label="Not metered (staff)" tone="ai" icon="mdi:infinity" />
        ) : (
          <StatusChip
            label={
              attempts === null
                ? "Checking your attempts…"
                : `${remaining} of ${attempts.allowed} generation${
                    attempts.allowed === 1 ? "" : "s"
                  } left`
            }
            tone={remaining > 0 || attempts === null ? "info" : "warning"}
            icon="mdi:counter"
          />
        )}
      </Box>

      <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--font-secondary)" }}>
        Describe what you need built, in as much detail as the brief calls for. The AI writes the
        whole project; you cannot edit the files afterwards, so the prompt is the work. A
        generation that fails does not count against you.
      </Typography>

      {loadError && (
        <Notice tone="error" icon="mdi:cloud-alert-outline">
          We could not load your attempts just now, so the count above may be out of date. Reload
          the page before generating.
        </Notice>
      )}

      <TextField
        multiline
        minRows={4}
        maxRows={12}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_CHARS))}
        disabled={busy || locked || exhausted}
        placeholder={
          "e.g. Build a responsive pricing page with three tiers — Starter, Team and Business — " +
          "each showing a monthly price, a feature list and a call-to-action button. Highlight " +
          "the middle tier. Use semantic HTML and a single stylesheet."
        }
        helperText={`${prompt.length} / ${MAX_PROMPT_CHARS}`}
        sx={{
          "& .MuiInputBase-root": {
            fontSize: 14,
            lineHeight: 1.6,
            backgroundColor: "var(--surface-muted, var(--neutral-50))",
          },
        }}
      />

      {error && (
        <Notice tone="error" icon="mdi:alert-circle-outline">
          {error}
        </Notice>
      )}

      {exhausted && !error && (
        <Notice tone="warning" icon="mdi:lock-outline">
          You have used {attempts?.allowed} generations for this project. Run the checks on what
          you have and submit it, or ask your instructor for another attempt.
        </Notice>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() => void submit()}
          startIcon={
            <IconWrapper icon={busy ? "mdi:loading" : "mdi:creation-outline"} size={18} />
          }
          sx={{
            textTransform: "none",
            borderRadius: 2,
            backgroundColor: "var(--accent-indigo)",
            "&:hover": { backgroundColor: "var(--accent-indigo)" },
          }}
        >
          {busy ? "Writing your project…" : "Generate the project"}
        </Button>
        {busy && (
          <Typography sx={{ fontSize: 12.5, color: "var(--font-secondary)" }}>
            This takes up to a couple of minutes. You can leave this page open.
          </Typography>
        )}
      </Box>

      {history.length > 0 && (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--font-secondary)",
            }}
          >
            Your attempts
          </Typography>
          {history.map((generation, index) => (
            <AttemptRow key={generation.id} generation={generation} ordinal={index + 1} />
          ))}
        </Box>
      )}
    </Paper>
  );
}

function AttemptRow({
  generation,
  ordinal,
}: {
  generation: ProjectGeneration;
  ordinal: number;
}) {
  const live = LIVE.includes(generation.status);
  const failed = generation.status === "failed";

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid var(--border-subtle, var(--neutral-200))",
        backgroundColor: "var(--surface-muted, var(--neutral-50))",
        display: "grid",
        gap: 0.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--font-primary)" }}>
          Attempt {ordinal}
        </Typography>
        {live && <StatusChip label="Writing…" tone="info" icon="mdi:cloud-sync-outline" />}
        {generation.status === "succeeded" && (
          <StatusChip
            label={`${generation.file_count} file${generation.file_count === 1 ? "" : "s"}`}
            tone="success"
            icon="mdi:file-code-outline"
          />
        )}
        {/* "Did not count" is the important half: without it a learner reads any failure as a
            spent attempt and stops trying. */}
        {failed && (
          <StatusChip label="Failed — did not count" tone="neutral" icon="mdi:restore" />
        )}
      </Box>
      <Typography
        sx={{
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--font-primary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {generation.prompt}
      </Typography>
      {(generation.notes || generation.error) && (
        <Typography sx={{ fontSize: 12.5, color: "var(--font-secondary)" }}>
          {generation.notes || generation.error}
        </Typography>
      )}
    </Box>
  );
}

function Notice({
  tone,
  icon,
  children,
}: {
  tone: "error" | "warning";
  icon: string;
  children: React.ReactNode;
}) {
  const colour = tone === "error" ? "var(--error-500)" : "var(--warning-500)";
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        border: `1px solid color-mix(in srgb, ${colour} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${colour} 8%, var(--surface) 92%)`,
      }}
    >
      <IconWrapper icon={icon} size={18} />
      <Typography sx={{ fontSize: 13, color: "var(--font-primary)" }}>{children}</Typography>
    </Box>
  );
}
