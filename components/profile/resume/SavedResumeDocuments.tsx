"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/common/Toast";
import { SavedResumesPanel } from "./SavedResumesPanel";
import {
  ResumeDocumentsUnavailable,
  resumeDocumentsService,
  type ResumeDocumentSummary,
} from "@/lib/services/resumeDocuments.service";
import { TEMPLATE_KEYS } from "./templateKeys";

/**
 * The learner's saved resumes, where a learner goes looking for them: the Saved resumes tab.
 *
 * They used to be listed inside the builder itself, on the page whose job is to edit ONE resume.
 * That put a library of resumes under the form that was editing one of them, and left the tab
 * actually named "Saved resumes" holding only rendered PDFs - which cannot be edited at all. So
 * the one list a learner could act on was in the place they were not looking, and the place they
 * were looking offered Download and Delete and no way back into the builder.
 *
 * This owns the list and everything that changes it - rename, duplicate, delete. It deliberately
 * does NOT own opening: the builder is what opens a document, and this calls `onEdit` so the one
 * surface that can load one keeps doing it. See `ResumeBuilder.handleOpenDocument`.
 */

export interface SavedResumeDocumentsProps {
  /**
   * The panel is on screen. The list is refetched when it becomes so, because the builder beside
   * it can have saved, renamed or created a resume since this last looked.
   */
  isActive?: boolean;
  /** The document the builder currently has open, so its row can say "Editing now". */
  openId?: number | null;
  /** Reopen this document in the builder. */
  onEdit: (id: number) => void;
  /** Something in the list changed, so a builder mounted beside this can reload its own copy. */
  onChanged?: () => void;
}

export function SavedResumeDocuments({
  isActive = true,
  openId = null,
  onEdit,
  onChanged,
}: SavedResumeDocumentsProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<ResumeDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * The API on this tenant does not offer resume documents yet (404 on the whole collection).
   * Then this half of the feature simply is not there and the panel hides, rather than showing a
   * learner an error about something they never asked for.
   */
  const [unavailable, setUnavailable] = useState(false);
  /**
   * The list could not be fetched, and it is NOT the 404 above. A separate state on purpose: a
   * blip that left `documents` at `[]` would render "Nothing saved yet" to a learner with eight
   * saved resumes, which reads as "they are gone".
   */
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await resumeDocumentsService.list();
      setDocuments(list);
      setUnavailable(false);
      setLoadError(false);
    } catch (err) {
      if (err instanceof ResumeDocumentsUnavailable) {
        setUnavailable(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) void reload();
  }, [isActive, reload]);

  const handleRename = async (id: number, name: string) => {
    setBusyId(id);
    try {
      await resumeDocumentsService.update(id, { name });
      await reload();
      onChanged?.();
    } catch {
      showToast(t("savedResumes.renameFailed", { defaultValue: "Could not rename that resume" }), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    setBusyId(id);
    try {
      const copy = await resumeDocumentsService.duplicate(id);
      await reload();
      onChanged?.();
      showToast(t("savedResumes.duplicated", { name: copy.name, defaultValue: `Created "${copy.name}"` }), "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("savedResumes.duplicateFailed", { defaultValue: "Could not duplicate" }),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await resumeDocumentsService.remove(id);
      await reload();
      // The builder is told, so that deleting the resume it has open detaches it there too and
      // the next Save asks for a name rather than writing to a row that no longer exists.
      onChanged?.();
      showToast(t("savedResumes.deleted", { defaultValue: "Resume deleted" }), "success");
    } catch {
      showToast(t("savedResumes.deleteFailed", { defaultValue: "Could not delete that resume" }), "error");
    }
  };

  if (unavailable) return null;

  return (
    <SavedResumesPanel
      documents={documents}
      loading={loading}
      loadError={loadError}
      onRetry={() => {
        setLoading(true);
        void reload();
      }}
      openId={openId}
      busyId={busyId}
      onOpen={onEdit}
      onRename={handleRename}
      onDuplicate={(id) => void handleDuplicate(id)}
      onDelete={handleDelete}
      templateLabel={(template) =>
        TEMPLATE_KEYS[template] ? t(`profile.${TEMPLATE_KEYS[template]}`) : template
      }
    />
  );
}
