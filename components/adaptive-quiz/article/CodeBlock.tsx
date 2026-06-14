"use client";

import { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { LANGUAGE_DISPLAY_NAMES, getMonacoLanguage } from "@/components/coding/utils/languageUtils";

/**
 * Read-only, syntax-highlighted code block with a macOS-style chrome + copy button.
 * Used (via AdaptiveArticleBody's hydration pass) for non-runnable <pre> blocks in
 * adaptive articles. Lightweight on purpose — Monaco is reserved for runnable blocks.
 */
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = (language || "text").toLowerCase();
  const prismLang = getMonacoLanguage(lang);
  const label = LANGUAGE_DISPLAY_NAMES[lang] || lang.toUpperCase();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.75,
          bgcolor: "#11151c",
          borderBottom: "1px solid #232a36",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 0.6 }}>
            {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
              <Box key={c} sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: c }} />
            ))}
          </Box>
          <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>
            {label}
          </Box>
        </Box>
        <Tooltip title={copied ? "Copied!" : "Copy"}>
          <IconButton size="small" onClick={copy} sx={{ color: copied ? "#27c93f" : "#94a3b8" }}>
            <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} width={15} />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter
        language={prismLang}
        style={oneDark}
        customStyle={{ margin: 0, padding: "16px 18px", fontSize: "0.86rem", background: "#0d1117" }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
}
