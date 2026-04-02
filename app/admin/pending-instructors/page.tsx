"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminPendingInstructorsService,
  PendingInstructor,
} from "@/lib/services/admin/admin-pending-instructors.service";
import { formatDate } from "@/lib/utils/date-utils";

export default function PendingInstructorsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [rows, setRows] = useState<PendingInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [confirmRow, setConfirmRow] = useState<PendingInstructor | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminPendingInstructorsService.listPendingInstructors();
      setRows(data);
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { detail?: string; error?: string } };
      };
      const msg =
        ax.response?.data?.detail ||
        ax.response?.data?.error ||
        t("adminPendingInstructors.loadFailed");
      showToast(msg, "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApproveConfirmed = async () => {
    const row = confirmRow;
    if (!row) return;
    try {
      setApprovingId(row.id);
      const res =
        await adminPendingInstructorsService.approvePendingInstructor(row.id);
      showToast(res.detail || t("adminPendingInstructors.approved"), "success");
      setConfirmRow(null);
      await load();
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { detail?: string; error?: string } };
      };
      const msg =
        ax.response?.data?.detail ||
        ax.response?.data?.error ||
        t("adminPendingInstructors.approveFailed");
      showToast(msg, "error");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("adminPendingInstructors.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("adminPendingInstructors.subtitle")}
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("adminPendingInstructors.email")}</TableCell>
                <TableCell>{t("adminPendingInstructors.fullName")}</TableCell>
                <TableCell>{t("adminPendingInstructors.phone")}</TableCell>
                <TableCell>{t("adminPendingInstructors.createdAt")}</TableCell>
                <TableCell align="right">
                  {t("adminPendingInstructors.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {t("adminPendingInstructors.empty")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.phone_number || "—"}</TableCell>
                    <TableCell>{formatDate(row.created_at)}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        disabled={approvingId === row.id}
                        onClick={() => setConfirmRow(row)}
                        sx={{ textTransform: "none" }}
                      >
                        {approvingId === row.id
                          ? t("adminPendingInstructors.approving")
                          : t("adminPendingInstructors.approve")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={Boolean(confirmRow)}
          onClose={() => {
            if (approvingId === null) setConfirmRow(null);
          }}
          aria-labelledby="approve-instructor-dialog-title"
        >
          <DialogTitle id="approve-instructor-dialog-title">
            {t("adminPendingInstructors.confirmApproveTitle")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {t("adminPendingInstructors.confirmApproveBody", {
                name: confirmRow?.full_name ?? "",
                email: confirmRow?.email ?? "",
              })}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmRow(null)}
              disabled={approvingId !== null}
              color="inherit"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleApproveConfirmed()}
              disabled={approvingId !== null}
            >
              {approvingId !== null
                ? t("adminPendingInstructors.approving")
                : t("adminPendingInstructors.confirmApprove")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
