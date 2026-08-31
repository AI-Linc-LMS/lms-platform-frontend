"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatCount } from "@/lib/jobs-v2/format";
import { J, MOTION, R, SHADOW, TYPE, focusRing, srOnly } from "./jobsTokens";
import { JButton } from "./JButton";
import { JConfirm } from "./JModal";
import { MicroRuleList } from "./Surfaces";

/** One flex row on `md+`; wraps to a stacked grid below it. Layout only, no chrome. */
export function Toolbar({
  start,
  end,
  children,
  sx,
  ...rest
}: {
  start?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}) {
  return (
    <Box
      {...rest}
      sx={[
        {
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {(start || children) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            minWidth: 0,
            flex: 1,
          }}
        >
          {start}
          {children}
        </Box>
      )}
      {end && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.25,
            flexShrink: 0,
            justifyContent: { xs: "flex-start", md: "flex-end" },
          }}
        >
          {end}
        </Box>
      )}
    </Box>
  );
}

export type BulkId = string | number;

export interface BulkOutcome {
  ok: number;
  failed: Array<{ id: BulkId; title: string; reason: string }>;
}

export interface BulkAction {
  key: string;
  label: string;
  icon: string;
  tone?: "neutral" | "danger";
  /** A control instead of a button (a status select, say). Rendered in the trailing slot. */
  render?: ReactNode;
  /**
   * **One request per action.** Two sequential requests behind one button (status THEN
   * visibility) is two named actions, not one. `failedIds` is passed on "Retry failed".
   */
  onRun: (failedIds?: BulkId[]) => Promise<BulkOutcome>;
  /** NOT optional. Every bulk action states its consequences before it runs. */
  confirm: { title: string; body?: string; consequences: string[] };
}

