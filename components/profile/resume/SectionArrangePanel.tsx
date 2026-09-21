"use client";

import { Box, Button, IconButton, Paper, Switch, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  moveSection,
  resolveOrder,
  SECTION_LABELS,
  setColumn,
  toggleHidden,
  type ColumnName,
  type DocumentSections,
  type ResumeLayout,
  type SectionId,
} from "./paging/sectionLayout";
import { PANEL_BORDER, PROFILE } from "../theme/profileTokens";

interface SectionArrangePanelProps {
  layout: ResumeLayout;
  onChange: (layout: ResumeLayout) => void;
  onReset: () => void;
  /** What the current template has, and where it puts it. */
  sections: DocumentSections;
  template: string;
  /** How many entries the learner has in each section, so an empty one can say so. */
  counts: Partial<Record<SectionId, number>>;
}

const COLUMN_LABELS: Record<ColumnName, string> = { main: "Main column", side: "Sidebar" };

/**
 * The move and column controls are 30px squares at desktop density. This panel's own comment says
 * the learners who need it most are on phones, where 30px is half a fingertip and the three
 * buttons sit 4px apart.
 */
const TAP = { width: { xs: 40, sm: 30 }, height: { xs: 40, sm: 30 } } as const;

/**
 * Reorder, hide and move the resume's sections.
 *
 * "[Resume Builder] No option for reordering the sections." There was drag code in the form and an
 * unused SectionManager component, but nothing rendered a handle and nothing read the order: the
 * preview never changed. This panel is wired to the document itself.
 *
 * Buttons, not drag-and-drop. Move up and down works with a keyboard, works on a phone, and says
 * out loud what it did; a drag handle does none of the three without a good deal of extra care,
 * and the learners who need this most are on phones.
 */
export function SectionArrangePanel({
  layout,
  onChange,
  onReset,
  sections,
  template,
  counts,
}: SectionArrangePanelProps) {
  const order = resolveOrder(layout, sections.order);
  const columnOf = (id: SectionId): ColumnName | undefined =>
    layout.columns[template]?.[id] ?? sections.columns[id];

  const columns: ColumnName[] = sections.hasColumns ? ["main", "side"] : [];
  const groups: Array<{ column?: ColumnName; ids: SectionId[] }> = columns.length
    ? columns.map((column) => ({ column, ids: order.filter((id) => columnOf(id) === column) }))
    : [{ ids: order }];

  const move = (id: SectionId, delta: number) => {
    // Move past the next section IN THE SAME COLUMN, so one press moves one place on screen.
    const siblings = groups.find((g) => g.ids.includes(id))?.ids ?? order;
    const here = siblings.indexOf(id);
    const neighbour = siblings[here + delta];
    if (!neighbour) return;
    const from = order.indexOf(id);
    const to = order.indexOf(neighbour);
    onChange(moveSection(layout, order, id, to - from));
  };

  const rows = (ids: SectionId[], column?: ColumnName) =>
    ids.map((id, index) => {
      const hidden = layout.hidden.includes(id);
      const count = counts[id] ?? 0;
      return (
        <Box
          key={id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.25, sm: 0.5 },
            py: { xs: 0.5, sm: 0.75 },
            px: { xs: 0.5, sm: 1 },
            borderRadius: 2,
            backgroundColor: hidden ? "transparent" : "var(--surface)",
            opacity: hidden ? 0.55 : 1,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: { xs: "0.9rem", sm: "0.8rem" }, fontWeight: 600, color: PROFILE.ink }}>
              {SECTION_LABELS[id]}
            </Typography>
            <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.65rem" }, color: PROFILE.inkFaint }}>
              {hidden ? "Hidden" : count === 0 ? "Empty, will not print" : `${count} ${count === 1 ? "entry" : "entries"}`}
            </Typography>
          </Box>

          <Tooltip title={`Move ${SECTION_LABELS[id]} up`}>
            <span>
              <IconButton
                size="small"
                disabled={index === 0}
                onClick={() => move(id, -1)}
                aria-label={`Move ${SECTION_LABELS[id]} up`}
                sx={TAP}
              >
                <IconWrapper icon="mdi:chevron-up" size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={`Move ${SECTION_LABELS[id]} down`}>
            <span>
              <IconButton
                size="small"
                disabled={index === ids.length - 1}
                onClick={() => move(id, 1)}
                aria-label={`Move ${SECTION_LABELS[id]} down`}
                sx={TAP}
              >
                <IconWrapper icon="mdi:chevron-down" size={18} />
              </IconButton>
            </span>
          </Tooltip>

          {column && (
            <Tooltip title={`Move to the ${column === "main" ? "sidebar" : "main column"}`}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => onChange(setColumn(layout, template, id, column === "main" ? "side" : "main"))}
                  aria-label={`Move ${SECTION_LABELS[id]} to the ${column === "main" ? "sidebar" : "main column"}`}
                  sx={TAP}
                >
                  <IconWrapper icon={column === "main" ? "mdi:arrow-left-bold-outline" : "mdi:arrow-right-bold-outline"} size={17} />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title={hidden ? `Show ${SECTION_LABELS[id]}` : `Hide ${SECTION_LABELS[id]}`}>
            <Switch
              size="small"
              checked={!hidden}
              onChange={() => onChange(toggleHidden(layout, id))}
              inputProps={{ "aria-label": `Show ${SECTION_LABELS[id]} on the resume` }}
              // A small switch is a 24px-tall target. The hidden input is what is actually
              // pressed, so it grows to 40px while the track and thumb stay exactly where they
              // are: a bigger target with no change to the drawing.
              sx={{
                flexShrink: 0,
                "& .MuiSwitch-input": {
                  top: { xs: -8, sm: 0 },
                  height: { xs: "calc(100% + 16px)", sm: "100%" },
                },
              }}
            />
          </Tooltip>
        </Box>
      );
    });

  return (
    <Paper
      elevation={0}
      sx={{ p: 1.5, mb: 2, borderRadius: 4, border: PANEL_BORDER, backgroundColor: "var(--card-bg)" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <IconWrapper icon="mdi:sort-variant" size={18} color="var(--accent-purple)" />
          <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.95rem", sm: "0.85rem" }, color: PROFILE.ink }}>
            Arrange sections
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={onReset}
          sx={{ textTransform: "none", fontSize: { xs: "0.82rem", sm: "0.72rem" }, minHeight: { xs: 40, sm: "auto" } }}
        >
          Reset
        </Button>
      </Box>

      {groups.map((group) => (
        <Box key={group.column ?? "single"} sx={{ mb: 1 }}>
          {group.column && (
            <Typography sx={{ fontSize: { xs: "0.72rem", sm: "0.65rem" }, fontWeight: 700, color: PROFILE.inkFaint, textTransform: "uppercase", mb: 0.5, px: 1 }}>
              {COLUMN_LABELS[group.column]}
            </Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {group.ids.length ? (
              rows(group.ids, group.column)
            ) : (
              <Typography sx={{ fontSize: { xs: "0.78rem", sm: "0.7rem" }, color: PROFILE.inkFaint, px: 1 }}>
                Nothing here yet.
              </Typography>
            )}
          </Box>
        </Box>
      ))}

      <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.65rem" }, color: PROFILE.inkFaint, px: 1 }}>
        {sections.hasColumns
          ? "The order and what is hidden follow you between templates. Which column a section sits in is remembered per template."
          : "The order and what is hidden follow you between templates."}
      </Typography>
    </Paper>
  );
}
