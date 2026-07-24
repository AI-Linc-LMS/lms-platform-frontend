"use client";

import { useRef, useState } from "react";
import { Box, ButtonBase, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { CsvAnalyzingProgress } from "./CsvAnalyzingProgress";
import { CSV_ROW_CAP, type ParsedCsv } from "./types";

/**
 * The "Upload CSV" creation path. Parses the file in the browser (header mode) so
 * the admin gets instant "detected N columns, M rows" feedback, then hands the
 * rows to the AI mapper via the page's onAnalyze. Column names can be anything -
 * the AI figures out which is week / topic / description.
 */
export function CsvUploadPanel({
  csvTitle,
  onCsvTitleChange,
  parsed,
  onParsed,
  parseError,
  onParseError,
  hint,
  onHintChange,
  analyzing,
  onAnalyze,
  hasPlan,
}: {
  csvTitle: string;
  onCsvTitleChange: (v: string) => void;
  parsed: ParsedCsv | null;
  onParsed: (p: ParsedCsv | null) => void;
  parseError: string | null;
  onParseError: (v: string | null) => void;
  hint: string;
  onHintChange: (v: string) => void;
  analyzing: boolean;
  onAnalyze: () => void;
  hasPlan: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    onParseError(null);
    if (!/\.csv$/i.test(file.name) && file.type && !file.type.includes("csv")) {
      onParseError("That doesn't look like a CSV. Export your sheet as .csv and try again.");
      onParsed(null);
      return;
    }
    try {
      const text = await file.text();
      const { default: Papa } = await import("papaparse");
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      const fields = (result.meta.fields || []).map((f) => (f || "").trim()).filter(Boolean);
      const allRows = (result.data || []).filter(
        (r) => r && typeof r === "object" && Object.values(r).some((v) => String(v ?? "").trim()),
      );
      if (!fields.length || !allRows.length) {
        onParseError("Couldn't find a header row and data in that file. Make sure row 1 has column names.");
        onParsed(null);
        return;
      }
      const rows = allRows.slice(0, CSV_ROW_CAP);
      const firstErr = result.errors?.[0];
      onParsed({
        fileName: file.name,
        columns: fields,
        rows,
        totalRows: allRows.length,
        truncated: allRows.length > CSV_ROW_CAP,
        parseWarning: firstErr ? `Row ${firstErr.row ?? "?"}: ${firstErr.message}` : null,
      });
      // Seed the course title from the filename if the admin hasn't typed one.
      if (!csvTitle.trim()) {
        onCsvTitleChange(file.name.replace(/\.csv$/i, "").replace(/[_-]+/g, " ").trim());
      }
    } catch {
      onParseError("Couldn't read that file. Try re-exporting it as a UTF-8 CSV.");
      onParsed(null);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <TextField
        label="Course title"
        required
        value={csvTitle}
        onChange={(e) => onCsvTitleChange(e.target.value)}
        fullWidth
        placeholder="e.g. Backend Engineering Bootcamp"
      />

      {/* Dropzone */}
      <Box>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
        <Box
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          sx={{
            cursor: "pointer",
            borderRadius: 4,
            p: 3,
            textAlign: "center",
            border: "1.5px dashed",
            borderColor: dragging
              ? "#6366f1"
              : "color-mix(in srgb, var(--border-default) 90%, transparent)",
            bgcolor: dragging
              ? "color-mix(in srgb, #6366f1 8%, transparent)"
              : "color-mix(in srgb, var(--card-bg) 55%, transparent)",
            transition: "border-color 120ms ease, background 120ms ease",
          }}
        >
          <Icon
            icon={parsed ? "mdi:file-check-outline" : "mdi:tray-arrow-up"}
            width={34}
            style={{ color: "#a855f7" }}
          />
          {parsed ? (
            <>
              <Typography sx={{ fontWeight: 800, mt: 1 }}>{parsed.fileName}</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.25 }}>
                Detected {parsed.columns.length} columns ·{" "}
                {parsed.truncated ? `first ${parsed.rows.length} of ${parsed.totalRows}` : parsed.rows.length}{" "}
                rows · click to replace
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: 800, mt: 1 }}>
                Drop your curriculum CSV here, or click to browse
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.25 }}>
                Any columns work - a week/module column, a topic column, and a description help most.
              </Typography>
            </>
          )}
        </Box>

        {parsed && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.25 }}>
            {parsed.columns.map((c) => (
              <Box
                key={c}
                component="span"
                sx={{
                  px: 1, py: 0.25, borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                  color: "text.secondary",
                  bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                }}
              >
                {c}
              </Box>
            ))}
          </Box>
        )}

        {parsed?.truncated && (
          <Note icon="mdi:information-outline" color="#f59e0b">
            Only the first {CSV_ROW_CAP} rows will be analyzed.
          </Note>
        )}
        {parsed?.parseWarning && (
          <Note icon="mdi:alert-outline" color="#f59e0b">
            Parser note - {parsed.parseWarning}
          </Note>
        )}
        {parseError && (
          <Note icon="mdi:alert-circle-outline" color="#ef4444">
            {parseError}
          </Note>
        )}
      </Box>

      <TextField
        label="Anything the AI should know? (optional)"
        value={hint}
        onChange={(e) => onHintChange(e.target.value)}
        fullWidth
        multiline
        minRows={2}
        placeholder='e.g. "Treat the Module column as weeks" or "Ignore the Notes column"'
      />

      {analyzing ? (
        <CsvAnalyzingProgress
          rowCount={parsed?.rows.length ?? 0}
          columnCount={parsed?.columns.length ?? 0}
        />
      ) : (
        <ButtonBase
          onClick={onAnalyze}
          disabled={!parsed}
          sx={{
            alignSelf: "flex-start",
            px: 3,
            py: 1.2,
            borderRadius: 999,
            fontWeight: 800,
            gap: 0.75,
            color: "white",
            opacity: !parsed ? 0.5 : 1,
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            boxShadow: "0 16px 32px -16px rgba(168, 85, 247, 0.55)",
          }}
        >
          <Icon icon="mdi:sparkles" width={18} />
          {hasPlan ? "Re-analyze" : "Analyze with AI"}
        </ButtonBase>
      )}
    </Box>
  );
}

function Note({ icon, color, children }: { icon: string; color: string; children: React.ReactNode }) {
  return (
    <Typography
      sx={{ mt: 1, fontSize: "0.78rem", color, display: "flex", gap: 0.5, alignItems: "center", fontWeight: 600 }}
    >
      <Icon icon={icon} width={16} />
      {children}
    </Typography>
  );
}
