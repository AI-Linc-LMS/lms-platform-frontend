"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PREVIEW_HEIGHT } from "./shared";
import { OfficeDocPreview } from "./OfficeDocPreview";

interface DocxPreviewProps {
  url: string;
  filename: string;
}

/** mammoth converts DOCX → HTML on the client. Heavy dep, so load it dynamically. */
export function DocxPreview({ url, filename }: DocxPreviewProps) {
  const { t } = useTranslation("common");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        // Dynamic import keeps mammoth out of the initial bundle.
        const mammoth = (await import("mammoth")).default ?? (await import("mammoth"));
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value || "");
      } catch (e: unknown) {
        if (!cancelled)
          setError(
            e instanceof Error
              ? e.message
              : t("courseBuilderAttachments.loadFailed")
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [url, t]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error || html === null) {
    // Fall back to Office Online Viewer if mammoth couldn't parse this file.
    return <OfficeDocPreview url={url} filename={filename} />;
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: 1,
        maxHeight: PREVIEW_HEIGHT,
        overflow: "auto",
        color: "var(--font-primary)",
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          color: "var(--font-primary)",
          fontWeight: 600,
          mt: 1.5,
          mb: 1,
        },
        "& p": { color: "var(--font-secondary)", lineHeight: 1.7, mb: 1 },
        "& ul, & ol": { color: "var(--font-secondary)", pl: 3, mb: 1 },
        "& li": { mb: 0.5 },
        "& a": {
          color: "var(--accent-indigo)",
          textDecoration: "none",
          "&:hover": { textDecoration: "underline" },
        },
        "& table": { borderCollapse: "collapse", width: "100%", mb: 1 },
        "& th, & td": {
          border: "1px solid var(--border-default)",
          padding: "6px 10px",
          textAlign: "start",
        },
        "& th": { backgroundColor: "var(--surface)", fontWeight: 600 },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
