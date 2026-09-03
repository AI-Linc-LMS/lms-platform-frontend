"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip } from "@/components/admin/assessment/shared";
import ProjectFileEditor from "./ProjectFileEditor";
import ProjectRunPanel from "./ProjectRunPanel";
import {
  AttemptClosedError,
  RunnerUnavailableError,
  getWorkspace,
  isPreviewable,
  runWorkspace,
  saveWorkspace,
  type ProjectRun,
  type ProjectWorkspace as Workspace,
} from "@/lib/services/project-workspace.service";

/**
 * The learner's project workspace: the brief, their files, a live preview, and the checks.
 *
 * Autosave is the part that has to be right. A learner works in here across days, so the rules
 * are: never let a save in flight drop edits made while it was in flight, never claim "saved" for
 * a file the server rejected, and always show plainly whether the current state has reached the
 * server. A silent failure here loses work somebody spent an evening on.
 */

const AUTOSAVE_DEBOUNCE_MS = 1500;

type SaveState = "idle" | "saving" | "saved" | "error" | "closed";

interface ProjectWorkspaceProps {
  workspaceId: number;
  /** Read-only once the attempt is submitted; the brief and the work stay visible. */
  locked?: boolean;
}

export default function ProjectWorkspace({ workspaceId, locked = false }: ProjectWorkspaceProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [rejected, setRejected] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [run, setRun] = useState<ProjectRun | null>(null);
  const [running, setRunning] = useState(false);
  const [runnerDown, setRunnerDown] = useState(false);

  // The files as the server last confirmed them, compared against `files` to decide whether a
  // save is still outstanding. Without this, a save landing while the learner keeps typing marks
  // the newer edits as saved.
  const confirmed = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getWorkspace(workspaceId)
      .then((ws) => {
        if (cancelled) return;
        setWorkspace(ws);
        const initial = Object.keys(ws.files || {}).length ? ws.files : ws.template.starter_files;
        setFiles(initial);
        confirmed.current = JSON.stringify(initial);
        setRun(ws.latest_run);
      })
      .catch(() => !cancelled && setLoadError("This project could not be opened."));
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const flush = useCallback(async () => {
    if (inFlight.current || locked) return;
    const snapshot = files;
    const serialised = JSON.stringify(snapshot);
    if (serialised === confirmed.current) return;

    inFlight.current = true;
    setSaveState("saving");
    try {
      const result = await saveWorkspace(workspaceId, snapshot);
      // Confirm the snapshot that was SENT, not the current state: edits made while this request
      // was in flight are still unsaved and must stay that way.
      confirmed.current = serialised;
      setRejected(result.rejected_paths ?? []);
      setSaveState(JSON.stringify(files) === serialised ? "saved" : "idle");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setSaveState(status === 409 ? "closed" : "error");
    } finally {
      inFlight.current = false;
    }
  }, [files, locked, workspaceId]);

  useEffect(() => {
    if (locked || !workspace) return;
    if (JSON.stringify(files) === confirmed.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [files, flush, locked, workspace]);

  // A learner who closes the tab mid-thought should not lose the last 1.5 seconds of typing.
  useEffect(() => {
    const onHide = () => {
      if (JSON.stringify(files) !== confirmed.current) void flush();
    };
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [files, flush]);

  const handleRun = async () => {
    if (!workspace || locked) return;
    await flush();
    setRunning(true);
    setRunnerDown(false);
    try {
      setRun(await runWorkspace(workspaceId));
    } catch (err) {
      if (err instanceof RunnerUnavailableError) {
        setRunnerDown(true);
        setRun(err.run);
      } else if (err instanceof AttemptClosedError) {
        setSaveState("closed");
      }
    } finally {
      setRunning(false);
    }
  };

  const dirty = useMemo(
    () => Boolean(workspace) && JSON.stringify(files) !== confirmed.current,
    [files, workspace]
  );

  if (loadError) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, backgroundColor: "var(--surface)" }}>
        <Typography sx={{ color: "var(--error-500)" }}>{loadError}</Typography>
      </Paper>
    );
  }
  if (!workspace) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, backgroundColor: "var(--surface)" }}>
        <Typography sx={{ color: "var(--font-secondary)" }}>Opening your project…</Typography>
      </Paper>
    );
  }

  const { template } = workspace;
  const gradeable = template.tier === "auto";

  const saveChip = () => {
    if (locked) return <StatusChip label="Submitted" tone="neutral" icon="mdi:lock-outline" />;
    if (saveState === "closed")
      return <StatusChip label="Attempt closed" tone="warning" icon="mdi:lock-clock" />;
    if (saveState === "error")
      return <StatusChip label="Not saved — retrying" tone="error" icon="mdi:cloud-alert-outline" />;
    if (saveState === "saving")
      return <StatusChip label="Saving…" tone="info" icon="mdi:cloud-sync-outline" />;
    if (dirty) return <StatusChip label="Unsaved changes" tone="warning" icon="mdi:circle-medium" />;
    return <StatusChip label="Saved" tone="success" icon="mdi:cloud-check-outline" />;
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {/* Brief */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: "1px solid var(--border-subtle, var(--neutral-200))",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: "var(--font-primary)" }}>
              {template.title}
            </Typography>
            <StatusChip
              label={`${template.max_marks} marks`}
              tone="info"
              icon="mdi:star-outline"
            />
            {!gradeable && (
              <StatusChip label="Reviewed by a person" tone="ai" icon="mdi:account-eye-outline" />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {saveChip()}
            {gradeable && !locked && (
              <Button
                variant="contained"
                disabled={running}
                onClick={handleRun}
                startIcon={<IconWrapper icon="mdi:play" size={18} />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  backgroundColor: "var(--accent-indigo)",
                  "&:hover": { backgroundColor: "var(--accent-indigo)" },
                }}
              >
                {running ? "Running checks…" : "Run checks"}
              </Button>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            fontSize: 14,
            lineHeight: 1.65,
            color: "var(--font-primary)",
            "& p": { my: 0.75 },
            "& code": {
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              px: 0.5,
              borderRadius: 0.5,
              backgroundColor: "var(--surface-muted, var(--neutral-100))",
            },
          }}
          dangerouslySetInnerHTML={{ __html: template.brief_html || "" }}
        />
      </Paper>

      {rejected.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--warning-500) 8%, var(--surface) 92%)",
          }}
        >
          <IconWrapper icon="mdi:lock-outline" size={18} />
          <Typography sx={{ fontSize: 13 }}>
            The brief keeps {rejected.join(", ")} read-only, so changes there were not saved.
          </Typography>
        </Paper>
      )}

      <ProjectFileEditor
        files={files}
        onChange={setFiles}
        editablePaths={template.editable_paths}
        showPreview={isPreviewable(template.runtime)}
        readOnly={locked || saveState === "closed"}
        height={620}
        label="Your files"
      />

      {gradeable && (
        <ProjectRunPanel run={run} running={running} runnerDown={runnerDown} />
      )}
    </Box>
  );
}
