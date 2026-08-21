"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { AttachmentPreview } from "@/components/admin/course-builder/AttachmentPreview";
import { formatFileSize, type LiveSessionMaterial } from "@/lib/services/live-session-materials.service";

/**
 * Reads a session's study material without leaving the platform.
 *
 * The body is the existing AttachmentPreview dispatcher rather than a new iframe viewer: a bare
 * `<iframe src="...pptx">` downloads the file instead of rendering it, which is the behaviour this
 * dialog exists to fix. `allowExternalViewer={false}` keeps tenant material off Microsoft's Office
 * Online servers - PDFs, images, video/audio, text and .docx all still render in-app, and the
 * formats that would need a third party get the download card instead.
 */
export function MaterialViewerDialog({
  material,
  onClose,
}: {
  material: LiveSessionMaterial | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(material)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {material?.title}
        <Typography variant="caption" sx={{ display: "block", color: "var(--font-secondary)", fontWeight: 500 }}>
          {material?.original_filename}
          {material?.file_size ? ` · ${formatFileSize(material.file_size)}` : ""}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {material && <AttachmentPreview attachment={material} allowExternalViewer={false} />}
      </DialogContent>
      <DialogActions>
        {material?.file_url && (
          <Button component="a" href={material.file_url} target="_blank" rel="noopener noreferrer" sx={{ textTransform: "none" }}>
            Open in new tab
          </Button>
        )}
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
