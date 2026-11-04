"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unitNoun, unitWord } from "@/lib/utils/unit-labels";
import { Box, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { PHONE } from "@/components/common/mobile/phone";
import { TAP } from "./coursePhone";
import { parseTitles } from "./parseTitles";

const INDIGO = "#6366f1";

type GhostAddRowProps = {
  /** Text shown in the collapsed ghost state. */
  ghostLabel: string;
  placeholder: string;
  /** Resolves once the row exists server-side; rejects with the axios error. */
  onCreate: (title: string) => Promise<void>;
  /** Told after each successful create so the parent can refetch the tree. */
  onAdded: () => void;
  /** Said out loud on success — the row may create something off-screen. */
  successMessage: string;
  errorFallback: string;
  /** Submodule rows sit one level deeper, so they render tighter than module rows. */
  dense?: boolean;
};

/**
 * Ghost row -> inline field. Shared by both exports below because the only real
 * differences are the copy and which service call fires.
 */
function GhostAddRow({
  ghostLabel,
  placeholder,
  onCreate,
  onAdded,
  successMessage,
  errorFallback,
  dense = false,
}: GhostAddRowProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  // Non-null only during a batch, so the button can count up instead of freezing.
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const refocusAfterSave = useRef(false);

  // The field is `disabled` for the whole save, and focus() on a disabled input is a
  // no-op - so the caret has to be restored on the render *after* saving flips back
  // to false, not inline in submit(), or every successful add drops the caret.
  useEffect(() => {
    if (saving || !refocusAfterSave.current) return;
    refocusAfterSave.current = false;
    inputRef.current?.focus();
  }, [saving]);

  const submit = useCallback(async () => {
    const titles = parseTitles(value);
    // The `saving` half of this guard is load-bearing: holding Enter, or hitting it
    // twice while the POST is in flight, would otherwise create duplicate rows that
    // the admin then has to delete one by one.
    if (!titles.length || saving) return;

    setSaving(true);
    setProgress({ done: 0, total: titles.length });

    // Sequential, and in the order typed. The backend appends each new row at the END of the
    // course, so firing these in parallel would file them in whatever order the responses
    // happened to come back - which for a pasted syllabus is the one thing that must not happen.
    let created = 0;
    let failure: unknown = null;
    for (const title of titles) {
      try {
        await onCreate(title);
        created += 1;
        setProgress({ done: created, total: titles.length });
      } catch (e) {
        failure = e;
        break;
      }
    }

    // Whatever did not get created stays in the box. Retyping a list the admin already pasted
    // is the most annoying possible response to a server error.
    const remaining = titles.slice(created);
    setValue(remaining.join("\n"));

    if (created > 0) {
      // Success is confirmed OUT LOUD. The backend appends at the END of the course, so past
      // MODULES_PER_PAGE it lands on a page the admin is not looking at and the screen does not
      // change at all. Silence there reads as "nothing happened", and the next move is to type
      // it again.
      showToast(
        titles.length === 1
          ? successMessage
          : `${created} of ${titles.length} added.${remaining.length ? " The rest are still in the box." : ""}`,
        remaining.length ? "warning" : "success"
      );
      // ONE refetch for the whole batch rather than one per row. Refetching and re-rendering
      // the tree is the slow part, and doing it twelve times is why adding a week by hand felt
      // like it did.
      onAdded();
    }
    if (failure) showToast(getAxiosErrorDetail(failure, errorFallback), "error");

    setProgress(null);
    setSaving(false);
    // Stay in input mode and keep the caret so the next topic is type-Enter-type-Enter.
    // The actual focus() fires from the effect above, once the field is enabled again.
    refocusAfterSave.current = true;
  }, [value, saving, onCreate, onAdded, errorFallback, successMessage, showToast]);

  const cancel = useCallback(() => {
    setValue("");
    setEditing(false);
  }, []);

  // What pressing Add would actually create, recomputed per render so the count on the button
  // and the line under the field can never disagree with what gets sent.
  const titles = parseTitles(value);

  if (!editing) {
    return (
      <Box
        component="button"
        type="button"
        // type="button" matters: these rows render inside course-settings forms in
        // some layouts, and a bare <button> would default to submitting them.
        onClick={(e: React.MouseEvent) => {
          // The tree rows above are click-to-expand; without this the accordion
          // toggles at the same time the field opens.
          e.stopPropagation();
          setEditing(true);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          px: dense ? 1.5 : 2,
          py: dense ? 0.85 : 1.15,
          border: "1px dashed var(--border-default)",
          borderRadius: "10px",
          bgcolor: "transparent",
          color: "var(--font-secondary)",
          cursor: "pointer",
          textAlign: "left",
          font: "inherit",
          transition: "border-color 140ms ease, color 140ms ease, background-color 140ms ease",
          "&:hover": {
            borderColor: INDIGO,
            color: INDIGO,
            bgcolor: "rgba(99, 102, 241, 0.06)",
          },
          [PHONE]: { minHeight: TAP },
        }}
      >
        <Icon icon="mdi:plus" width={16} />
        <Typography
          component="span"
          sx={{ fontSize: dense ? "0.8125rem" : "0.875rem", fontWeight: 500, color: "inherit" }}
        >
          {ghostLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        pl: dense ? 1 : 1.5,
        pr: 1,
        py: 0.5,
        border: `1px dashed ${INDIGO}`,
        borderRadius: "10px",
        bgcolor: "var(--card-bg)",
        boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.10)",
      }}
    >
      <Icon icon="mdi:plus" width={16} color={INDIGO} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
      <TextField
        inputRef={inputRef}
        autoFocus
        fullWidth
        size="small"
        // Multiline so a syllabus can be pasted straight in, one row per line. Enter still
        // submits, so the old type-Enter-type-Enter rhythm is unchanged; Shift+Enter is the
        // new line. maxRows keeps a forty-line paste from pushing the tree off screen.
        multiline
        maxRows={10}
        value={value}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // The surrounding tree binds Enter/Escape/arrows for navigation, so every
          // key we handle has to stop here or it fires twice with two meanings.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            void submit();
          } else if (e.key === "Enter") {
            // Shift+Enter writes a new line. Stopped here all the same, or the tree's own
            // Enter binding fires alongside it.
            e.stopPropagation();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
        }}
        onBlur={() => {
          // Only an empty field collapses. Typed text survives a stray click, and
          // clicking Add cannot self-cancel because Add requires non-empty text.
          if (!saving && !titles.length) setEditing(false);
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "transparent",
            color: "var(--font-primary)",
            fontSize: dense ? "0.8125rem" : "0.875rem",
            "& fieldset": { border: "none" },
            "&:hover fieldset": { border: "none" },
            "&.Mui-focused fieldset": { border: "none" },
          },
          "& .MuiOutlinedInput-input::placeholder": {
            color: "var(--font-secondary)",
            opacity: 0.75,
          },
        }}
      />
      {titles.length > 1 && (
        // Shown rather than silently deduplicated: a doubled line is usually a paste slip, but
        // it is sometimes two real sections with the same name, so the admin decides.
        <Typography
          sx={{ px: 1.5, pb: 0.5, fontSize: "0.75rem", color: "var(--font-secondary)" }}
        >
          {titles.length} rows, one per line — they are added in this order.
        </Typography>
      )}
      </Box>
      <LoadingButton
        variant="contained"
        loading={saving}
        loadingText={
          progress && progress.total > 1
            ? `Adding ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`
            : "Adding"
        }
        disabled={titles.length === 0}
        onClick={() => void submit()}
        sx={{
          flexShrink: 0,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.8125rem",
          px: 2,
          borderRadius: "8px",
          bgcolor: INDIGO,
          "&:hover": { bgcolor: "#4f46e5" },
          [PHONE]: { minHeight: TAP },
        }}
      >
        {titles.length > 1 ? `Add ${titles.length}` : "Add"}
      </LoadingButton>
    </Box>
  );
}

