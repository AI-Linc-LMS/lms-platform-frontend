"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
        }}
      >
        Loading editor...
      </Box>
    ),
  }
);

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  theme?: "vs-dark" | "light";
  /**
   * When true, the editor's Ctrl/Cmd + X/C/V shortcuts and the right-click context menu
   * are NOT intercepted - the candidate can paste code in. Off by default everywhere so
   * we keep the standard "no copy-paste" interview hardening; the mock-interview flow
   * flips this on ONLY for the admin-only 2-min test interview so the testing flow
   * (paste a known-good answer, hit submit) is quick. See CodingQuestionModal.
   */
  allowClipboard?: boolean;
  /**
   * 1-based line to flag with a gutter glyph + line highlight - used by the AI
   * Coding Mentor to anchor its root-cause diagnosis (InlineCodeAnnotation).
   * Null/undefined clears any existing marker. Off (and zero layout impact)
   * for every existing caller that doesn't pass it.
   */
  glyphLine?: number | null;
  /** Hover message shown over the gutter glyph (the mentor's one-line note). */
  glyphMessage?: string;
}

// Inject the mentor decoration CSS once. Monaco decoration classNames must exist
// in global CSS, so we append a <style> the first time an editor needs it.
let _mentorStyleInjected = false;
function ensureMentorDecorationStyle() {
  if (_mentorStyleInjected || typeof document === "undefined") return;
  _mentorStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .mentor-rootcause-line { background: rgba(239, 68, 68, 0.14); }
    .mentor-rootcause-glyph {
      background: radial-gradient(circle at 50% 50%, #ef4444 0 4px, transparent 5px);
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  height = "500px",
  readOnly = false,
  theme = "vs-dark",
  allowClipboard = false,
  glyphLine = null,
  glyphMessage = "",
}: MonacoEditorProps) {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const valueRef = useRef(value);
  const isUserTypingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply / clear the mentor root-cause gutter marker whenever the line changes.
  useEffect(() => {
    const ed = editorRef.current;
    const mon = monacoRef.current;
    if (!ed || !mon) return;
    if (decorationsRef.current) {
      decorationsRef.current.clear();
      decorationsRef.current = null;
    }
    if (!glyphLine || glyphLine < 1) return;
    ensureMentorDecorationStyle();
    decorationsRef.current = ed.createDecorationsCollection([
      {
        range: new mon.Range(glyphLine, 1, glyphLine, 1),
        options: {
          isWholeLine: true,
          className: "mentor-rootcause-line",
          glyphMarginClassName: "mentor-rootcause-glyph",
          glyphMarginHoverMessage: glyphMessage ? { value: glyphMessage } : undefined,
          overviewRuler: { color: "#ef4444", position: mon.editor.OverviewRulerLane.Left },
        },
      },
    ]);
    ed.revealLineInCenter(glyphLine);
  }, [glyphLine, glyphMessage, mounted]);

  // Update value ref
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Only update editor value if user is not typing and value changed externally
  useEffect(() => {
    if (editorRef.current && !isUserTypingRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(value);
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    }
  }, [value]);

  const handleEditorChange = (newValue: string | undefined) => {
    isUserTypingRef.current = true;
    if (onChange) {
      onChange(newValue);
    }
    // Reset typing flag after a short delay
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // If a root-cause line was set before mount, draw it now.
    if (glyphLine && glyphLine >= 1) {
      ensureMentorDecorationStyle();
      decorationsRef.current = editor.createDecorationsCollection([
        {
          range: new monaco.Range(glyphLine, 1, glyphLine, 1),
          options: {
            isWholeLine: true,
            className: "mentor-rootcause-line",
            glyphMarginClassName: "mentor-rootcause-glyph",
            glyphMarginHoverMessage: glyphMessage ? { value: glyphMessage } : undefined,
            overviewRuler: { color: "#ef4444", position: monaco.editor.OverviewRulerLane.Left },
          },
        },
      ]);
    }

    // Default: disable cut, copy, paste keyboard shortcuts so candidates can't paste a
    // pre-written solution. When `allowClipboard` is true (admin-only 2-min test
    // interview path), we leave the shortcuts alone so the tester can paste known-good
    // code and exercise the rest of the flow quickly.
    if (!allowClipboard) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
        return null;
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
        return null;
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
        return null;
      });
    }
  };

  if (!mounted) {
    return (
      <Box
        sx={{
          height,
          backgroundColor: "#1e1e1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
        }}
      >
        Loading editor...
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: height,
        maxHeight: height,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        "& .monaco-editor": {
          borderRadius: 2,
        },
        "& .monaco-editor .overflow-guard": {
          maxHeight: "100% !important",
        },
      }}
    >
      <MonacoEditor
        height={height}
        language={language}
        defaultValue={value}
        onChange={handleEditorChange}
        theme={theme}
        options={{
          readOnly,
          minimap: { enabled: false },
          // Reserve the glyph margin only when a marker is in play, so existing
          // editors that don't use it render exactly as before.
          glyphMargin: Boolean(glyphLine),
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          // Right-click context menu (which includes Copy/Cut/Paste entries) is normally
          // disabled to harden the interview against pasted solutions. Enabled only in
          // admin-only test mode.
          contextmenu: allowClipboard,
          fixedOverflowWidgets: true,
        }}
        onMount={handleEditorMount}
      />
    </Box>
  );
}
