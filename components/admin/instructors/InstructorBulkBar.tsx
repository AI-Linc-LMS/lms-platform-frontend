"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { TAP } from "@/components/admin/adminPhone";
import { PHONE } from "@/components/common/mobile/phone";

export interface BulkProgress {
  done: number;
  total: number;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  /** Destructive actions are red and never the leftmost button. */
  danger?: boolean;
  onRun: () => void;
}

interface InstructorBulkBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
  /** Non-null while a bulk run is in flight; every control is locked until it finishes. */
  progress: BulkProgress | null;
  children?: ReactNode;
}

export function InstructorBulkBar({
  count,
  actions,
  onClear,
  progress,
  children,
}: InstructorBulkBarProps) {
  const { t } = useTranslation("common");
  if (count === 0) return null;

  const running = progress !== null;

  return (
    <Box
      data-testid="bulk-bar"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        p: 1.25,
        mb: 1.5,
        borderRadius: 2,
        border: "1px solid var(--primary-500, #6366f1)",
        backgroundColor:
          "color-mix(in srgb, var(--primary-500, #6366f1) 8%, var(--card-bg))",
      }}
    >
      <Typography
        data-testid="bulk-count"
        sx={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--font-primary)" }}
      >
        {/* Counts the rows CURRENTLY on screen. Selection is pruned to the filtered set, so
            this number and the checked boxes can never disagree. */}
        {t("adminInstructors.bulk.selected", {
          defaultValue: `${count} selected`,
          n: count,
        })}
      </Typography>

      <Box sx={{ flexGrow: 1 }} />

      {running ? (
        <Stack direction="row" spacing={1.25} alignItems="center" data-testid="bulk-progress">
          <CircularProgress size={18} />
          <Typography sx={{ fontSize: "0.8125rem", color: "var(--font-secondary)" }}>
            {t("adminInstructors.bulk.progress", {
              defaultValue: `${progress.done} of ${progress.total} done`,
              done: progress.done,
              total: progress.total,
            })}
          </Typography>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {children}
          {actions.map((a) => (
            <Button
              key={a.id}
              size="small"
              variant={a.danger ? "outlined" : "contained"}
              color={a.danger ? "error" : "primary"}
              onClick={a.onRun}
              data-testid={`bulk-${a.id}`}
              startIcon={<IconWrapper icon={a.icon} size={16} />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                minHeight: 36,
                [PHONE]: { minHeight: TAP },
              }}
            >
              {a.label}
            </Button>
          ))}
          <Button
            size="small"
            onClick={onClear}
            data-testid="bulk-clear"
            sx={{
              textTransform: "none",
              color: "var(--font-secondary)",
              minHeight: 36,
              [PHONE]: { minHeight: TAP },
            }}
          >
            {t("adminInstructors.bulk.clear", { defaultValue: "Clear" })}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
