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
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  height = "500px",
  readOnly = false,
  theme = "vs-dark",
}: MonacoEditorProps) {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const valueRef = useRef(value);
  const isUserTypingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    // Disable cut, copy, paste keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      return null;
    });
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
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          contextmenu: false,
          fixedOverflowWidgets: true,
        }}
        onMount={handleEditorMount}
      />
    </Box>
  );
}
