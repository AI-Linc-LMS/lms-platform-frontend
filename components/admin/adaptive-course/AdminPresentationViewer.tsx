"use client";

import { useEffect, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import type { PresentationDocument } from "@/lib/services/adaptive-course.service";
import { PresentationViewer } from "@/components/adaptive-quiz/presentation/PresentationViewer";

/** Admin deck preview: fetches the full document and renders the shared viewer,
 *  plus an opt-in "Download .pptx" export (Anthropic pptx skill). */
export function AdminPresentationViewer({ courseId, presentationId }: { courseId: number; presentationId: number }) {
  const [doc, setDoc] = useState<PresentationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await adminAdaptiveCourseService.getCoursePresentation(courseId, presentationId);
        if (!cancelled) setDoc(d.document);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load presentation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, presentationId]);

  async function downloadPptx() {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const { pptx_url } = await adminAdaptiveCourseService.exportPresentationPptx(courseId, presentationId);
      if (pptx_url) window.open(pptx_url, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't export .pptx — please retry.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", py: 2 }}>Loading deck…</Typography>;
  if (error && !doc) return <Typography sx={{ fontSize: "0.82rem", color: "#ef4444", py: 2 }}>{error}</Typography>;
  if (!doc) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, mb: 1 }}>
        {error && <Typography sx={{ fontSize: "0.74rem", color: "#ef4444" }}>{error}</Typography>}
        <ButtonBase
          onClick={downloadPptx}
          disabled={exporting}
          sx={{
            gap: 0.5, px: 1.5, py: 0.6, borderRadius: 999, fontWeight: 800, fontSize: "0.78rem",
            color: "#0d9488", border: "1px solid color-mix(in srgb, #0d9488 40%, transparent)",
            opacity: exporting ? 0.6 : 1,
          }}
        >
          <Icon icon={exporting ? "mdi:loading" : "mdi:file-powerpoint-box"} width={16} className={exporting ? "spin" : ""} />
          {exporting ? "Exporting…" : "Download .pptx"}
        </ButtonBase>
      </Box>
      <PresentationViewer document={doc} />
    </Box>
  );
}
