"use client";

import { memo, useEffect, useRef, useState, useId } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Typography,
} from "@mui/material";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { IconWrapper } from "@/components/common/IconWrapper";

export type RichTextEditorFeature =
  | "bold"
  | "italic"
  | "underline"
  | "headings"
  | "lists"
  | "link"
  | "code"
  | "image"
  | "history";

export const ALL_RICH_TEXT_FEATURES: RichTextEditorFeature[] = [
  "bold",
  "italic",
  "underline",
  "headings",
  "lists",
  "link",
  "code",
  "image",
  "history",
];

export interface RichTextEditorProps {
  /** Current value. HTML string when mode="html"; plain text when mode="text". */
  value: string;
  onChange: (value: string) => void;
  /** Editing surface. Defaults to "html" (Tiptap WYSIWYG). "text" renders a plain multiline field. */
  mode?: "html" | "text";
  placeholder?: string;
  readOnly?: boolean;
  /** Field label shown above the editor. */
  label?: string;
  helperText?: React.ReactNode;
  error?: string;
  /** Whether the field is required (cosmetic; shows asterisk after label). */
  required?: boolean;
  /** Minimum content area height (excludes toolbar). Default 140px. */
  minHeight?: number | string;
  /** Maximum content area height; content scrolls beyond this. */
  maxHeight?: number | string;
  /** Subset of toolbar features to show (html mode only). Defaults to all. */
  toolbar?: RichTextEditorFeature[];
  /** Forwarded id used to wire label → field. */
  id?: string;
  "aria-label"?: string;
  /** For text mode: pass-through textarea row hints. */
  minRows?: number;
  maxRows?: number;
}

const toolbarButtonSx = {
  borderRadius: 1,
  width: 32,
  height: 32,
  color: "var(--font-secondary)",
  "&.is-active": {
    bgcolor:
      "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
    color: "var(--accent-indigo)",
  },
  "&:hover": {
    bgcolor:
      "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
  },
};

function ToolbarButton({
  icon,
  title,
  onClick,
  active,
  disabled,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip title={title} arrow placement="top">
      <span>
        <IconButton
          size="small"
          onMouseDown={(e) => {
            // Prevent the editor from losing focus when clicking toolbar buttons.
            e.preventDefault();
          }}
          onClick={onClick}
          disabled={disabled}
          className={active ? "is-active" : ""}
          sx={toolbarButtonSx}
          aria-label={title}
          aria-pressed={active || undefined}
        >
          <IconWrapper icon={icon} size={18} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label?: string;
  required?: boolean;
  htmlFor: string;
}) {
  if (!label) return null;
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      variant="caption"
      sx={{
        display: "block",
        fontWeight: 600,
        color: "var(--font-secondary)",
        mb: 0.5,
      }}
    >
      {label}
      {required ? (
        <Box component="span" sx={{ color: "var(--danger-500, #d32f2f)", ml: 0.5 }}>
          *
        </Box>
      ) : null}
    </Typography>
  );
}

function FooterText({
  helperText,
  error,
}: {
  helperText?: React.ReactNode;
  error?: string;
}) {
  if (!error && !helperText) return null;
  return (
    <Typography
      variant="caption"
      sx={{
        mt: 0.5,
        display: "block",
        color: error ? "var(--danger-500, #d32f2f)" : "var(--font-secondary)",
        lineHeight: 1.45,
      }}
    >
      {error || helperText}
    </Typography>
  );
}

