"use client";

import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PREVIEW_HEIGHT } from "./shared";
import { TextPreview } from "./TextPreview";

interface CsvPreviewProps {
  url: string;
}

/** Render CSVs as a small scrollable table for readability. */
export function CsvPreview({ url }: CsvPreviewProps) {
  const { t } = useTranslation("common");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csvText = await res.text();
        const { default: Papa } = await import("papaparse");
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
        if (!cancelled) {
          // Cap at 1000 rows to keep DOM size sane.
          const data = (parsed.data as string[][]).slice(0, 1000);
          setRows(data);
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

  if (error || !rows || rows.length === 0) {
    return <TextPreview url={url} />;
  }

  const [headerRow, ...bodyRows] = rows;

  return (
    <Box
      sx={{
        maxHeight: PREVIEW_HEIGHT,
        overflow: "auto",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: 1,
      }}
    >
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
          color: "var(--font-primary)",
        }}
      >
        <Box
          component="thead"
          sx={{ position: "sticky", top: 0, bgcolor: "var(--surface)" }}
        >
          <Box component="tr">
            {headerRow.map((cell, i) => (
              <Box
                key={i}
                component="th"
                sx={{
                  border: "1px solid var(--border-default)",
                  px: 1.25,
                  py: 0.75,
                  textAlign: "start",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {cell}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {bodyRows.map((row, ri) => (
            <Box
              component="tr"
              key={ri}
              sx={{ "&:nth-of-type(even)": { bgcolor: "var(--surface)" } }}
            >
              {row.map((cell, ci) => (
                <Box
                  key={ci}
                  component="td"
                  sx={{
                    border: "1px solid var(--border-default)",
                    px: 1.25,
                    py: 0.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {cell}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
      {bodyRows.length >= 999 && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            py: 1,
            color: "var(--font-tertiary)",
          }}
        >
          (showing first 1000 rows)
        </Typography>
      )}
    </Box>
  );
}
