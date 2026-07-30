"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import {
  MATERIAL_ICONS,
  formatFileSize,
  liveSessionMaterialsService,
  type LiveSessionMaterial,
} from "@/lib/services/live-session-materials.service";

/**
 * Staff-side management of a session's study materials: upload, retitle, re-describe, remove.
 *
 * Used on both the admin session page and the instructor's, because the permission decision lives
 * in the backend — a caller who may not manage this session gets a 403 from the same endpoint — so
 * there is nothing role-specific to fork here.
 *
 * Staff see `uploaded_by_name` (the real name) where a learner would see the instructor code; the
 * backend decides which one it sends, and this simply prefers the name when present.
 */
export function StudyMaterialManager({ liveClassId }: { liveClassId: number }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<LiveSessionMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<LiveSessionMaterial | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await liveSessionMaterialsService.list(liveClassId));
    } catch {
      showToast("Could not load study material", "error");
    } finally {
      setLoading(false);
    }
  }, [liveClassId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    // Seed the title from the filename so the common case is one click, while staying editable.
    setForm({ title: f.name.replace(/\.[^.]+$/, ""), description: "" });
    e.target.value = "";
  };

  const doUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const created = await liveSessionMaterialsService.upload(liveClassId, pendingFile, form);
      setItems((prev) => [...prev, created]);
      setPendingFile(null);
      setForm({ title: "", description: "" });
      showToast("Study material added", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Upload failed";
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const updated = await liveSessionMaterialsService.update(liveClassId, editing.id, form);
      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditing(null);
      showToast("Updated", "success");
    } catch {
      showToast("Could not save", "error");
    }
  };

  const remove = async (m: LiveSessionMaterial) => {
    if (!window.confirm(`Remove "${m.title}" from this session?`)) return;
    try {
      await liveSessionMaterialsService.remove(liveClassId, m.id);
      setItems((prev) => prev.filter((x) => x.id !== m.id));
      showToast("Removed", "success");
    } catch {
      showToast("Could not remove", "error");
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Study material</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:paperclip" size={16} />}
          onClick={() => fileRef.current?.click()}
        >
          Add file
        </Button>
        {/* No accept filter: the product allows any file type, and the backend refuses only
            executables. Constraining it here would silently contradict that. */}
        <input ref={fileRef} type="file" hidden onChange={pick} />
      </Stack>

      {loading ? (
        <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.82rem" }}>Loading…</Typography>
      ) : items.length === 0 ? (
        <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.82rem" }}>
          Nothing shared yet. Add slides, notes or a dataset for this session.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: "flex", alignItems: "flex-start", gap: 1.25, p: 1.25,
                border: "1px solid var(--border-default)", borderRadius: 2,
                backgroundColor: "var(--card-bg)",
              }}
            >
              <Box sx={{ mt: "1px" }}>
                <IconWrapper icon={MATERIAL_ICONS[m.file_type] ?? MATERIAL_ICONS.other} size={20} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>{m.title}</Typography>
                {m.description && (
                  <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.78rem", mt: 0.25 }}>
                    {m.description}
                  </Typography>
                )}
                <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.72rem", mt: 0.4 }}>
                  {m.uploaded_by_name || m.uploaded_by_label}
                  {" · "}
                  {new Date(m.created_at).toLocaleString(undefined, {
                    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                  })}
                  {m.file_size ? ` · ${formatFileSize(m.file_size)}` : ""}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                {m.file_url && (
                  <Tooltip title="Open">
                    <IconButton size="small" component="a" href={m.file_url} target="_blank" rel="noopener noreferrer">
                      <IconWrapper icon="mdi:open-in-new" size={16} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Edit title / description">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(m);
                      setForm({ title: m.title, description: m.description });
                    }}
                  >
                    <IconWrapper icon="mdi:pencil-outline" size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={() => remove(m)}>
                    <IconWrapper icon="mdi:trash-can-outline" size={16} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {/* Upload — title/description are captured up front so a learner never sees a bare filename. */}
      <Dialog open={Boolean(pendingFile)} onClose={() => !uploading && setPendingFile(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Add study material</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.8rem", mb: 2 }}>
            {pendingFile?.name} {pendingFile ? `· ${formatFileSize(pendingFile.size)}` : ""}
          </Typography>
          <TextField
            fullWidth label="Title" value={form.title} sx={{ mb: 2 }}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <TextField
            fullWidth multiline minRows={2} label="Description (optional)" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingFile(null)} disabled={uploading}>Cancel</Button>
          <LoadingButton variant="contained" loading={uploading} loadingText="Uploading" onClick={doUpload}>
            Upload
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Edit — title and description only; replacing a file means adding a new one, so the
          timeline keeps an honest record of what was shared when. */}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit study material</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Title" value={form.title} sx={{ mb: 2, mt: 1 }}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <TextField
            fullWidth multiline minRows={2} label="Description" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
