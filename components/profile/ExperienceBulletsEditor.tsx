"use client";

import { useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE } from "@/components/common/mobile/phone";
import { looksLikeAList, splitIntoBullets } from "@/lib/utils/experienceBullets";

/**
 * A work-experience entry's points, edited one at a time.
 *
 * This replaced a single "Description" textarea. Whatever was typed there reached the resume as
 * whatever the builder could guess from it, so a paragraph of "• A • B • C" became one bullet
 * with the dots inline. Here each point is its own field and is stored as its own item, and the
 * resume draws one bullet per item.
 *
 * - Enter starts a new point, splitting the current one at the caret; Backspace at the start of
 *   a point joins it onto the one above. A point never holds a newline.
 * - Pasting several lines, or text with bullet markers, adds one point per bullet, with the
 *   markers dropped (the same rule that converts descriptions saved before this editor existed).
 * - Up and down reorder a point; the button keeps focus, so a keyboard user can keep moving it.
 *
 * Phone sizes live under PHONE, never in a bare `xs`, which MUI would apply at every width: the
 * three row actions are 30px squares on a desktop and 44px on a phone, where they wrap onto their
 * own line under the field instead of squeezing it.
 */

interface ExperienceBulletsEditorProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** id of the element that names the list, for aria-labelledby. */
  labelId?: string;
}

type Part = "input" | "up" | "down";

/** Only ever called from event handlers, never while rendering. */
let nextRowId = 0;
const newRowId = () => `point-${++nextRowId}`;

/** Two pieces of text as one, with a space between them when neither edge already has one. */
const glue = (a: string, b: string) => (!a || !b || /\s$/.test(a) || /^\s/.test(b) ? a + b : `${a} ${b}`);

const ROW_ACTION_SX = {
  color: "var(--font-secondary)",
  [PHONE]: { width: 44, height: 44 },
} as const;

