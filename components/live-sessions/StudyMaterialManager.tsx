"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Menu, MenuItem, Stack, TextField, Tooltip, Typography,
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
import { MaterialViewerDialog } from "./MaterialViewerDialog";

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
/** One sitting of a recurring series, as the date picker needs it. */
export interface MaterialOccurrenceOption {
  id: number;
  occurrence_datetime: string;
  topic_name?: string | null;
}

/** "12 Sep · Recursion" — enough to pick the right week out of forty. */
function occurrenceLabel(o: MaterialOccurrenceOption): string {
  const when = new Date(o.occurrence_datetime).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
  return o.topic_name ? `${when} · ${o.topic_name}` : when;
}

const SERIES_WIDE = "";

export function StudyMaterialManager({
  liveClassId,
  occurrences,
}: {
  liveClassId: number;
  /**
   * The series' dates. Pass them for a recurring session and each file can be filed against the
   * class it is actually for; omit them (a one-off session) and the whole date dimension stays
   * out of the UI. A series used to be a single shelf, so week 3's slides showed under week 1.
   */
  occurrences?: MaterialOccurrenceOption[];
}) {
  const dated = (occurrences ?? []).length > 0;
  const { showToast } = useToast();
  const [items, setItems] = useState<LiveSessionMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<LiveSessionMaterial | null>(null);
  const [preview, setPreview] = useState<LiveSessionMaterial | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  // "" means the file spans the whole series. Kept as a string so it can drive a MUI Select
  // directly; a numeric 0 would be indistinguishable from "no date chosen".
  const [occChoice, setOccChoice] = useState<string>(SERIES_WIDE);
  // The chip's "move to" menu: which file it is open for, and the element it hangs off.
  const [refileFor, setRefileFor] = useState<{ anchor: HTMLElement; material: LiveSessionMaterial } | null>(null);
  const [refilingId, setRefilingId] = useState<number | null>(null);
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
    // Default to the sitting a trainer is most likely uploading for: the next one still to run,
    // or the most recent one if the series has finished. Never silently series-wide, which is
    // what every file was before dates existed and is why they all piled up on every week.
    setOccChoice(defaultOccurrenceId());
    e.target.value = "";
  };

  /** The next date still to run, else the last one that ran. Empty when the session is a one-off. */
  const defaultOccurrenceId = useCallback((): string => {
    const list = occurrences ?? [];
    if (list.length === 0) return SERIES_WIDE;
    const now = Date.now();
    const sorted = [...list].sort(
      (a, b) => +new Date(a.occurrence_datetime) - +new Date(b.occurrence_datetime)
    );
    const next = sorted.find((o) => +new Date(o.occurrence_datetime) >= now);
    return String((next ?? sorted[sorted.length - 1]).id);
  }, [occurrences]);

  const sortedDates = useMemo(
    () => [...(occurrences ?? [])].sort(
      (a, b) => +new Date(a.occurrence_datetime) - +new Date(b.occurrence_datetime)
    ),
    [occurrences]
  );

  /**
   * The list, in sections. A recurring series' flat list hid the problem this feature solves:
   * fifty dates' files interleaved by upload time, with the legacy series-wide pile -- everything
   * uploaded before per-date filing existed -- indistinguishable from deliberate choices. "All
   * classes" leads because it is the pile that needs attention; dates follow in class order.
   */
  const grouped = useMemo(() => {
    if (!dated) return [{ key: "flat", label: "", hint: "", files: items }];
    const byOcc = new Map<number | null, LiveSessionMaterial[]>();
    for (const m of items) {
      const k = m.occurrence_id ?? null;
      const list = byOcc.get(k) ?? [];
      list.push(m);
      byOcc.set(k, list);
    }
    const sections: { key: string; label: string; hint: string; files: LiveSessionMaterial[] }[] = [];
    const everywhere = byOcc.get(null) ?? [];
    if (everywhere.length) {
      sections.push({
        key: "all",
        label: "All classes",
        hint: "Shown in every class of this series. Click a file's chip to move it to its week.",
        files: everywhere,
      });
    }
    const known = new Set<number>();
    for (const o of sortedDates) {
      known.add(o.id);
      const files = byOcc.get(o.id);
      if (files?.length) sections.push({ key: String(o.id), label: occurrenceLabel(o), hint: "", files });
    }
    // A file filed against a date this payload no longer lists (a since-cancelled sitting, an
    // older cache) must stay visible -- hiding it would read as data loss.
    const orphans = items.filter((m) => m.occurrence_id != null && !known.has(m.occurrence_id));
    if (orphans.length) sections.push({ key: "other", label: "Other dates", hint: "", files: orphans });
    return sections;
  }, [dated, items, sortedDates]);

  const doUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const created = await liveSessionMaterialsService.upload(liveClassId, pendingFile, {
        ...form,
        occurrenceId: occChoice ? Number(occChoice) : null,
      });
      setItems((prev) => [...prev, created]);
      setPendingFile(null);
      setForm({ title: "", description: "" });
      setOccChoice(SERIES_WIDE);
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
      const updated = await liveSessionMaterialsService.update(liveClassId, editing.id, {
        ...form,
        // Sent on every save so a file uploaded before dates existed can be moved onto the week
        // it belongs to -- and moved back to spanning the series.
        ...(dated ? { occurrence_id: occChoice ? Number(occChoice) : null } : {}),
      });
      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditing(null);
      showToast("Updated", "success");
    } catch {
      showToast("Could not save", "error");
    }
  };

  /**
   * Move one file to a date (or back to All classes) straight from its chip. This is the remedy
   * for everything uploaded before per-date filing existed: those files are all series-wide, so
   * they still show on every date, and fixing that through the edit dialog was one dialog per
   * file. One click here, and the row moves to its section.
   */
  const refile = async (m: LiveSessionMaterial, occId: number | null) => {
    setRefileFor(null);
    if ((m.occurrence_id ?? null) === occId) return;
    setRefilingId(m.id);
    try {
      const updated = await liveSessionMaterialsService.update(liveClassId, m.id, {
        occurrence_id: occId,
      });
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      const target = occId ? (occurrences ?? []).find((o) => o.id === occId) : null;
      showToast(target ? `Moved to ${occurrenceLabel(target)}` : "Moved to All classes", "success");
    } catch {
      showToast("Could not move the file", "error");
    } finally {
      setRefilingId(null);
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
        <Stack spacing={1.75}>
          {grouped.map((g) => (
            <Box key={g.key}>
              {dated && (
                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.75, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", letterSpacing: 0.2,
                                    textTransform: "uppercase", color: "var(--font-secondary)" }}>
                    {g.label}
                  </Typography>
                  {g.hint && (
                    <Typography sx={{ fontSize: "0.74rem", color: "var(--font-tertiary, var(--font-secondary))" }}>
                      {g.hint}
                    </Typography>
                  )}
                </Stack>
              )}
              <Stack spacing={1}>
                {g.files.map((m) => (
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
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>{m.title}</Typography>
                  {/* Which class this is for. Shown only on a recurring series -- on a one-off
                      session every file is for that session and the chip would be noise. */}
                  {dated && (
                    <Tooltip title="Move to another class">
                      <Chip
                        size="small"
                        disabled={refilingId === m.id}
                        onClick={(e) => setRefileFor({ anchor: e.currentTarget, material: m })}
                        onDelete={(e: React.MouseEvent<HTMLElement>) =>
                          setRefileFor({ anchor: e.currentTarget, material: m })
                        }
                        deleteIcon={<IconWrapper icon="mdi:chevron-down" size={14} />}
                        label={
                          m.occurrence_datetime
                            ? new Date(m.occurrence_datetime).toLocaleDateString(undefined, {
                                day: "numeric", month: "short",
                              })
                            : "All classes"
                        }
                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                      />
                    </Tooltip>
                  )}
                </Stack>
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
                  <Tooltip title="Preview">
                    <IconButton size="small" onClick={() => setPreview(m)}>
                      <IconWrapper icon="mdi:eye-outline" size={16} />
                    </IconButton>
                  </Tooltip>
                )}
                {/* Kept as the deliberate escape hatch, now second so Preview reads as primary. */}
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
                      setOccChoice(m.occurrence_id ? String(m.occurrence_id) : SERIES_WIDE);
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
            </Box>
          ))}
        </Stack>
      )}

      {/* One menu for every chip: which file it moves is carried in refileFor, so fifty rows do
          not each mount their own. Lists the whole series so a legacy file can go to ANY week. */}
      <Menu
        anchorEl={refileFor?.anchor ?? null}
        open={Boolean(refileFor)}
        onClose={() => setRefileFor(null)}
      >
        <MenuItem
          selected={refileFor != null && refileFor.material.occurrence_id == null}
          onClick={() => refileFor && void refile(refileFor.material, null)}
        >
          All classes
        </MenuItem>
        {sortedDates.map((o) => (
          <MenuItem
            key={o.id}
            selected={refileFor?.material.occurrence_id === o.id}
            onClick={() => refileFor && void refile(refileFor.material, o.id)}
          >
            {occurrenceLabel(o)}
          </MenuItem>
        ))}
      </Menu>

      {/* Rendered here, never inside a row: MUI portals it to body, so it escapes the instructor
          page's own maxWidth="sm" materials dialog. */}
      <MaterialViewerDialog material={preview} onClose={() => setPreview(null)} />

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
          {dated && (
            <TextField
              select fullWidth label="Which class is this for?" value={occChoice} sx={{ mb: 2 }}
              onChange={(e) => setOccChoice(e.target.value)}
              helperText="Choose &quot;All classes&quot; for material that spans the whole series, like a syllabus."
            >
              <MenuItem value={SERIES_WIDE}>All classes</MenuItem>
              {[...(occurrences ?? [])]
                .sort((a, b) => +new Date(a.occurrence_datetime) - +new Date(b.occurrence_datetime))
                .map((o) => (
                  <MenuItem key={o.id} value={String(o.id)}>{occurrenceLabel(o)}</MenuItem>
                ))}
            </TextField>
          )}
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
          {dated && (
            <TextField
              select fullWidth label="Which class is this for?" value={occChoice} sx={{ mb: 2 }}
              onChange={(e) => setOccChoice(e.target.value)}
              helperText="Choose &quot;All classes&quot; for material that spans the whole series, like a syllabus."
            >
              <MenuItem value={SERIES_WIDE}>All classes</MenuItem>
              {[...(occurrences ?? [])]
                .sort((a, b) => +new Date(a.occurrence_datetime) - +new Date(b.occurrence_datetime))
                .map((o) => (
                  <MenuItem key={o.id} value={String(o.id)}>{occurrenceLabel(o)}</MenuItem>
                ))}
            </TextField>
          )}
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
