"use client";

import { useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { LANGUAGE_DISPLAY_NAMES, getMonacoLanguage } from "@/components/coding/utils/languageUtils";
import { adaptiveCourseService, type RunSnippetResult } from "@/lib/services/adaptive-course.service";

function errMessage(e: unknown): string {
  const anyE = e as { response?: { data?: { detail?: string } }; message?: string };
  return anyE?.response?.data?.detail || anyE?.message || "Couldn't run the code right now.";
}

/**
 * "Try it yourself" editor embedded in an adaptive article (w3schools-style):
 * an editable Monaco editor seeded with the snippet + a Run button that executes
 * it server-side (Judge0) and shows raw stdout / errors. Mounted by
 * AdaptiveArticleBody for <pre data-runnable="true"> blocks.
 */
export function RunnableCodeBlock({ initialCode, language }: { initialCode: string; language?: string }) {
  const lang = (language || "python").toLowerCase();
  const monacoLang = getMonacoLanguage(lang);
  const label = LANGUAGE_DISPLAY_NAMES[lang] || lang.toUpperCase();

  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunSnippetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lines = Math.min(22, Math.max(4, code.split("\n").length));
  const editorHeight = `${lines * 21 + 22}px`;

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      setResult(await adaptiveCourseService.runSnippet({ source: code, language: lang }));
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setCode(initialCode);
    setResult(null);
    setError(null);
  };

  const hasErr = Boolean(result?.stderr || result?.compile_output || error);
  const ok = Boolean(result) && !hasErr;

  return (
    <Box
      sx={{
        my: 2.75,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #232a36",
        boxShadow: "0 14px 36px -20px rgba(0,0,0,0.65)",
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.85,
          bgcolor: "#11151c",
          borderBottom: "1px solid #232a36",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.85 }}>
          <Icon icon="mdi:flask-outline" width={16} style={{ color: "#a855f7" }} />
          <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>
            Try it yourself · {label}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          <Button
            onClick={reset}
            size="small"
            startIcon={<Icon icon="mdi:restore" width={15} />}
            sx={{ color: "#94a3b8", textTransform: "none", fontWeight: 700, minWidth: 0, "&:hover": { color: "#e2e8f0" } }}
          >
            Reset
          </Button>
          <Button
            onClick={run}
            disabled={running}
            size="small"
            variant="contained"
            startIcon={
              running ? <CircularProgress size={13} sx={{ color: "white" }} /> : <Icon icon="mdi:play" width={16} />
            }
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 1.75,
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              boxShadow: "none",
              "&:hover": { boxShadow: "0 6px 18px -8px #a855f7" },
            }}
          >
            {running ? "Running…" : "Run"}
          </Button>
        </Box>
      </Box>

      {/* Editor */}
      <Box sx={{ "& > div": { border: "none !important", borderRadius: "0 !important" } }}>
        <CodeEditor
          value={code}
          onChange={(v) => setCode(v ?? "")}
          language={monacoLang}
          height={editorHeight}
          theme="vs-dark"
          allowClipboard
        />
      </Box>

      {/* Output */}
      {(result || error) && (
        <Box sx={{ bgcolor: "#0d1117", borderTop: "1px solid #232a36" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              px: 1.5,
              py: 0.6,
              borderBottom: "1px solid #1b2230",
            }}
          >
            <Icon
              icon={ok ? "mdi:check-circle" : "mdi:alert-circle"}
              width={14}
              style={{ color: ok ? "#27c93f" : "#ff6b6b" }}
            />
            <Box component="span" sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8" }}>
              Output{result?.status ? ` · ${result.status}` : ""}
            </Box>
          </Box>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.75,
              maxHeight: 280,
              overflow: "auto",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.82rem",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#e2e8f0",
            }}
          >
            {error ? (
              <Box component="span" sx={{ color: "#ff6b6b" }}>{error}</Box>
            ) : (
              <>
                {result?.stdout ? <Box component="span">{result.stdout}</Box> : null}
                {result?.compile_output ? (
                  <Box component="span" sx={{ color: "#ff6b6b" }}>{result.compile_output}</Box>
                ) : null}
                {result?.stderr ? <Box component="span" sx={{ color: "#ff6b6b" }}>{result.stderr}</Box> : null}
                {!result?.stdout && !result?.stderr && !result?.compile_output ? (
                  <Box component="span" sx={{ color: "#64748b" }}>(no output)</Box>
                ) : null}
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
