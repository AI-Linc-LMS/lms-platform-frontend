"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { formatMoney } from "@/lib/utils/money";
import {
  paymentService,
  type MyTransaction,
} from "@/lib/services/payment.service";

/**
 * A learner's own payment history.
 *
 * There was no student-facing transaction endpoint at all before this, which is a support problem
 * as much as a product one: when a webhook is late the learner has been charged, has no access,
 * and has no way to see that anything happened — so they contact support, who also cannot see it.
 *
 * The page therefore leads with STATUS rather than with the amount. "Did my money arrive and do I
 * have the thing" is the only question anyone opens this page to answer.
 */

const PAGE_SIZE = 20;

/** Status pill. Colour carries the meaning; the label never leaks a raw enum value. */
function StatusChip({ txn }: { txn: MyTransaction }) {
  const { hue, icon } = statusStyle(txn);
  return (
    <Chip
      size="small"
      icon={<Icon icon={icon} width={14} />}
      label={txn.status_display}
      sx={{
        fontWeight: 700,
        fontSize: "0.72rem",
        color: hue,
        bgcolor: `color-mix(in srgb, ${hue} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${hue} 30%, transparent)`,
        "& .MuiChip-icon": { color: hue },
      }}
    />
  );
}

function statusStyle(txn: MyTransaction): { hue: string; icon: string } {
  switch (txn.status) {
    case "VERIFIED":
    case "SUCCESS":
      return { hue: "#10b981", icon: "mdi:check-circle-outline" };
    case "REFUNDED":
      return { hue: "#f59e0b", icon: "mdi:cash-refund" };
    case "DISPUTED":
      return { hue: "#ef4444", icon: "mdi:alert-octagon-outline" };
    case "FAILED":
      return { hue: "#ef4444", icon: "mdi:close-circle-outline" };
    case "EXPIRED":
      return { hue: "#94a3b8", icon: "mdi:timer-off-outline" };
    default:
      // INITIATED / PENDING — a payment in flight, which is exactly when people look here.
      return { hue: "#6366f1", icon: "mdi:progress-clock" };
  }
}

/** The one line that answers "do I still have this?". Silent when there is nothing to say. */
function AccessNote({ txn }: { txn: MyTransaction }) {
  const note = {
    partially_refunded:
      "Part of this was refunded. You still have access.",
    revoked: "Refunded — access to this has been removed.",
    // Deliberately does not claim access is gone: revocation is best-effort server-side and this
    // state means it has not been confirmed.
    refund_processing: "Refund issued. Access is being updated.",
  }[txn.access_state];
  if (!note) return null;
  return (
    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}>
      {note}
    </Typography>
  );
}

export default function PurchasesPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<MyTransaction[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        const data = await paymentService.listMyTransactions(Number(config.clientId), {
          page: nextPage,
          limit: PAGE_SIZE,
        });
        setRows(data.results);
        setCount(data.count);
      } catch {
        showToast("Couldn't load your purchases", "error");
        setRows([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Keyed on the page NUMBER, not on the callback identity — a function in a dependency array is
  // how this codebase has produced infinite fetch loops before.
  useEffect(() => {
    void load(page);
  }, [page, load]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Account"
        title="My Purchases"
        description="Every payment you've made, what it bought, and whether it went through."
        accent="emerald"
        icon="mdi:receipt-text-outline"
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!loading && rows.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Icon icon="mdi:receipt-text-outline" width={44} style={{ color: "#cbd5e1" }} />
          <Typography sx={{ fontWeight: 800, mt: 1.5 }}>No purchases yet</Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.88rem" }}>
            Anything you buy will appear here, with its receipt reference.
          </Typography>
        </Box>
      )}

      {!loading && rows.length > 0 && (
        <>
          <TableContainer
            sx={{
              border: "1px solid var(--border-default)",
              borderRadius: 3,
              bgcolor: "var(--card-bg)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((txn) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                        {txn.product_title}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                        {txn.payment_type_display}
                      </Typography>
                      <AccessNote txn={txn} />
                      {txn.error_message && (
                        <Typography sx={{ fontSize: "0.75rem", color: "#ef4444", mt: 0.25 }}>
                          {txn.error_message}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>
                        {formatMoney(txn.amount, txn.currency)}
                      </Typography>
                      {txn.refunded_amount && (
                        <Typography sx={{ fontSize: "0.75rem", color: "#f59e0b" }}>
                          {formatMoney(txn.refunded_amount, txn.currency)} refunded
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip txn={txn} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.83rem" }}>
                        {new Date(txn.created_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          color: "text.secondary",
                          wordBreak: "break-all",
                        }}
                      >
                        {/* What support asks for. Safe to show: it identifies a payment, it does
                            not authorise anything. */}
                        {txn.razorpay_payment_id || "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {pageCount > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_e, p) => setPage(p)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}
    </PageShell>
  );
}
