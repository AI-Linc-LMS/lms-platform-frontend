import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

type MonacoType = any;

export interface AppEditorProps {
  language: string;
  theme: "vs-dark" | "light" | string;
  value: string;
  onChange: (code: string) => void;
  disableCopyPaste?: boolean;
  height?: string | number;
  className?: string;
  onMount?: (editor: any, monaco: MonacoType) => void;
}

const AppEditor: React.FC<AppEditorProps> = ({
  language,
  theme,
  value,
  onChange,
  disableCopyPaste = false,
  height = "100%",
  className,
  onMount,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [editorCode, setEditorCode] = useState(value);

  useEffect(() => {
    setEditorCode(value);
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (editor && monaco) {
      monaco.editor.setTheme(theme);
      const model = editor.getModel?.();
      if (model) {
        const mapped =
          language === "python3"
            ? "python"
            : language === "c++"
            ? "cpp"
            : language || "plaintext";
        try {
          monaco.editor.setModelLanguage(model, mapped);
        } catch (e) {
          console.error("Error setting language:", e);
        }
      }

      if (disableCopyPaste) {
        // Block Ctrl/Cmd+V in the editor
        const disposable = editor.onKeyDown((e: any) => {
          const isPaste =
            (e.ctrlKey || e.metaKey) && (e.keyCode === 33 || e.keyCode === 52);
          if (isPaste) {
            e.preventDefault();
          }
        });
        return () => {
          try {
            disposable?.dispose?.();
          } catch (e) {
            console.error("Error disposing listener:", e);
          }
        };
      }
    }
  }, [theme, language, disableCopyPaste]);

  const handleCodeChange = (newCode: string | undefined) => {
    const code = newCode ?? "";
    setEditorCode(code);
    onChange(code);
  };

  const handleEditorDidMount = (editor: any, monaco: MonacoType) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme(theme);

    const model = editor.getModel?.();
    if (model) {
      const mapped =
        language === "python3"
          ? "python"
          : language === "c++"
          ? "cpp"
          : language || "plaintext";
      try {
        monaco.editor.setModelLanguage(model, mapped);
      } catch (e) {
        console.error("Error setting language on mount:", e);
      }
    }

    onMount?.(editor, monaco);
  };

  return (
    <div className={className}>
      <Editor
        height={height}
        language={
          language === "python3"
            ? "python"
            : language === "c++"
            ? "cpp"
            : language || "plaintext"
        }
        value={editorCode}
        theme={theme}
        onChange={handleCodeChange}
        onMount={handleEditorDidMount}
        options={{
          pasteAs: {
            enabled: true,
            showPasteSelector: "never",
          },
          hover: {
            enabled: false,
          },
          parameterHints: {
            enabled: false,
          },
          minimap: { enabled: false },
          contextmenu: false,
          quickSuggestions: false,
          insertSpaces: true,
          wordBasedSuggestions: "off",
          occurrencesHighlight: "off",
          renderLineHighlight: "none",
          scrollBeyondLastLine: false,
          overviewRulerBorder: false,
          lineDecorationsWidth: "10px",
          defaultColorDecorators: "always",
          renderValidationDecorations: "on",
          roundedSelection: false,
          colorDecorators: false,
          hideCursorInOverviewRuler: true,
          matchBrackets: "always",
          selectionHighlight: false,
          find: {
            cursorMoveOnType: false,
            addExtraSpaceOnTop: false,
          },
          lineNumbersMinChars: 3,
          cursorWidth: 2,
          fontSize: 15,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default AppEditor;