function Toolbar({
  editor,
  features,
  readOnly,
}: {
  editor: Editor;
  features: RichTextEditorFeature[];
  readOnly?: boolean;
}) {
  const has = (f: RichTextEditorFeature) => features.includes(f);

  const promptForLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return; // cancel
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    let href = url.trim();
    if (!/^https?:\/\//i.test(href) && !href.startsWith("mailto:")) {
      href = `https://${href}`;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target: "_blank", rel: "noopener noreferrer" })
      .run();
  };

  const promptForImage = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.25,
        px: 0.75,
        py: 0.5,
        borderBottom: "1px solid",
        borderColor: "var(--border-default)",
        bgcolor: "var(--surface)",
        opacity: readOnly ? 0.6 : 1,
        pointerEvents: readOnly ? "none" : "auto",
      }}
      role="toolbar"
      aria-label="Formatting"
    >
      {has("bold") && (
        <ToolbarButton
          icon="mdi:format-bold"
          title="Bold (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        />
      )}
      {has("italic") && (
        <ToolbarButton
          icon="mdi:format-italic"
          title="Italic (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        />
      )}
      {has("underline") && (
        <ToolbarButton
          icon="mdi:format-underline"
          title="Underline (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        />
      )}
      {has("headings") && (
        <>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton
            icon="mdi:format-header-1"
            title="Heading 1"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
          />
          <ToolbarButton
            icon="mdi:format-header-2"
            title="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
          />
          <ToolbarButton
            icon="mdi:format-header-3"
            title="Heading 3"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
          />
          <ToolbarButton
            icon="mdi:format-paragraph"
            title="Paragraph"
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive("paragraph")}
          />
        </>
      )}
      {has("lists") && (
        <>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton
            icon="mdi:format-list-bulleted"
            title="Bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
          />
          <ToolbarButton
            icon="mdi:format-list-numbered"
            title="Numbered list"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
          />
        </>
      )}
      {has("link") && (
        <>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton
            icon="mdi:link-variant"
            title="Insert / edit link"
            onClick={promptForLink}
            active={editor.isActive("link")}
          />
          {editor.isActive("link") && (
            <ToolbarButton
              icon="mdi:link-variant-off"
              title="Remove link"
              onClick={() =>
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              }
            />
          )}
        </>
      )}
      {has("code") && (
        <>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton
            icon="mdi:code-tags"
            title="Inline code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
          />
          <ToolbarButton
            icon="mdi:code-braces"
            title="Code block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
          />
        </>
      )}
      {has("image") && (
        <>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.25, my: 0.5 }} />
          <ToolbarButton
            icon="mdi:image-outline"
            title="Insert image by URL"
            onClick={promptForImage}
          />
        </>
      )}
      {has("history") && (
        <>
          <Box sx={{ flex: 1 }} />
          <ToolbarButton
            icon="mdi:undo"
            title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
          <ToolbarButton
            icon="mdi:redo"
            title="Redo (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </>
      )}
    </Box>
  );
}

/**
 * Reusable rich-text editor used across admin/learner surfaces.
 *
 * - `mode="html"` renders a Tiptap WYSIWYG and emits HTML strings.
 * - `mode="text"` renders a plain multiline TextField (no formatting) so the
 *   same component can stand in for any existing plain-text field without
 *   changing the stored value's format.
 *
 * Single `value` in/out keeps the API identical to a `<TextField>` so consumers
 * don't need to know which mode they're rendering.
 */
