"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";
import { PANEL_BORDER, PANEL_SHADOW, PROFILE, TILE_GRADIENT } from "../theme/profileTokens";
import type { ResumeDocumentSummary } from "@/lib/services/resumeDocuments.service";
import { MAX_RESUME_DOCUMENTS } from "@/lib/services/resumeDocuments.service";

/**
 * The resumes a learner has saved, in the builder, where they can be opened again.
 *
 * Before this, saving produced a PDF on the profile page: it could be viewed and downloaded, but
 * never reopened, so every edit after the first meant retyping the resume. These rows open back
 * into the builder with their content, template and section arrangement intact.
 */

/** How many rows show before the list asks to be expanded. Three is a panel; twenty is a page. */
const COLLAPSED_ROWS = 3;

export interface SavedResumesPanelProps {
  documents: ResumeDocumentSummary[];
  loading: boolean;
  /** The list could not be fetched. Distinct from "there are none" - see the empty state below. */
  loadError?: boolean;
  onRetry?: () => void;
  /** The document currently loaded in the builder, so a row can say "you are editing this". */
  openId: number | null;
  /** True while one row is mid-request; that row shows it and its actions are unavailable. */
  busyId: number | null;
  onOpen: (id: number) => void;
  onRename: (id: number, name: string) => Promise<void> | void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => Promise<void> | void;
  /** Readable name for a template key, so the panel never owns a second copy of that map. */
  templateLabel: (template: string) => string;
}

/** "2 days ago" without pulling a date library into the builder's bundle. */
export function formatEdited(iso: string, t: (k: string, o?: Record<string, unknown>) => string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return t("savedResumes.editedJustNow", { defaultValue: "Just now" });
  if (minutes < 60) return t("savedResumes.editedMinutes", { count: minutes, defaultValue: `${minutes}m ago` });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("savedResumes.editedHours", { count: hours, defaultValue: `${hours}h ago` });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("savedResumes.editedDays", { count: days, defaultValue: `${days}d ago` });
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const META_CHIP = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.4,
  fontSize: "0.72rem",
  fontWeight: 700,
  color: PROFILE.inkFaint,
  whiteSpace: "nowrap" as const,
  // 12px is the floor on a phone: 0.72rem would read at 11.5px.
  [PHONE]: { fontSize: "0.75rem" },
};

/** 44px on a phone, the comfortable 34px the rest of this toolbar uses everywhere else. */
const ICON_ACTION = {
  width: 34,
  height: 34,
  color: PROFILE.inkFaint,
  "&:hover": { color: PROFILE.violet, backgroundColor: PROFILE.violetSoft },
  [PHONE]: { width: 44, height: 44 },
};

