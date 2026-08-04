"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

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
    const title = value.trim();
    // The `saving` half of this guard is load-bearing: holding Enter, or hitting it
    // twice while the POST is in flight, would otherwise create duplicate rows that
    // the admin then has to delete one by one.
    if (!title || saving) return;

    setSaving(true);
    try {
      await onCreate(title);
      // Clear before notifying the parent: onAdded triggers a tree refetch and
      // re-render, and we do not want the just-submitted text flashing back.
      setValue("");
      // Success is confirmed OUT LOUD. Only the error path toasted, and the backend appends a
      // new week at the END of the course — so past MODULES_PER_PAGE it lands on a page the
      // admin is not looking at and the screen does not change at all. Silence there reads as
      // "nothing happened", and the next move is to type it again.
      showToast(successMessage, "success");
      onAdded();
      // Stay in input mode and keep the caret so the next topic is type-Enter-type-Enter.
      // The actual focus() fires from the effect above, once the field is enabled again.
      refocusAfterSave.current = true;
    } catch (e) {
      // Keep `value` untouched on failure - retyping a title the admin already
      // typed is the most annoying possible response to a server error.
      showToast(getAxiosErrorDetail(e, errorFallback), "error");
    } finally {
      setSaving(false);
    }
  }, [value, saving, onCreate, onAdded, errorFallback, successMessage, showToast]);

  const cancel = useCallback(() => {
    setValue("");
    setEditing(false);
  }, []);

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
      <TextField
        inputRef={inputRef}
        autoFocus
        fullWidth
        size="small"
        value={value}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // The surrounding tree binds Enter/Escape/arrows for navigation, so every
          // key we handle has to stop here or it fires twice with two meanings.
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            void submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
        }}
        onBlur={() => {
          // Only an empty field collapses. Typed text survives a stray click, and
          // clicking Add cannot self-cancel because Add requires non-empty text.
          if (!saving && !value.trim()) setEditing(false);
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
      <LoadingButton
        variant="contained"
        loading={saving}
        loadingText="Adding"
        disabled={!value.trim()}
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
        }}
      >
        Add
      </LoadingButton>
    </Box>
  );
}

export function AddModuleRow({
  courseId,
  onAdded,
}: {
  courseId: number;
  onAdded: () => void;
}) {
  const onCreate = useCallback(
    async (title: string) => {
      // weekno is omitted deliberately - the backend appends at the end of the
      // course, which is what "add a week" means from this position in the tree.
      await adminAdaptiveCourseService.createModule(courseId, { title });
    },
    [courseId]
  );

  return (
    <GhostAddRow
      ghostLabel="Add week"
      successMessage="Week added — it goes at the end of the course."
      placeholder="Name this week, e.g. Functions and scope"
      onCreate={onCreate}
      onAdded={onAdded}
      errorFallback="Could not add the week. Please try again."
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
      placeholder="Name this topic"
      onCreate={onCreate}
      onAdded={onAdded}
      errorFallback="Could not add the topic. Please try again."
    />
  );
}
