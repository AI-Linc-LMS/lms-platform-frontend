"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { IconWrapper } from "@/components/common/IconWrapper";
import ProjectPreview from "./ProjectPreview";
import { isEditable, languageForPath } from "@/lib/services/project-workspace.service";

/**
 * Files on the left, editor in the middle, live preview on the right.
 *
 * Shared by the author writing a brief and the learner building against it, so the two views of
 * the same project cannot drift: what the author sees rendering as they type is what the learner
 * will see.
 *
 * The preview is a sandboxed iframe assembled in memory — no bundler, no server, no round trip.
 * That is what makes it update as you type, and it is also why it is free: running a real Node
 * server in the browser needs a commercial licence, and a sandboxed iframe does not.
 */

export interface ProjectFileEditorProps {
  files: Record<string, string>;
  onChange: (files: Record<string, string>) => void;
  /** Globs the caller may edit. Empty means everything. */
  editablePaths?: string[];
  /** Render the live preview pane. */
  showPreview?: boolean;
  /** Entry document for the preview. */
  entry?: string;
  /** Nothing can be edited or added — a submitted attempt, or a read-only review. */
  readOnly?: boolean;
  /** Author-only: allow adding and removing files. */
  allowFileManagement?: boolean;
  height?: number | string;
  /** Shown above the tree, e.g. "Starter files" or "Hidden grader". */
  label?: string;
  emptyHint?: string;
}

export default function ProjectFileEditor({
  files,
  onChange,
  editablePaths = [],
  showPreview = false,
  entry = "index.html",
  readOnly = false,
  allowFileManagement = false,
  height = 520,
  label,
  emptyHint = "No files yet.",
}: ProjectFileEditorProps) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const [activePath, setActivePath] = useState<string>(paths[0] ?? "");
  const [adding, setAdding] = useState(false);
  const [newPath, setNewPath] = useState("");

  // Keep the selection valid when files appear or disappear underneath it.
  useEffect(() => {
    if (paths.length === 0) {
      if (activePath) setActivePath("");
      return;
    }
    if (!paths.includes(activePath)) setActivePath(paths[0]);
  }, [paths, activePath]);

  const activeEditable =
    !readOnly && (editablePaths.length === 0 || isEditable(activePath, editablePaths));

  const setFile = (path: string, value: string) => onChange({ ...files, [path]: value });

  const addFile = () => {
    const path = newPath.trim().replace(/^\.?\//, "");
    if (!path || files[path] !== undefined) {
      setAdding(false);
      setNewPath("");
      return;
    }
    onChange({ ...files, [path]: "" });
    setActivePath(path);
    setAdding(false);
    setNewPath("");
  };

  const removeFile = (path: string) => {
    const next = { ...files };
    delete next[path];
    onChange(next);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: "grid",
        gridTemplateColumns: showPreview
          ? { xs: "1fr", md: "200px minmax(0, 1fr)", lg: "200px minmax(0, 1fr) minmax(0, 1fr)" }
          : { xs: "1fr", md: "200px minmax(0, 1fr)" },
        height,
        minHeight: 0,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid var(--border-subtle, var(--neutral-200))",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Files */}
      <Box
        sx={{
          borderRight: { md: "1px solid var(--border-subtle, var(--neutral-200))" },
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border-subtle, var(--neutral-200))",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "var(--font-secondary)",
            }}
          >
            {label ?? "Files"}
          </Typography>
          {allowFileManagement && !readOnly && (
            <Tooltip title="Add a file">
              <IconButton size="small" onClick={() => setAdding(true)} sx={{ p: 0.25 }}>
                <IconWrapper icon="mdi:plus" size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {paths.length === 0 && !adding && (
            <Typography sx={{ p: 1.5, fontSize: 12, color: "var(--font-secondary)" }}>
              {emptyHint}
            </Typography>
          )}
          {paths.map((path) => {
            const locked = editablePaths.length > 0 && !isEditable(path, editablePaths);
            const active = path === activePath;
            return (
              <Box
                key={path}
                onClick={() => setActivePath(path)}
                sx={{
                  px: 1.5,
                  py: 0.85,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontFamily: "var(--font-mono)",
                  color: active ? "var(--accent-indigo)" : "var(--font-primary)",
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--accent-indigo) 10%, transparent)"
                    : "transparent",
                  borderLeft: active
                    ? "2px solid var(--accent-indigo)"
                    : "2px solid transparent",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                  },
                }}
              >
                <IconWrapper
                  icon={locked ? "mdi:lock-outline" : "mdi:file-code-outline"}
                  size={14}
                />
                <Box component="span" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {path}
                </Box>
                {allowFileManagement && !readOnly && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(path);
                    }}
                    sx={{ p: 0.15, opacity: 0.5, "&:hover": { opacity: 1 } }}
                  >
                    <IconWrapper icon="mdi:close" size={13} />
                  </IconButton>
                )}
              </Box>
            );
          })}

          {adding && (
            <Box sx={{ p: 1 }}>
              <TextField
                size="small"
                autoFocus
                fullWidth
                placeholder="index.html"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onBlur={addFile}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addFile();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewPath("");
                  }
                }}
                inputProps={{ style: { fontFamily: "var(--font-mono)", fontSize: 12 } }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Editor */}
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: "1px solid var(--border-subtle, var(--neutral-200))",
          }}
        >
          <Typography
            sx={{ fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--font-primary)" }}
          >
            {activePath || "—"}
          </Typography>
          {activePath && !activeEditable && (
            <Typography sx={{ fontSize: 11, color: "var(--font-secondary)" }}>
              read-only
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {activePath ? (
            <CodeEditor
              value={files[activePath] ?? ""}
              onChange={(v) => activeEditable && setFile(activePath, v ?? "")}
              language={languageForPath(activePath)}
              height="100%"
              readOnly={!activeEditable}
              allowClipboard
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--font-secondary)",
                fontSize: 13,
              }}
            >
              {allowFileManagement ? (
                <Button
                  startIcon={<IconWrapper icon="mdi:plus" size={16} />}
                  onClick={() => setAdding(true)}
                  sx={{ textTransform: "none" }}
                >
                  Add the first file
                </Button>
              ) : (
                emptyHint
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Preview */}
      {showPreview && (
        <Box
          sx={{
            display: { xs: "none", lg: "flex" },
            flexDirection: "column",
            minHeight: 0,
            borderLeft: "1px solid var(--border-subtle, var(--neutral-200))",
          }}
        >
          <ProjectPreview files={files} entry={entry} />
        </Box>
      )}
    </Paper>
  );
}
