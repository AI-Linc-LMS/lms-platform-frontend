"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PREVIEW_HEIGHT } from "./shared";
import { FallbackPreview } from "./FallbackPreview";

interface TextPreviewProps {
  url: string;
}

export function TextPreview({ url }: TextPreviewProps) {
  const { t } = useTranslation("common");
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const content = await res.text();
        if (!cancelled) {
          // Cap at 200KB to avoid massive renders
          const max = 200 * 1024;
          setText(
            content.length > max
              ? content.slice(0, max) + "\n\n... (truncated)"
              : content
          );
        }
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

  if (error) {
    return <FallbackPreview url={url} filename="" />;
  }

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: 1,
        maxHeight: PREVIEW_HEIGHT,
        overflow: "auto",
        fontFamily: "'Fira Code', 'Source Code Pro', Menlo, Consolas, monospace",
        fontSize: "0.8125rem",
        color: "var(--font-primary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {text}
    </Box>
  );
}