export function ExperienceBulletsEditor({ value, onChange, labelId }: ExperienceBulletsEditorProps) {
  const { t } = useTranslation("common");

  /**
   * One stable id per row, so React keys follow a point when it moves instead of handing its
   * field (and the caret in it) to whichever point now sits in that slot. Held in state beside
   * the controlled value. If the list is replaced from outside with a different length, the new
   * rows get ids here - adjusting state while rendering is React's own pattern for a prop that
   * changed, and these ids are derived, not drawn from a counter, so rendering stays pure.
   */
  const [ids, setIds] = useState<string[]>(() => value.map((_, i) => `initial-${i}`));
  let rowIds = ids;
  if (ids.length !== value.length) {
    rowIds = value.map((_, i) => ids[i] ?? `outside-${value.length}-${i}`);
    setIds(rowIds);
  }

  const elements = useRef(new Map<string, HTMLElement>());
  const register = (key: string) => (el: HTMLElement | null) => {
    if (el) elements.current.set(key, el);
    else elements.current.delete(key);
  };

  /** Where focus goes once the next render has put the rows where they belong. */
  const pendingFocus = useRef<{ id: string; part: Part; caret?: number } | null>(null);
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const el = elements.current.get(`${target.id}:${target.part}`);
    if (!el) return;
    el.focus();
    if (target.part === "input" && target.caret !== undefined && el instanceof HTMLTextAreaElement) {
      el.setSelectionRange(target.caret, target.caret);
    }
  });

  const commit = (nextValue: string[], nextIds: string[], focus?: { id: string; part: Part; caret?: number }) => {
    pendingFocus.current = focus ?? null;
    setIds(nextIds);
    onChange(nextValue);
  };

  /** Replace row `i` with `rows`; the first keeps its id, the others get new ones. */
  const splice = (i: number, rows: string[]) => {
    const spliced = rows.map((_, k) => (k === 0 ? rowIds[i] : newRowId()));
    return {
      nextValue: [...value.slice(0, i), ...rows, ...value.slice(i + 1)],
      nextIds: [...rowIds.slice(0, i), ...spliced, ...rowIds.slice(i + 1)],
      newIds: spliced,
    };
  };

  const update = (i: number, text: string) => {
    // A newline cannot be typed (Enter starts a new point), but autocorrect and drag-and-drop can
    // still deliver one. A point is one line.
    const next = [...value];
    next[i] = text.replace(/[\r\n]+/g, " ");
    commit(next, rowIds);
  };

  const add = () => {
    const last = value.length - 1;
    if (last >= 0 && !value[last].trim()) {
      commit(value, rowIds, { id: rowIds[last], part: "input", caret: 0 });
      return;
    }
    const id = newRowId();
    commit([...value, ""], [...rowIds, id], { id, part: "input", caret: 0 });
  };

  const remove = (i: number) => {
    const nextValue = value.filter((_, k) => k !== i);
    const nextIds = rowIds.filter((_, k) => k !== i);
    if (nextValue.length === 0) {
      // The list never ends up with no field at all: there would be nowhere to type.
      const id = newRowId();
      commit([""], [id], { id, part: "input", caret: 0 });
      return;
    }
    const neighbour = nextIds[Math.min(i, nextIds.length - 1)];
    commit(nextValue, nextIds, { id: neighbour, part: "input" });
  };

  const move = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= value.length) return;
    const nextValue = [...value];
    const nextIds = [...rowIds];
    [nextValue[i], nextValue[j]] = [nextValue[j], nextValue[i]];
    [nextIds[i], nextIds[j]] = [nextIds[j], nextIds[i]];
    // Keep focus on the button that was pressed. At either end that button is now disabled, and
    // a disabled button drops focus to <body>, so the other direction takes it.
    let part: Part = delta < 0 ? "up" : "down";
    if (j === 0) part = "down";
    if (j === value.length - 1) part = "up";
    commit(nextValue, nextIds, { id: nextIds[j], part });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, i: number) => {
    const field = event.target as HTMLTextAreaElement;
    if (event.key === "Enter") {
      // An IME confirming a composition also sends Enter; that one belongs to the IME.
      if (event.nativeEvent.isComposing) return;
      event.preventDefault();
      const text = value[i];
      const start = field.selectionStart ?? text.length;
      const end = field.selectionEnd ?? text.length;
      const before = text.slice(0, start).trimEnd();
      const after = text.slice(end).trimStart();
      if (!before && !after) return; // an empty point does not breed more empty points
      const { nextValue, nextIds, newIds } = splice(i, [before, after]);
      commit(nextValue, nextIds, { id: newIds[1], part: "input", caret: 0 });
      return;
    }
    if (event.key === "Backspace" && field.selectionStart === 0 && field.selectionEnd === 0) {
      const text = value[i];
      if (!text && value.length > 1) {
        event.preventDefault();
        const nextValue = value.filter((_, k) => k !== i);
        const nextIds = rowIds.filter((_, k) => k !== i);
        const target = i > 0 ? i - 1 : 0;
        commit(nextValue, nextIds, { id: nextIds[target], part: "input", caret: i > 0 ? nextValue[target].length : 0 });
        return;
      }
      if (text && i > 0) {
        // The inverse of Enter: join this point onto the end of the one above.
        event.preventDefault();
        const above = value[i - 1];
        const joined = glue(above, text);
        const nextValue = [...value.slice(0, i - 1), joined, ...value.slice(i + 1)];
        const nextIds = [...rowIds.slice(0, i), ...rowIds.slice(i + 1)];
        commit(nextValue, nextIds, { id: nextIds[i - 1], part: "input", caret: joined.length - text.length });
      }
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>, i: number) => {
    const pasted = event.clipboardData.getData("text/plain");
    if (!pasted || !looksLikeAList(pasted)) return; // one plain sentence: the browser's own paste
    const items = splitIntoBullets(pasted);
    event.preventDefault();
    if (items.length === 0) return;
    const field = event.target as HTMLTextAreaElement;
    const text = value[i];
    const start = field.selectionStart ?? text.length;
    const end = field.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const rows =
      items.length === 1
        ? [glue(glue(before, items[0]), after)]
        : [glue(before, items[0]), ...items.slice(1, -1), glue(items[items.length - 1], after)];
    const caret = items.length === 1 ? glue(before, items[0]).length : items[items.length - 1].length;
    const { nextValue, nextIds, newIds } = splice(i, rows);
    commit(nextValue, nextIds, { id: newIds[newIds.length - 1], part: "input", caret });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        component="ul"
        aria-labelledby={labelId}
        sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}
      >
        {value.map((text, i) => {
          const id = rowIds[i];
          const n = i + 1;
          return (
            <Box
              component="li"
              key={id}
              data-testid="experience-point"
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.75,
                // On a phone the actions take their own line under the field, so the field keeps
                // the width a sentence needs.
                [PHONE]: { flexWrap: "wrap", rowGap: 0.25 },
              }}
            >
              <Box
                aria-hidden
                sx={{ pt: "9px", lineHeight: 1, color: "var(--font-tertiary)", fontSize: "1rem", flexShrink: 0 }}
              >
                •
              </Box>
              <TextField
                value={text}
                onChange={(e) => update(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
                onPaste={(e) => onPaste(e, i)}
                inputRef={register(`${id}:input`)}
                placeholder={i === 0 ? t("experienceBullets.placeholder") : undefined}
                multiline
                minRows={1}
                maxRows={6}
                size="small"
                fullWidth
                slotProps={{
                  htmlInput: { "aria-label": t("experienceBullets.pointLabel", { n, total: value.length }) },
                }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.9375rem" },
                  // 16px text on a phone: anything smaller makes iOS zoom the page on focus.
                  [PHONE]: { "& .MuiOutlinedInput-root": { fontSize: "1rem", minHeight: 44 } },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 0.25,
                  flexShrink: 0,
                  [PHONE]: { width: "100%", justifyContent: "flex-end" },
                }}
              >
                <IconButton
                  size="small"
                  ref={register(`${id}:up`)}
                  aria-label={t("experienceBullets.moveUp", { n })}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  sx={ROW_ACTION_SX}
                >
                  <IconWrapper icon="mdi:arrow-up" size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  ref={register(`${id}:down`)}
                  aria-label={t("experienceBullets.moveDown", { n })}
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  sx={ROW_ACTION_SX}
                >
                  <IconWrapper icon="mdi:arrow-down" size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={t("experienceBullets.remove", { n })}
                  onClick={() => remove(i)}
                  sx={{ ...ROW_ACTION_SX, color: "var(--error-500)" }}
                >
                  <IconWrapper icon="mdi:close" size={18} />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button
          size="small"
          startIcon={<IconWrapper icon="mdi:plus" size={16} />}
          onClick={add}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--accent-indigo)",
            [PHONE]: { minHeight: 44 },
          }}
        >
          {t("experienceBullets.add")}
        </Button>
        <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)" }}>
          {t("experienceBullets.hint")}
        </Typography>
      </Box>
    </Box>
  );
}