function RichTextEditorInner({
  value,
  onChange,
  mode = "html",
  placeholder,
  readOnly = false,
  label,
  helperText,
  error,
  required,
  minHeight = 140,
  maxHeight,
  toolbar = ALL_RICH_TEXT_FEATURES,
  id,
  "aria-label": ariaLabel,
  minRows = 4,
  maxRows,
}: RichTextEditorProps) {
  const reactId = useId();
  const fieldId = id ?? `rte-${reactId}`;

  if (mode === "text") {
    return (
      <Box>
        <FieldLabel label={label} required={required} htmlFor={fieldId} />
        <TextField
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          multiline
          minRows={minRows}
          maxRows={maxRows}
          disabled={readOnly}
          placeholder={placeholder}
          error={Boolean(error)}
          helperText={error || helperText}
          inputProps={{ "aria-label": ariaLabel ?? label }}
          FormHelperTextProps={{
            sx: {
              fontSize: "0.8125rem",
              lineHeight: 1.45,
              color: "var(--font-secondary)",
              mt: 0.5,
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <FieldLabel label={label} required={required} htmlFor={fieldId} />
      <RichTextEditorHtml
        id={fieldId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        minHeight={minHeight}
        maxHeight={maxHeight}
        toolbar={toolbar}
        ariaLabel={ariaLabel ?? label}
        hasError={Boolean(error)}
      />
      <FooterText helperText={helperText} error={error} />
    </Box>
  );
}

function RichTextEditorHtml({
  id,
  value,
  onChange,
  placeholder,
  readOnly,
  minHeight,
  maxHeight,
  toolbar,
  ariaLabel,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight: number | string;
  maxHeight?: number | string;
  toolbar: RichTextEditorFeature[];
  ariaLabel?: string;
  hasError?: boolean;
}) {
  // Track the last value we emitted so external updates don't fight user input.
  const lastEmittedRef = useRef<string>(value);
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    // Required for Next.js app router (SSR) - avoids hydration mismatch warnings.
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        // StarterKit ships bold/italic/underline/link/lists/code/codeBlock/
        // heading/paragraph/history/etc. Keep its defaults.
      }),
      Image.configure({ inline: false, allowBase64: false }),
      ...(placeholder
        ? [Placeholder.configure({ placeholder, emptyEditorClass: "is-editor-empty" })]
        : []),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel ?? "Rich text editor",
        class: "rich-text-editor__content",
      },
    },
    onUpdate({ editor: ed }) {
      const html = ed.getHTML();
      // Tiptap returns "<p></p>" for empty content; normalize to "" so empty
      // states round-trip and required checks elsewhere keep working.
      const normalized = html === "<p></p>" ? "" : html;
      lastEmittedRef.current = normalized;
      onChange(normalized);
    },
    onFocus() {
      setFocused(true);
    },
    onBlur() {
      setFocused(false);
    },
  });

  // Sync external value changes (form reset, draft load) without clobbering
  // the user's in-progress edits.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    const current = editor.getHTML();
    if (value === current) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastEmittedRef.current = value;
  }, [value, editor]);

  // Keep editable state in sync when readOnly toggles.
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  if (!editor) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 1.5,
          minHeight,
          bgcolor: "var(--surface)",
        }}
      />
    );
  }

  const borderColor = hasError
    ? "var(--danger-500, #d32f2f)"
    : focused
    ? "var(--accent-indigo)"
    : "var(--border-default)";

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        overflow: "hidden",
        bgcolor: "var(--card-bg, var(--surface))",
        borderColor,
        borderWidth: focused || hasError ? 2 : 1,
        transition: "border-color 0.15s ease",
        // Editor content styles
        "& .rich-text-editor__content": {
          minHeight,
          maxHeight,
          overflowY: maxHeight ? "auto" : undefined,
          px: 1.5,
          py: 1.25,
          outline: "none",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: "var(--font-primary)",
        },
        "& .rich-text-editor__content p": { my: 0.5 },
        "& .rich-text-editor__content h1": {
          fontSize: "1.5rem",
          fontWeight: 700,
          my: 1,
        },
        "& .rich-text-editor__content h2": {
          fontSize: "1.25rem",
          fontWeight: 700,
          my: 1,
        },
        "& .rich-text-editor__content h3": {
          fontSize: "1.05rem",
          fontWeight: 700,
          my: 0.75,
        },
        "& .rich-text-editor__content ul, & .rich-text-editor__content ol": {
          pl: 3,
          my: 0.5,
        },
        "& .rich-text-editor__content a": {
          color: "var(--accent-indigo)",
          textDecoration: "underline",
        },
        "& .rich-text-editor__content code": {
          bgcolor:
            "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
          px: 0.5,
          py: 0.1,
          borderRadius: 0.5,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "0.85em",
        },
        "& .rich-text-editor__content pre": {
          bgcolor:
            "color-mix(in srgb, var(--accent-indigo) 6%, var(--surface) 94%)",
          border: "1px solid var(--border-default)",
          borderRadius: 1,
          p: 1.25,
          overflowX: "auto",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "0.85em",
        },
        "& .rich-text-editor__content img": {
          maxWidth: "100%",
          height: "auto",
          borderRadius: 0.5,
        },
        // Placeholder via attribute on the empty doc
        "& .rich-text-editor__content p.is-empty:first-of-type::before":
          placeholder
            ? {
                content: `"${placeholder.replace(/"/g, '\\"')}"`,
                color: "var(--font-tertiary, #98a2b3)",
                float: "left",
                height: 0,
                pointerEvents: "none",
              }
            : undefined,
      }}
    >
      <Toolbar editor={editor} features={toolbar} readOnly={readOnly} />
      <EditorContent editor={editor} />
    </Paper>
  );
}

// Exposed as a memo'd component so callers can pass stable props (value,
// onChange, toolbar array) and skip re-renders driven by unrelated state.
export const RichTextEditor = memo(RichTextEditorInner);

export default RichTextEditor;
