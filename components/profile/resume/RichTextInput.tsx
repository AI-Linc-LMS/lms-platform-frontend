"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { sanitizeResumeHtml } from "./richText";

type Command = "bold" | "italic" | "underline";

/**
 * execCommand is deprecated and is still the only way to toggle formatting across an arbitrary
 * selection inside contentEditable. It is absent in jsdom and throws on an unsupported command id
 * in Firefox, so every call goes through here.
 */
function exec(command: string, value?: string): boolean {
  if (typeof document.execCommand !== "function") return false;
  try {
    return document.execCommand(command, false, value);
  } catch {
    return false;
  }
}

const COMMANDS: Array<{ key: Command; icon: string; label: string; shortcut: string }> = [
  { key: "bold", icon: "mdi:format-bold", label: "Bold", shortcut: "B" },
  { key: "italic", icon: "mdi:format-italic", label: "Italic", shortcut: "I" },
  { key: "underline", icon: "mdi:format-underline", label: "Underline", shortcut: "U" },
];

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  /** Rendered to the right of the B/I/U buttons - the row's delete button, typically. */
  actions?: React.ReactNode;
}

/**
 * A one-line-or-more resume field that can be bolded, italicised and underlined.
 *
 * contentEditable rather than a TextField with a tag-inserting toolbar, because this sits beside a
 * live preview of the page it is editing: a box showing `<b>Led</b> a team` next to a preview
 * showing **Led** a team invites the user to type the tags themselves, and then to wonder why
 * `<script>` did not work.
 *
 * The element is UNCONTROLLED and re-synced from props only while it does not have focus. A
 * contentEditable whose innerHTML is rewritten on every keystroke puts the caret back at the start
 * of the node, which makes it impossible to type a second character.
 */
export default function RichTextInput({
  value,
  onChange,
  placeholder,
  minRows = 1,
  actions,
}: RichTextInputProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState<Command[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const next = sanitizeResumeHtml(value);
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeResumeHtml(el.innerHTML);
    // An empty contentEditable is "<br>" in every browser, not "". Left alone it would save a
    // bullet that looks blank but is not, and every "is this filled in?" check would say yes.
    onChange(html === "<br>" ? "" : html);
  }, [onChange]);

  const refreshActive = useCallback(() => {
    if (typeof document.queryCommandState !== "function") return;
    setActive(COMMANDS.filter((c) => {
      try {
        return document.queryCommandState(c.key);
      } catch {
        return false;
      }
    }).map((c) => c.key));
  }, []);

  const run = useCallback((command: Command) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    // Ask for tags rather than inline CSS. The sanitiser copes with either (see
    // tagsImpliedByStyle), but tags are what the templates and the PDF read most predictably.
    exec("styleWithCSS", "false");
    exec(command);
    emit();
    refreshActive();
  }, [emit, refreshActive]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter would open a new block inside a field that is one bullet. Let the form's own
    // "Add Description Point" be the way to get another line.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      return;
    }
    if (!(event.metaKey || event.ctrlKey)) return;
    const hit = COMMANDS.find((c) => c.shortcut.toLowerCase() === event.key.toLowerCase());
    if (!hit) return;
    event.preventDefault();
    run(hit.key);
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData("text/html");
    const cleaned = html ? sanitizeResumeHtml(html) : "";
    event.preventDefault();
    // Keeps the bold from a bullet pasted out of Word, drops its fonts, colours and margins.
    const inserted = cleaned
      ? exec("insertHTML", cleaned)
      : exec("insertText", event.clipboardData.getData("text/plain"));
    if (!inserted && ref.current) ref.current.innerHTML += cleaned;
    emit();
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => { setFocused(false); emit(); }}
        onFocus={() => { setFocused(true); refreshActive(); }}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        sx={{
          minHeight: `${minRows * 1.4375 + 1}em`,
          px: 1.75,
          py: 1,
          borderRadius: 1,
          // 14px text makes iOS Safari zoom the page in the moment this takes focus, which is
          // worse in a contentEditable than in an input: the caret ends up off-screen.
          fontSize: { xs: "1rem", sm: "0.875rem" },
          lineHeight: 1.4375,
          color: "var(--font-primary)",
          border: "1px solid",
          borderColor: focused ? "var(--primary-500)" : "rgba(0, 0, 0, 0.23)",
          boxShadow: focused ? "0 0 0 1px var(--primary-500)" : "none",
          outline: "none",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          "&:hover": { borderColor: focused ? "var(--primary-500)" : "var(--font-primary)" },
          "&:empty:before": {
            content: "attr(data-placeholder)",
            color: "var(--font-tertiary, rgba(0, 0, 0, 0.45))",
            pointerEvents: "none",
          },
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
        <ToggleButtonGroup size="small" value={active}>
          {COMMANDS.map((c) => (
            <Tooltip key={c.key} title={`${c.label} (${navigatorShortcut()}+${c.shortcut})`}>
              <ToggleButton
                value={c.key}
                aria-label={c.label}
                // The button must not take focus: the selection to format lives in the field, and
                // focusing anything else collapses it.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(c.key)}
                // 26px tall on a phone, for a control whose whole job is to be pressed with a
                // thumb while the other hand holds the selection.
                sx={{
                  border: "none",
                  px: { xs: 1.5, sm: 0.75 },
                  py: { xs: 1, sm: 0.25 },
                  minWidth: { xs: 44, sm: 0 },
                  minHeight: { xs: 40, sm: 0 },
                }}
              >
                <IconWrapper icon={c.icon} size={16} />
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
        {actions}
      </Box>
    </Box>
  );
}

function navigatorShortcut(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}