export interface BulkActionBarProps {
  count: number;
  /** Already translated AND already pluralised by the caller. */
  noun: string;
  onClear: () => void;
  actions: BulkAction[];
  busy?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * ONE bulk bar, built once, used by all three admin lists.
 *
 * Two things it fixes beyond the duplication:
 *   - **`confirm` is required by the type.** Publishing 40 jobs to every student can no longer
 *     be one click while deleting one job takes a dialog.
 *   - **Results are an outcome summary, not a toast.** "M skipped" with no list, and a partial
 *     write reported as a total failure, both die here: the bar names what failed and why, and
 *     offers "Retry failed".
 */
export function BulkActionBar({
  count,
  noun,
  onClear,
  actions,
  busy,
  sx,
  ...rest
}: BulkActionBarProps) {
  const { t } = useTranslation("common");
  const [pending, setPending] = useState<BulkAction | null>(null);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<{ action: BulkAction; result: BulkOutcome } | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const wasVisible = useRef(false);

  const visible = count > 0;

  // The bar takes focus the first time it appears, so a keyboard user is not left selecting
  // rows with the actions parked somewhere they never reach.
  useEffect(() => {
    if (visible && !wasVisible.current) barRef.current?.focus();
    wasVisible.current = visible;
  }, [visible]);

  // A cleared selection cannot keep showing the previous run's summary.
  useEffect(() => {
    if (!visible) setOutcome(null);
  }, [visible]);

  const run = async (action: BulkAction, failedIds?: BulkId[]) => {
    setRunning(true);
    try {
      const result = await action.onRun(failedIds);
      setOutcome({ action, result });
    } catch (err) {
      setOutcome({
        action,
        result: {
          ok: 0,
          failed: [
            {
              id: "__all__",
              title: action.label,
              reason: (err as Error)?.message ?? (t("jobsV2.bulk.unknownError") as string),
            },
          ],
        },
      });
    } finally {
      setRunning(false);
      setPending(null);
    }
  };

  return (
    <Box
      {...rest}
      sx={[
        {
          position: "sticky",
          top: 0,
          zIndex: 2,
          // A reserved slot: the bar animates into height it already owns, so the list never
          // jumps under the cursor mid-selection.
          maxHeight: visible ? 320 : 0,
          opacity: visible ? 1 : 0,
          overflow: "hidden",
          pointerEvents: visible ? "auto" : "none",
          mb: visible ? 2 : 0,
          transition: `max-height ${MOTION.surface}ms ${MOTION.ease}, opacity ${MOTION.ctl}ms ${MOTION.ease}, margin-bottom ${MOTION.surface}ms ${MOTION.ease}`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        ref={barRef}
        role="region"
        aria-label={t("jobsV2.bulk.regionLabel") as string}
        tabIndex={-1}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
          p: 1.5,
          borderRadius: R.card,
          border: `1px solid ${J.azureBorder}`,
          bgcolor: J.azureSoft,
          boxShadow: SHADOW.raise,
          ...focusRing,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: R.ctl,
              display: "grid",
              placeItems: "center",
              bgcolor: J.surface,
              color: J.azure,
              border: `1px solid ${J.azureBorder}`,
            }}
          >
            <IconWrapper icon="mdi:checkbox-multiple-marked-outline" size={20} />
          </Box>
          <Typography sx={{ ...TYPE.h4, color: J.azureDeep, minWidth: 0 }}>
            {t("jobsV2.bulk.selected", { count: formatCount(count), noun })}
          </Typography>
          <JButton variant="quiet" size="sm" onClick={onClear}>
            {t("jobsV2.bulk.clear")}
          </JButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            flexShrink: 0,
          }}
        >
          {actions.map((action) =>
            action.render ? (
              <Box key={action.key}>{action.render}</Box>
            ) : (
              <JButton
                key={action.key}
                variant={action.tone === "danger" ? "danger" : "secondary"}
                size="sm"
                startIcon={action.icon}
                onClick={() => setPending(action)}
                disabled={busy || running}
              >
                {action.label}
              </JButton>
            ),
          )}
        </Box>
      </Box>

      {outcome && (
        <Box
          role="status"
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: R.card,
            border: `1px solid ${outcome.result.failed.length ? J.dangerBd : J.successBd}`,
            bgcolor: outcome.result.failed.length ? J.dangerBg : J.successBg,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
            <Box
              aria-hidden
              sx={{
                color: outcome.result.failed.length ? J.dangerFg : J.successFg,
                display: "inline-flex",
                mt: 0.25,
              }}
            >
              <IconWrapper
                icon={
                  outcome.result.failed.length
                    ? "mdi:alert-circle-outline"
                    : "mdi:check-circle-outline"
                }
                size={20}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  ...TYPE.h4,
                  color: outcome.result.failed.length ? J.dangerFg : J.successFg,
                }}
              >
                {t("jobsV2.bulk.outcome", {
                  ok: formatCount(outcome.result.ok),
                  failed: formatCount(outcome.result.failed.length),
                })}
              </Typography>
              {outcome.result.failed.length > 0 && (
                <MicroRuleList
                  tone={J.dangerFg}
                  sx={{ mt: 1 }}
                  items={outcome.result.failed.map((f) => `${f.title} — ${f.reason}`)}
                />
              )}
              <Box sx={{ display: "flex", gap: 1, mt: 1.25, flexWrap: "wrap" }}>
                {outcome.result.failed.length > 0 && (
                  <JButton
                    variant="secondary"
                    size="sm"
                    startIcon="mdi:refresh"
                    loading={running}
                    onClick={() =>
                      run(
                        outcome.action,
                        outcome.result.failed.map((f) => f.id),
                      )
                    }
                  >
                    {t("jobsV2.bulk.retryFailed")}
                  </JButton>
                )}
                <JButton variant="quiet" size="sm" onClick={() => setOutcome(null)}>
                  {t("jobsV2.bulk.dismiss")}
                </JButton>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* A polite announcement of the selection size, so it is not colour-only. */}
      <Box aria-live="polite" sx={srOnly}>
        {visible ? t("jobsV2.bulk.selectedLive", { count: formatCount(count), noun }) : ""}
      </Box>

      {pending && (
        <JConfirm
          open
          title={pending.confirm.title}
          body={pending.confirm.body}
          consequences={pending.confirm.consequences}
          confirmLabel={pending.label}
          tone={pending.tone === "danger" ? "danger" : "neutral"}
          busy={running}
          onConfirm={() => run(pending)}
          onCancel={() => setPending(null)}
        />
      )}
    </Box>
  );
}
