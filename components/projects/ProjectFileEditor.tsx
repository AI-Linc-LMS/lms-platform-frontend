"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { IconWrapper } from "@/components/common/IconWrapper";
import ProjectPreview from "./ProjectPreview";
import { isEditable, languageForPath } from "@/lib/services/project-workspace.service";
import {
  planUpload,
  readUploadEntries,
  type UploadPlan,
} from "@/lib/services/project-upload";

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
  /**
   * Allow adding and removing files.
   *
   * Not author-only, which is how it was first written and what left a learner stuck: a brief
   * whose starter is one `App.jsx` cannot hold a React app, and without this the learner had no
   * way to make the second file. Whoever is editing the project needs it.
   */
  allowFileManagement?: boolean;
  /** Offer "upload files" and "upload a folder". Defaults to whatever file management allows. */
  allowUpload?: boolean;
  /** Told what an upload did, so the caller can show what was refused and why. */
  onUploadReport?: (report: UploadPlan) => void;
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
  allowUpload,
  onUploadReport,
  height = 520,
  label,
  emptyHint = "No files yet.",
}: ProjectFileEditorProps) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const [activePath, setActivePath] = useState<string>(paths[0] ?? "");
  const [adding, setAdding] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const filePicker = useRef<HTMLInputElement>(null);
  const folderPicker = useRef<HTMLInputElement>(null);
  const uploadAllowed = (allowUpload ?? allowFileManagement) && !readOnly;

  // `webkitdirectory` is not in React's attribute list, and spreading it as a prop trips both the
  // type checker and a DOM warning. Setting it on the node is the same thing without either.
  useEffect(() => {
    const node = folderPicker.current;
    if (!node) return;
    node.setAttribute("webkitdirectory", "");
    node.setAttribute("directory", "");
  }, [uploadAllowed]);

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

  /** Merge a pick into the workspace, then say what landed and what did not. */
  const handlePicked = async (picked: FileList | null, fromDirectory: boolean) => {
    if (!picked || picked.length === 0) return;
    setUploading(true);
    try {
      const { entries, unreadable } = await readUploadEntries(Array.from(picked));
      const plan = planUpload(files, entries, { editablePaths, fromDirectory });
      onChange(plan.files);
      // Open something the learner just uploaded, so the upload is visibly real.
      const landed = plan.added[0] ?? plan.replaced[0];
      if (landed) setActivePath(landed);
      onUploadReport?.({ ...plan, skipped: [...unreadable, ...plan.skipped] });
    } finally {
      setUploading(false);
      if (filePicker.current) filePicker.current.value = "";
      if (folderPicker.current) folderPicker.current.value = "";
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: "grid",
        gridTemplateColumns: showPreview
          ? {
              xs: "1fr",
              md: "180px minmax(0, 1fr)",
              // The preview gets slightly MORE room than the editor: it now renders real device
              // widths, and a cramped pane scales a desktop layout down until it is unreadable.
              lg: "180px minmax(0, 1fr) minmax(0, 1.15fr)",
            }
          : { xs: "1fr", md: "200px minmax(0, 1fr)" },
        height: { xs: "auto", lg: height },
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            {allowFileManagement && !readOnly && (
              <Tooltip title="Add a file">
                <IconButton size="small" onClick={() => setAdding(true)} sx={{ p: 0.25 }}>
                  <IconWrapper icon="mdi:plus" size={16} />
                </IconButton>
              </Tooltip>
            )}
            {uploadAllowed && (
              <>
                <Tooltip title="Upload files from your computer">
                  <IconButton
                    size="small"
                    disabled={uploading}
                    onClick={() => filePicker.current?.click()}
                    sx={{ p: 0.25 }}
                  >
                    <IconWrapper icon="mdi:file-upload-outline" size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Upload a project folder (build output and node_modules are left out)">
                  <IconButton
                    size="small"
                    disabled={uploading}
                    onClick={() => folderPicker.current?.click()}
                    sx={{ p: 0.25 }}
                  >
                    <IconWrapper icon="mdi:folder-upload-outline" size={16} />
                  </IconButton>
                </Tooltip>
                <Box
                  component="input"
                  ref={filePicker}
                  type="file"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    void handlePicked(e.target.files, false)
                  }
                  sx={{ display: "none" }}
                />
                <Box
                  component="input"
                  ref={folderPicker}
                  type="file"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    void handlePicked(e.target.files, true)
                  }
                  sx={{ display: "none" }}
                />
              </>
            )}
          </Box>
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
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                  <Button
                    startIcon={<IconWrapper icon="mdi:plus" size={16} />}
                    onClick={() => setAdding(true)}
                    sx={{ textTransform: "none" }}
                  >
                    Add the first file
                  </Button>
                  {uploadAllowed && (
                    <Button
                      startIcon={<IconWrapper icon="mdi:folder-upload-outline" size={16} />}
                      onClick={() => folderPicker.current?.click()}
                      sx={{ textTransform: "none" }}
                    >
                      Upload a folder
                    </Button>
                  )}
                </Box>
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
            // Below lg the preview stacks under the editor rather than disappearing. Hiding it
            // outright meant an author on a laptop had no preview at all, on the one pane whose
            // job is to show what the learner sees.
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: 320, lg: 0 },
            gridColumn: { xs: "1 / -1", lg: "auto" },
            borderLeft: { lg: "1px solid var(--border-subtle, var(--neutral-200))" },
            borderTop: {
              xs: "1px solid var(--border-subtle, var(--neutral-200))",
              lg: "none",
            },
          }}
        >
          <ProjectPreview files={files} entry={entry} />
        </Box>
      )}
    </Paper>
  );
}
