"use client";

import { Box, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { SavedResume } from "@/lib/services/resume.service";
import { formatDate } from "@/lib/jobs-v2/format";
import {
  J,
  R,
  TYPE,
  JCard,
  JButton,
  JSelect,
  JFileDrop,
  JTabs,
  JTabPanel,
  EmptyState,
  ErrorState,
  SkeletonShell,
} from "@/components/jobs-v2/ui";

export type ResumeMode = "saved" | "upload";

/** The resume that will actually be sent, whichever tab produced it. */
export interface UploadedResume {
  id: number;
  url: string;
  name: string;
  size?: number;
}

export interface StepResumeProps {
  mode: ResumeMode;
  onModeChange: (mode: ResumeMode) => void;

  resumes: SavedResume[];
  resumesLoading: boolean;
  resumesError: string | null;
  onReloadResumes: () => void;
  selectedResumeId: number | null;
  onSelectResume: (id: number | null) => void;

  uploaded: UploadedResume | null;
  uploading: boolean;
  uploadError: string | null;
  onUpload: (file: File) => void;
  onClearUpload: () => void;

  onPreview: () => void;
  canPreview: boolean;
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ID = "apply-resume";

/**
 * Step 0 — your resume.
 *
 * Three shipped bugs die here:
 *
 * 1. **The segmented control's active fill was `var(--font-light)`** — a *text* token that is
 *    white today, so the control inverted or vanished under any tenant palette that is not
 *    white. It is `JTabs`, whose active segment is `J.azureSoft`, with real roving `tabIndex`
 *    and arrow keys.
 * 2. **"No saved resumes" was invisible.** It was a disabled `MenuItem` inside a dropdown that
 *    looked empty until you opened it, and it was not a link. It is a real inline `EmptyState`
 *    with a primary that switches to the upload tab.
 * 3. **The drop zone mutated `e.currentTarget.style.borderColor` on drag.** An imperative style
 *    permanently outranks `sx`, which is why the green success border never rendered once you
 *    had dragged anything. `JFileDrop` keeps drag state in React.
 */
export function StepResume({
  mode,
  onModeChange,
  resumes,
  resumesLoading,
  resumesError,
  onReloadResumes,
  selectedResumeId,
  onSelectResume,
  uploaded,
  uploading,
  uploadError,
  onUpload,
  onClearUpload,
  onPreview,
  canPreview,
}: StepResumeProps) {
  const { t } = useTranslation("common");

  return (
    <JCard>
      <Typography component="h2" sx={{ ...TYPE.h3, mb: 0.5 }}>
        {t("jobsV2.apply.resumeTitle", { defaultValue: "Your resume" })}
      </Typography>
      <Typography sx={{ ...TYPE.small, mb: 2 }}>
        {t("jobsV2.apply.resumeHint", {
          defaultValue: "Pick one you have already saved, or upload a new PDF. It is saved to your profile either way.",
        })}
      </Typography>

      <JTabs
        idPrefix={ID}
        ariaLabel={t("jobsV2.apply.resumeSource", { defaultValue: "Resume source" })}
        size="sm"
        value={mode}
        onChange={(value) => onModeChange(value as ResumeMode)}
        tabs={[
          {
            value: "saved",
            label: t("jobsV2.apply.savedResume", { defaultValue: "Saved resume" }),
            icon: "mdi:file-document-outline",
          },
          {
            value: "upload",
            label: t("jobsV2.apply.uploadNew", { defaultValue: "Upload new" }),
            icon: "mdi:tray-arrow-up",
          },
        ]}
      />

      {/* ---- saved ------------------------------------------------------ */}
      <JTabPanel idPrefix={ID} value="saved" active={mode === "saved"} sx={{ mt: 2 }}>
        {resumesLoading ? (
          <SkeletonShell label={t("jobsV2.apply.loadingResumes", { defaultValue: "Loading your resumes…" })}>
            <Skeleton
              variant="rounded"
              animation="wave"
              height={12}
              width={120}
              sx={{ bgcolor: J.surface2, borderRadius: R.ctl, mb: 1 }}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              height={40}
              sx={{ bgcolor: J.surface2, borderRadius: R.ctl }}
            />
          </SkeletonShell>
        ) : resumesError ? (
          <ErrorState
            variant="inline"
            title={t("jobsV2.apply.resumesErrorTitle", { defaultValue: "We could not load your resumes" })}
            error={resumesError}
            onRetry={onReloadResumes}
          />
        ) : resumes.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="mdi:file-document-plus-outline"
            title={t("jobsV2.apply.noResumeTitle", { defaultValue: "No saved resume" })}
            body={t("jobsV2.apply.noResumeBody", {
              defaultValue: "You have not saved a resume yet. Upload one now and we will keep it on your profile.",
            })}
            primaryAction={
              <JButton
                variant="primary"
                tone="azure"
                startIcon="mdi:tray-arrow-up"
                onClick={() => onModeChange("upload")}
              >
                {t("jobsV2.apply.uploadOneNow", { defaultValue: "Upload one now" })}
              </JButton>
            }
            secondaryAction={
              <JButton variant="quiet" href="/profile" external startIcon="mdi:open-in-new">
                {t("jobsV2.apply.manageResumes", { defaultValue: "Manage resumes in your profile" })}
              </JButton>
            }
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, alignItems: "flex-end" }}>
            <JSelect
              id={`${ID}-select`}
              label={t("jobsV2.apply.chooseResume", { defaultValue: "Choose a resume" })}
              required
              value={selectedResumeId != null ? String(selectedResumeId) : ""}
              onChange={(value) => onSelectResume(value ? Number(value) : null)}
              placeholder={t("jobsV2.apply.chooseResumePlaceholder", { defaultValue: "Select one" })}
              options={resumes.map((r) => ({
                value: String(r.id),
                label: resumeLabel(r),
                icon: "mdi:file-document-outline",
              }))}
            />
            <JButton
              variant="secondary"
              startIcon="mdi:eye-outline"
              onClick={onPreview}
              disabledReason={
                canPreview
                  ? undefined
                  : t("jobsV2.apply.previewDisabled", { defaultValue: "Choose a resume to preview it" })
              }
              sx={{ flexShrink: 0 }}
            >
              {t("jobsV2.apply.preview", { defaultValue: "Preview" })}
            </JButton>
          </Box>
        )}
      </JTabPanel>

      {/* ---- upload ----------------------------------------------------- */}
      <JTabPanel idPrefix={ID} value="upload" active={mode === "upload"} sx={{ mt: 2 }}>
        <JFileDrop
          id={`${ID}-drop`}
          accept=".pdf,application/pdf"
          maxBytes={MAX_RESUME_BYTES}
          value={uploaded ? { name: uploaded.name, size: uploaded.size } : null}
          onFile={onUpload}
          onClear={onClearUpload}
          state={uploading ? "uploading" : uploaded ? "success" : uploadError ? "error" : "idle"}
          error={uploadError}
          label={t("jobsV2.apply.dropLabel", { defaultValue: "Drop your resume here, or choose a file" })}
          hint={t("jobsV2.apply.dropHint", { defaultValue: "PDF only, up to 5 MB" })}
        />
        {uploaded && (
          <Box sx={{ mt: 1.5 }}>
            <JButton variant="secondary" size="sm" startIcon="mdi:eye-outline" onClick={onPreview}>
              {t("jobsV2.apply.previewUploaded", { defaultValue: "Preview the uploaded resume" })}
            </JButton>
          </Box>
        )}
      </JTabPanel>
    </JCard>
  );
}

export function resumeLabel(resume: SavedResume): string {
  const name = resume.display_name?.trim();
  const when = formatDate(resume.created_at, { fallback: "" });
  if (name && when) return `${name} · ${when}`;
  return name || when || `#${resume.id}`;
}
