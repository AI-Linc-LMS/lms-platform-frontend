"use client";

import { useCallback, useState } from "react";
import { Box, ButtonBase, TextField, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

const INDIGO = "#6366f1";
const DANGER = "#ef4444";

/**
 * Click-to-edit title for the module and topic rows of the course tree, the read
 * counterpart to the ghost add rows in `ManualTreeControls`.
 *
 * `onSave` is expected to reject when the request fails: the field then stays open
 * holding what the admin typed, rather than collapsing back to the old title and
 * making a failed rename look like a successful no-op.
 */
export function InlineEditableTitle({
  value,
  onSave,
  label,
  fontSize = "0.95rem",
  fontWeight = 700,
}: {
  value: string;
  onSave: (title: string) => Promise<void>;
  /** Accessible name / tooltip for the edit affordance, e.g. "Rename this week". */
  label: string;
  fontSize?: string;
  fontWeight?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const open = useCallback(() => {
    setDraft(value);
    setEditing(true);
  }, [value]);

  const submit = useCallback(async () => {
    const title = draft.trim();
    // The `saving` half of the guard stops a held Enter from firing the PATCH twice.
    if (!title || saving) return;
    if (title === value.trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(title);
      setEditing(false);
    } catch {
      // The caller has already toasted the API detail. Staying open preserves the text.
    } finally {
      setSaving(false);
    }
  }, [draft, saving, value, onSave]);

  if (!editing) {
    return (
      <Tooltip title={label} arrow placement="top">
        <ButtonBase
          onClick={(e) => {
            // Tree rows around this are click-to-expand; without this the accordion
            // toggles at the same moment the field opens.
            e.stopPropagation();
            open();
          }}
          aria-label={label}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            maxWidth: "100%",
            minWidth: 0,
            px: 0.5,
            mx: -0.5,
            py: 0.15,
            borderRadius: 1.5,
            textAlign: "left",
            "& .acb-rename-pencil": { opacity: 0.4, flexShrink: 0 },
            "&:hover": { bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)" },
            "&:hover .acb-rename-pencil": { opacity: 1, color: INDIGO },
          }}
        >
          {/* Wraps rather than truncates: a clipped week title with no tooltip of its
              own would hide the one thing the row is named for. `break-word`, NOT
              `anywhere` - `anywhere` also shrinks the intrinsic min-content width to a
              single character, so inside a shrink-to-fit flex row even a four-letter
              title stacks itself vertically ("te / st"). */}
          <Typography
            sx={{ fontWeight, fontSize, lineHeight: 1.25, minWidth: 0, overflowWrap: "break-word" }}
          >
            {value}
          </Typography>
          <Icon icon="mdi:pencil-outline" width={13} className="acb-rename-pencil" />
        </ButtonBase>
      </Tooltip>
    );
  }

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{ display: "flex", alignItems: "center", gap: 0.25, minWidth: 0, flex: 1 }}
    >
      <TextField
        autoFocus
        fullWidth
        size="small"
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // The tree binds Enter/Escape for its own navigation, so both keys have to
          // stop here or they fire twice with two different meanings.
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            void submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setEditing(false);
          }
        }}
        onBlur={() => {
          // Only an untouched field collapses on blur. Edited text survives a stray
          // click, and the Save button below can never cancel itself by blurring.
          if (!saving && draft.trim() === value.trim()) setEditing(false);
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "var(--card-bg)",
            color: "var(--font-primary)",
            fontSize,
            fontWeight,
            borderRadius: "8px",
            "& fieldset": { borderColor: INDIGO },
            "&:hover fieldset": { borderColor: INDIGO },
            "&.Mui-focused fieldset": { borderColor: INDIGO },
          },
        }}
      />
      <Tooltip title="Save (Enter)" arrow>
        <span>
          <IconAction
            icon="mdi:check"
            label="Save the new title"
            color={INDIGO}
            disabled={saving || !draft.trim()}
            onClick={() => void submit()}
          />
        </span>
      </Tooltip>
      <Tooltip title="Cancel (Esc)" arrow>
        <span>
          <IconAction
            icon="mdi:close"
            label="Cancel renaming"
            disabled={saving}
            onClick={() => setEditing(false)}
          />
        </span>
      </Tooltip>
    </Box>
  );
}

/**
 * Trash affordance for a tree row. Always opens a confirm - `onClick` is expected to
 * stage the delete, never to fire it.
 */
export function RowDeleteButton({
  label,
  onClick,
  width = 16,
}: {
  label: string;
  onClick: () => void;
  width?: number;
}) {
  return (
    <Tooltip title={label} arrow placement="top">
      <span>
        <IconAction
          icon="mdi:trash-can-outline"
          label={label}
          width={width}
          hoverColor={DANGER}
          onClick={onClick}
        />
      </span>
    </Tooltip>
  );
}

function IconAction({
  icon,
  label,
  onClick,
  disabled,
  color,
  hoverColor = INDIGO,
  width = 16,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
  hoverColor?: string;
  width?: number;
}) {
  return (
    <ButtonBase
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        width: width + 14,
        height: width + 14,
        flexShrink: 0,
        borderRadius: 999,
        color: color ?? "var(--font-secondary)",
        "&:hover": {
          color: hoverColor,
          bgcolor: `color-mix(in srgb, ${hoverColor} 12%, transparent)`,
        },
        "&:disabled": { opacity: 0.4 },
      }}
    >
      <Icon icon={icon} width={width} />
    </ButtonBase>
  );
}