export function AddModuleRow({
  courseId,
  onAdded,
  course,
}: {
  courseId: number;
  onAdded: () => void;
  /** Carries module_only_structure, so the control says "module" on a module-framed course. */
  course?: { module_only_structure?: boolean } | null;
}) {
  const onCreate = useCallback(
    async (title: string) => {
      // weekno is omitted deliberately - the backend appends at the end of the
      // course, which is what "add a week" means from this position in the tree.
      await adminAdaptiveCourseService.createModule(courseId, { title });
    },
    [courseId]
  );

  const Unit = unitNoun(course);
  const unit = unitWord(course);
  return (
    <GhostAddRow
      ghostLabel={`Add ${unit}`}
      successMessage={`${Unit} added, it goes at the end of the course.`}
      placeholder={`Name this ${unit} — or paste a list, one per line`}
      onCreate={onCreate}
      onAdded={onAdded}
      errorFallback={`Could not add the ${unit}. Please try again.`}
    />
  );
}

export function AddSubmoduleRow({
  courseId,
  moduleId,
  onAdded,
}: {
  courseId: number;
  moduleId: number;
  onAdded: () => void;
}) {
  const onCreate = useCallback(
    async (title: string) => {
      await adminAdaptiveCourseService.createSubmodule(courseId, moduleId, { title });
    },
    [courseId, moduleId]
  );

  return (
    <GhostAddRow
      dense
      ghostLabel="Add topic"
      successMessage="Topic added."
      placeholder="Name this topic — or paste a list, one per line"
      onCreate={onCreate}
      onAdded={onAdded}
      errorFallback="Could not add the topic. Please try again."
    />
  );
}
