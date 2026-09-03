"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Divider, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import ProjectFileTree from "./ProjectFileTree";
import ProjectPreview from "./ProjectPreview";
import ProjectRunPanel from "./ProjectRunPanel";
import {
  getWorkspace, isEditable, isPreviewable, languageForPath, runWorkspace,
  RunnerUnavailableError, saveWorkspace,
  type ProjectRun, type ProjectWorkspace as Workspace,
} from "@/lib/services/project-workspace.service";

/**
 * The learner's project workspace: files on the left, editor in the middle, preview or checks on
 * the right.
 *
 * Autosave is the part that has to be right. A learner works in here for hours, so the rules are:
 * never let a save in flight drop edits made while it was in flight, never save a file the brief
 * marked read-only, and always show plainly whether the current state has reached the server. A
 * silent failure here loses work somebody spent an evening on.
 */

const AUTOSAVE_DEBOUNCE_MS = 1500;

type SaveState = "idle" | "saving" | "saved" | "error";

interface ProjectWorkspaceProps {
  workspaceId: number;
  /** Read-only once the attempt is submitted; the brief and the work stay visible. */
  locked?: boolean;
}

export default function ProjectWorkspace({ workspaceId, locked = false }: ProjectWorkspaceProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activePath, setActivePath] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [run, setRun] = useState<ProjectRun | null>(null);
  const [running, setRunning] = useState(false);
  const [runnerDown, setRunnerDown] = useState(false);

  // The files as the server last confirmed them. Compared against `files` to decide whether a
  // save is still outstanding, so a save that lands while the learner keeps typing does not mark
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
        const first =
          Object.keys(initial).find((p) => isEditable(p, ws.template.editable_paths)) ??
          Object.keys(initial)[0] ?? "";
        setActivePath(first);
      })
      .catch(() => {
        if (!cancelled) setLoadError("We couldn't open this project. Please refresh and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const flush = useCallback(async () => {
    if (inFlight.current || locked) return;
    const snapshot = JSON.stringify(files);
    if (snapshot === confirmed.current) return;
    inFlight.current = true;
    setSaveState("saving");
    try {
      await saveWorkspace(workspaceId, files);
      // Compare against the snapshot we SENT, not the current state: anything typed while the
      // request was in flight is still unsaved and must remain so.
      confirmed.current = snapshot;
      setSaveState(JSON.stringify(files) === snapshot ? "saved" : "idle");
    } catch {
      setSaveState("error");
    } finally {
      inFlight.current = false;
    }
  }, [files, workspaceId, locked]);

  useEffect(() => {
    if (locked || !workspace) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [files, flush, locked, workspace]);

  // A refresh or a closed tab mid-edit would otherwise lose the last debounce window.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(files) !== confirmed.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [files]);

  const editable = useMemo(
    () => (workspace ? isEditable(activePath, workspace.template.editable_paths) : false),
    [workspace, activePath]
  );

  const onEdit = useCallback(
    (value: string | undefined) => {
      if (!editable || locked) return;
      setFiles((prev) => ({ ...prev, [activePath]: value ?? "" }));
    },
    [activePath, editable, locked]
  );

  const onRun = useCallback(async () => {
    setRunning(true);
    setRunnerDown(false);
    try {
      await flush(); // grade what the learner can see, not a stale snapshot
      setRun(await runWorkspace(workspaceId));
    } catch (err) {
      if (err instanceof RunnerUnavailableError) {
        setRunnerDown(true);
        setRun(err.run);
      } else {
        setRunnerDown(true);
      }
    } finally {
      setRunning(false);
    }
  }, [flush, workspaceId]);

  if (loadError) return <Alert severity="error" sx={{ m: 2 }}>{loadError}</Alert>;
  if (!workspace) return <Box sx={{ p: 2 }}><Typography>Opening your project&hellip;</Typography></Box>;

  const { template } = workspace;
  const showPreview = isPreviewable(template.runtime);
  const canRun = template.tier === "auto" && !locked;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25,
                 borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{template.title}</Typography>
        <Chip size="small" variant="outlined" label={`${template.max_marks} marks`} />
        <Box sx={{ flex: 1 }} />
        <SaveIndicator state={saveState} locked={locked} />
        {canRun && (
          <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}
                  onClick={onRun} disabled={running}>
            {running ? "Running" : "Run checks"}
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Box sx={{ width: 200, flexShrink: 0 }}>
          <ProjectFileTree
            files={files}
            editablePaths={template.editable_paths}
            activePath={activePath}
            onSelect={setActivePath}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {!editable && activePath && (
            <Alert severity="info" sx={{ borderRadius: 0, py: 0.25 }}>
              This file comes with the brief &mdash; you can read it, but changes won&rsquo;t be kept.
            </Alert>
          )}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <CodeEditor
              value={files[activePath] ?? ""}
              onChange={onEdit}
              language={languageForPath(activePath)}
              height="100%"
              readOnly={!editable || locked}
              allowClipboard
            />
          </Box>
        </Box>

        <Box sx={{ width: "38%", minWidth: 320, borderLeft: 1, borderColor: "divider",
                   display: "flex", flexDirection: "column", minHeight: 0 }}>
          {showPreview && (
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ProjectPreview files={files} />
            </Box>
          )}
          {showPreview && canRun && <Divider />}
          {canRun && (
            <Box sx={{ flex: showPreview ? "0 0 auto" : 1, minHeight: 0, overflow: "auto" }}>
              <ProjectRunPanel run={run} running={running} unavailable={runnerDown} />
            </Box>
          )}
          {!showPreview && !canRun && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                This project is reviewed by your instructor against the brief.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function SaveIndicator({ state, locked }: { state: SaveState; locked: boolean }) {
  if (locked) return <Chip size="small" label="Submitted" />;
  const map: Record<SaveState, { label: string; color?: "error" }> = {
    idle: { label: "Unsaved changes" },
    saving: { label: "Saving…" },
    saved: { label: "All changes saved" },
    error: { label: "Couldn't save — retrying", color: "error" },
  };
  const { label, color } = map[state];
  return <Chip size="small" variant="outlined" color={color} label={label} />;
}