export function SavedResumesPanel({
  documents,
  loading,
  loadError = false,
  onRetry,
  openId,
  busyId,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  templateLabel,
}: SavedResumesPanelProps) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState<ResumeDocumentSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleting, setDeleting] = useState<ResumeDocumentSummary | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const shown = expanded ? documents : documents.slice(0, COLLAPSED_ROWS);

  const startRename = (doc: ResumeDocumentSummary) => {
    setRenaming(doc);
    setRenameValue(doc.name);
  };

  const commitRename = async () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name || name === renaming.name) {
      setRenaming(null);
      return;
    }
    setRenameBusy(true);
    try {
      await onRename(renaming.id, name);
      setRenaming(null);
    } finally {
      setRenameBusy(false);
    }
  };

  const commitDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await onDelete(deleting.id);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Paper
      elevation={0}
      data-testid="saved-resumes-panel"
      sx={{
        p: { xs: 1.75, sm: 2 },
        mb: 1.5,
        border: PANEL_BORDER,
        borderRadius: 4,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: documents.length || loading ? 1.5 : 0.75 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 2,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: TILE_GRADIENT,
          }}
        >
          <IconWrapper icon="mdi:folder-open-outline" size={17} />
        </Box>
        <Typography
          component="h3"
          sx={{ fontWeight: 800, fontSize: "0.95rem", color: PROFILE.ink, letterSpacing: "-0.2px" }}
        >
          {t("savedResumes.title", { defaultValue: "Saved resumes" })}
        </Typography>
        {documents.length > 0 && (
          <Typography sx={{ ...META_CHIP, ml: "auto" }}>
            {t("savedResumes.count", {
              count: documents.length,
              max: MAX_RESUME_DOCUMENTS,
              defaultValue: `${documents.length} of ${MAX_RESUME_DOCUMENTS}`,
            })}
          </Typography>
        )}
      </Box>

      {loading && documents.length === 0 ? (
        <Typography sx={{ fontSize: "0.8rem", color: PROFILE.inkFaint }}>
          {t("savedResumes.loading", { defaultValue: "Loading your saved resumes…" })}
        </Typography>
      ) : loadError && documents.length === 0 ? (
        /* NOT the empty state. Telling a learner with eight saved resumes "Nothing saved yet"
           because a gateway blipped reads as "they are gone". */
        <Box data-testid="saved-resumes-error" sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: "0.8rem", color: PROFILE.inkMuted, lineHeight: 1.6, [PHONE]: { fontSize: "0.8125rem" } }}>
            {t("savedResumes.loadFailed", {
              defaultValue: "Your saved resumes could not be loaded just now. They are still there.",
            })}
          </Typography>
          {onRetry && (
            <Button
              size="small"
              variant="outlined"
              onClick={onRetry}
              startIcon={<IconWrapper icon="mdi:refresh" size={15} />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                borderRadius: 999,
                px: 1.75,
                borderColor: PROFILE.hairline,
                color: PROFILE.ink,
                "&:hover": { borderColor: PROFILE.violet, backgroundColor: PROFILE.violetSoft },
                [PHONE]: { minHeight: 44, fontSize: "0.8125rem" },
              }}
            >
              {t("savedResumes.retry", { defaultValue: "Try again" })}
            </Button>
          )}
        </Box>
      ) : documents.length === 0 ? (
        /* A first-time learner has never pressed Save and has no idea what it would do. This says
           it in one line, in the place the result would appear. */
        <Typography sx={{ fontSize: "0.8rem", color: PROFILE.inkFaint, lineHeight: 1.6, [PHONE]: { fontSize: "0.8125rem" } }}>
          {t("savedResumes.empty", {
            defaultValue:
              "Nothing saved yet. Press Save and this resume is kept here with its content, template and section order, ready to open and keep editing later.",
          })}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {shown.map((doc) => {
            const isOpen = doc.id === openId;
            const busy = doc.id === busyId;
            return (
              <Box
                key={doc.id}
                data-testid="saved-resume-row"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 1,
                  borderRadius: 3,
                  minWidth: 0,
                  border: `1px solid ${isOpen ? PROFILE.violet : PROFILE.hairline}`,
                  bgcolor: isOpen ? PROFILE.violetSoft : "transparent",
                  opacity: busy ? 0.6 : 1,
                  transition: "border-color .12s, background-color .12s",
                  // A phone row stacks: name, then meta, then the actions on their own line.
                  // Side by side they either truncate the name to nothing or scroll sideways.
                  [PHONE]: { flexWrap: "wrap", px: 1, py: 1.25 },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1, [PHONE]: { flexBasis: "100%" } }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: PROFILE.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.9, flexWrap: "wrap", mt: "2px" }}>
                    <Typography sx={META_CHIP}>{templateLabel(doc.template)}</Typography>
                    <Typography sx={META_CHIP}>{formatEdited(doc.updated_at, t)}</Typography>
                    {doc.ats_score != null && (
                      /* "at save", not bare "ATS 72". The score is the one stored when this
                         resume was last saved, while the toolbar recomputes live, so the two can
                         legitimately disagree the moment a resume is reopened. Without the
                         qualifier that looks like one of them is lying. */
                      <Tooltip
                        title={t("savedResumes.atsAtSaveHint", {
                          defaultValue:
                            "The ATS score when this resume was last saved. Opening it scores the current content again.",
                        })}
                      >
                        <Typography sx={META_CHIP}>
                          <IconWrapper icon="mdi:speedometer" size={13} />
                          {t("savedResumes.atsAtSave", {
                            score: doc.ats_score,
                            defaultValue: `ATS ${doc.ats_score} at save`,
                          })}
                        </Typography>
                      </Tooltip>
                    )}
                    {isOpen && (
                      <Typography sx={{ ...META_CHIP, color: PROFILE.violet, fontWeight: 800 }}>
                        {t("savedResumes.editingNow", { defaultValue: "Editing now" })}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    flexShrink: 0,
                    [PHONE]: { flexBasis: "100%", mt: 1, justifyContent: "space-between", gap: 0.5 },
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    onClick={() => onOpen(doc.id)}
                    startIcon={<IconWrapper icon="mdi:pencil-outline" size={15} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      borderRadius: 999,
                      px: 1.75,
                      mr: 0.5,
                      whiteSpace: "nowrap",
                      borderColor: PROFILE.hairline,
                      color: PROFILE.ink,
                      "&:hover": { borderColor: PROFILE.violet, backgroundColor: PROFILE.violetSoft },
                      [PHONE]: { minHeight: 44, fontSize: "0.8125rem", flex: 1, mr: 0 },
                    }}
                  >
                    {t("savedResumes.open", { defaultValue: "Open" })}
                  </Button>
                  <Tooltip title={t("savedResumes.rename", { defaultValue: "Rename" })}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={busy}
                        onClick={() => startRename(doc)}
                        aria-label={t("savedResumes.rename", { defaultValue: "Rename" })}
                        sx={ICON_ACTION}
                      >
                        <IconWrapper icon="mdi:rename-outline" size={17} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t("savedResumes.duplicate", { defaultValue: "Duplicate" })}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={busy}
                        onClick={() => onDuplicate(doc.id)}
                        aria-label={t("savedResumes.duplicate", { defaultValue: "Duplicate" })}
                        sx={ICON_ACTION}
                      >
                        <IconWrapper icon="mdi:content-copy" size={16} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t("savedResumes.delete", { defaultValue: "Delete" })}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={busy}
                        onClick={() => setDeleting(doc)}
                        aria-label={t("savedResumes.delete", { defaultValue: "Delete" })}
                        sx={{ ...ICON_ACTION, "&:hover": { color: "#b91c1c", backgroundColor: "#fef2f2" } }}
                      >
                        <IconWrapper icon="mdi:trash-can-outline" size={17} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}

          {documents.length > COLLAPSED_ROWS && (
            <Button
              variant="text"
              size="small"
              onClick={() => setExpanded((v) => !v)}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                color: PROFILE.violet,
                [PHONE]: { minHeight: 44, fontSize: "0.8125rem" },
              }}
            >
              {expanded
                ? t("savedResumes.showFewer", { defaultValue: "Show fewer" })
                : t("savedResumes.showAll", {
                    count: documents.length,
                    defaultValue: `Show all ${documents.length}`,
                  })}
            </Button>
          )}
        </Box>
      )}

      <ResponsiveDialog
        open={Boolean(renaming)}
        onClose={() => !renameBusy && setRenaming(null)}
        title={t("savedResumes.renameTitle", { defaultValue: "Rename resume" })}
        maxWidth="xs"
        footer={
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              onClick={() => setRenaming(null)}
              disabled={renameBusy}
              sx={{ textTransform: "none", fontWeight: 700, [PHONE]: { minHeight: 44, flex: 1 } }}
            >
              {t("savedResumes.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={commitRename}
              variant="contained"
              disableElevation
              disabled={renameBusy || !renameValue.trim()}
              sx={{ textTransform: "none", fontWeight: 700, [PHONE]: { minHeight: 44, flex: 1 } }}
            >
              {t("savedResumes.saveName", { defaultValue: "Save name" })}
            </Button>
          </Box>
        }
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={renameValue}
          disabled={renameBusy}
          onChange={(e) => setRenameValue(e.target.value.slice(0, 120))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commitRename();
            }
          }}
          label={t("savedResumes.nameLabel", { defaultValue: "Name" })}
          inputProps={{ maxLength: 120 }}
        />
      </ResponsiveDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        title={t("savedResumes.deleteTitle", { defaultValue: "Delete this resume?" })}
        message={t("savedResumes.deleteMessage", {
          name: deleting?.name ?? "",
          defaultValue: `"${deleting?.name ?? ""}" will be removed. This cannot be undone, and any PDF you already downloaded is not affected.`,
        })}
        confirmText={t("savedResumes.delete", { defaultValue: "Delete" })}
        cancelText={t("savedResumes.cancel", { defaultValue: "Cancel" })}
        confirmColor="error"
        onConfirm={() => void commitDelete()}
        onCancel={() => setDeleting(null)}
      />
    </Paper>
  );
}
