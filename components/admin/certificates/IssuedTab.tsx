"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import {
  certificateFileBase,
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/lib/certificates/export";
import { formatCertificateDate, formatPoints, verifyUrlFor } from "@/lib/certificates/format";
import type {
  CertificateIssuer,
  CertificateRenderPayload,
  CertificateSourceKind,
  CertificateStatus,
  IssuedCertificate,
} from "@/lib/certificates/types";
import { EmptyState, Surface, certificateAdminKeys, sourceKindMeta } from "./shared";

/**
 * Who holds what.
 *
 * A credential is never deleted from here. Revoking marks it revoked so the
 * public verification URL keeps resolving and says so: a certificate already
 * linked from someone's LinkedIn profile must answer "this was withdrawn"
 * rather than 404, which reads as the issuer's site being broken.
 *
 * Every row renders from its own frozen `design_snapshot`, so an admin looking
 * at a credential from six months ago sees the artwork that was actually
 * issued, not the template as it stands today.
 */

const PAGE_SIZES = [10, 25, 50];

export interface IssuedTabProps {
  clientId: string | number;
  issuer: CertificateIssuer;
}

function payloadFromIssued(
  cert: IssuedCertificate,
  issuer: CertificateIssuer,
): CertificateRenderPayload {
  return {
    credential_id: cert.credential_id,
    status: cert.status,
    title: cert.title,
    subtitle: cert.subtitle ?? cert.source?.label ?? "",
    tagline: cert.tagline,
    recipient_name: cert.recipient_name,
    issued_at: cert.issued_at,
    verify_url: cert.verify_url ?? verifyUrlFor(cert.credential_id),
    issuer,
    source: cert.source,
    metrics:
      cert.threshold_at_issue != null
        ? [{ label: "Points", value: formatPoints(cert.threshold_at_issue) }]
        : [],
    // The snapshot, never a recomputed design: the credential has to look the
    // way it looked when it was issued.
    design: cert.design_snapshot,
  };
}

export function IssuedTab({ clientId, issuer }: IssuedTabProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labels = useCertificateArtworkLabels();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | CertificateStatus>("");
  const [sourceKind, setSourceKind] = useState<"" | CertificateSourceKind>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [viewing, setViewing] = useState<IssuedCertificate | null>(null);
  const [revoking, setRevoking] = useState<IssuedCertificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [exporting, setExporting] = useState(false);

  const artworkRef = useRef<HTMLDivElement | null>(null);

  // Debounced: the issued list is a server-side search and a request per
  // keystroke is what made the old student tables feel like they lagged.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const query = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(sourceKind ? { source_kind: sourceKind } : {}),
      page: page + 1,
      page_size: pageSize,
    }),
    [search, status, sourceKind, page, pageSize],
  );

  const issuedQuery = useQuery({
    queryKey: certificateAdminKeys.issued(clientId, query),
    queryFn: () => adminCertificatesService.listIssued(clientId, query),
    // Keeps the previous page on screen while the next one loads, so paging
    // does not flash an empty table.
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [...certificateAdminKeys.all(clientId), "issued"],
    });
    queryClient.invalidateQueries({ queryKey: certificateAdminKeys.overview(clientId) });
  };

  const revoke = useMutation({
    mutationFn: ({ cert, reason }: { cert: IssuedCertificate; reason: string }) =>
      adminCertificatesService.revoke(clientId, cert.id, reason.trim() || undefined),
    onSuccess: () => {
      invalidate();
      showToast(t("certificatesUpload.revoked", "Credential revoked."), "success");
    },
    onError: (err: unknown) =>
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.revokeError", "Could not revoke the credential."),
        "error",
      ),
  });

  const reinstate = useMutation({
    mutationFn: (cert: IssuedCertificate) =>
      adminCertificatesService.reinstate(clientId, cert.id),
    onSuccess: () => {
      invalidate();
      showToast(t("certificatesUpload.reinstated", "Credential reinstated."), "success");
    },
    onError: (err: unknown) =>
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.reinstateError", "Could not reinstate the credential."),
        "error",
      ),
  });

  const copyVerifyLink = async (cert: IssuedCertificate) => {
    const url = cert.verify_url ?? verifyUrlFor(cert.credential_id);
    try {
      await navigator.clipboard.writeText(url);
      showToast(t("certificatesUpload.copied", "Copied to clipboard"), "success");
    } catch {
      showToast(t("certificatesUpload.copyFailed", "Could not copy"), "error");
    }
  };

  const exportArtwork = async (kind: "png" | "pdf") => {
    const node = artworkRef.current;
    if (!node || !viewing) return;
    setExporting(true);
    try {
      const base = certificateFileBase(payloadFromIssued(viewing, issuer));
      if (kind === "png") await downloadCertificatePng(node, `${base}.png`);
      else await downloadCertificatePdf(node, `${base}.pdf`);
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.exportError", "Could not build the file."),
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  const rows = issuedQuery.data?.results ?? [];
  const total = issuedQuery.data?.count ?? 0;
  const filtersActive = Boolean(search || status || sourceKind);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ md: "center" }}
      >
        <TextField
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t(
            "certificatesUpload.searchIssued",
            "Search by learner, email or credential id",
          )}
          sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label={t("certificatesUpload.filterStatus", "Status")}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | CertificateStatus);
            setPage(0);
          }}
          sx={{ minWidth: 168, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        >
          <MenuItem value="">{t("certificatesUpload.filterAny", "Any")}</MenuItem>
          <MenuItem value="issued">{t("certificatesUpload.statusIssued", "Issued")}</MenuItem>
          <MenuItem value="revoked">{t("certificatesUpload.statusRevoked", "Revoked")}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label={t("certificatesUpload.filterSource", "Earned from")}
          value={sourceKind}
          onChange={(e) => {
            setSourceKind(e.target.value as "" | CertificateSourceKind);
            setPage(0);
          }}
          sx={{ minWidth: 190, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        >
          <MenuItem value="">{t("certificatesUpload.filterAny", "Any")}</MenuItem>
          <MenuItem value="adaptive_course">
            {t("certificatesUpload.sourceCourse", "Course")}
          </MenuItem>
          <MenuItem value="assessment">
            {t("certificatesUpload.sourceAssessment", "Assessment")}
          </MenuItem>
          <MenuItem value="points_tier">
            {t("certificatesUpload.sourceTier", "Points tier")}
          </MenuItem>
        </TextField>
      </Stack>

      {issuedQuery.isLoading ? (
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
      ) : issuedQuery.isError ? (
        <EmptyState
          icon="mdi:cloud-alert-outline"
          title={t("certificatesUpload.issuedErrorTitle", "The credential list did not load")}
          body={t(
            "certificatesUpload.issuedErrorBody",
            "The certificates service did not answer. Nothing has been changed, so retrying is safe.",
          )}
          action={
            <Button
              variant="contained"
              onClick={() => issuedQuery.refetch()}
              startIcon={<IconWrapper icon="mdi:refresh" size={20} />}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              {t("common.retry", "Try again")}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={filtersActive ? "mdi:file-search-outline" : "mdi:certificate-outline"}
          title={
            filtersActive
              ? t("certificatesUpload.noMatchTitle", "Nothing matches that")
              : t("certificatesUpload.noIssuedTitle", "No certificates issued yet")
          }
          body={
            filtersActive
              ? t(
                  "certificatesUpload.noIssuedFilteredBody",
                  "No credential matches those filters. Clear them to see everything that has been issued.",
                )
              : t(
                  "certificatesUpload.noIssuedBody",
                  "Credentials appear here the moment a learner crosses a points rung or meets a course or assessment criterion. Set those up in the Points ladder and Assignments tabs.",
                )
          }
          action={
            filtersActive ? (
              <Button
                onClick={() => {
                  setSearchInput("");
                  setStatus("");
                  setSourceKind("");
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {t("certificatesUpload.clearFilters", "Clear the filters")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Surface padded={false} sx={{ overflow: "hidden" }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      bgcolor: alpha(
                        theme.palette.text.primary,
                        theme.palette.mode === "dark" ? 0.05 : 0.03,
                      ),
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableCell>{t("certificatesUpload.colRecipient", "Recipient")}</TableCell>
                  <TableCell>{t("certificatesUpload.colTitle", "Certificate")}</TableCell>
                  <TableCell>{t("certificatesUpload.colSource", "Earned from")}</TableCell>
                  <TableCell>{t("certificatesUpload.colScore", "Points or score")}</TableCell>
                  <TableCell>{t("certificatesUpload.colIssued", "Issued")}</TableCell>
                  <TableCell>{t("certificatesUpload.colStatus", "Status")}</TableCell>
                  <TableCell align="right">
                    {t("certificatesUpload.colActions", "Actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((cert) => {
                  const meta = sourceKindMeta(cert.source?.kind ?? "");
                  const revoked = cert.status === "revoked";
                  return (
                    <TableRow key={cert.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                          {cert.recipient_name}
                        </Typography>
                        {cert.recipient_email ? (
                          <Typography variant="caption" color="text.secondary">
                            {cert.recipient_email}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {cert.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "ui-monospace, monospace" }}
                        >
                          {cert.credential_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1.5, maxWidth: 220 }}
                          icon={<IconWrapper icon={meta.icon} size={15} />}
                          label={cert.source?.label || meta.label}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {cert.threshold_at_issue != null
                            ? formatPoints(cert.threshold_at_issue)
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCertificateDate(cert.issued_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={revoked ? "error" : "success"}
                          variant={revoked ? "filled" : "outlined"}
                          sx={{ borderRadius: 1.5, fontWeight: 700 }}
                          label={
                            revoked
                              ? t("certificatesUpload.statusRevoked", "Revoked")
                              : t("certificatesUpload.statusIssued", "Issued")
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0} justifyContent="flex-end">
                          <Tooltip title={t("certificatesUpload.viewCertificate", "View")}>
                            <IconButton size="small" onClick={() => setViewing(cert)}>
                              <IconWrapper icon="mdi:eye-outline" size={19} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={t("certificatesUpload.copyVerifyLink", "Copy the verify link")}
                          >
                            <IconButton size="small" onClick={() => copyVerifyLink(cert)}>
                              <IconWrapper icon="mdi:link-variant" size={19} />
                            </IconButton>
                          </Tooltip>
                          {revoked ? (
                            <Tooltip title={t("certificatesUpload.reinstate", "Reinstate")}>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={reinstate.isPending}
                                onClick={() => reinstate.mutate(cert)}
                              >
                                <IconWrapper icon="mdi:restore" size={19} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={t("certificatesUpload.revoke", "Revoke")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setRevokeReason("");
                                  setRevoking(cert);
                                }}
                              >
                                <IconWrapper icon="mdi:cancel" size={19} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZES}
            onRowsPerPageChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            labelRowsPerPage={t("certificatesUpload.rowsPerPage", "Per page")}
          />
        </Surface>
      )}

      {/* Credential viewer */}
      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25 }}>
                {viewing?.recipient_name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "ui-monospace, monospace" }}
              >
                {viewing?.credential_id}
              </Typography>
            </Box>
            <IconButton onClick={() => setViewing(null)} aria-label={t("common.close", "Close")}>
              <IconWrapper icon="mdi:close" size={22} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {viewing ? (
            <CertificatePreview
              ref={artworkRef}
              payload={payloadFromIssued(viewing, issuer)}
              labels={labels}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => viewing && copyVerifyLink(viewing)}
            startIcon={<IconWrapper icon="mdi:link-variant" size={20} />}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t("certificatesUpload.copyVerifyLink", "Copy the verify link")}
          </Button>
          <Box sx={{ flex: 1 }} />
          <LoadingButton
            variant="outlined"
            loading={exporting}
            onClick={() => exportArtwork("png")}
            startIcon={<IconWrapper icon="mdi:image-outline" size={20} />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {t("certificatesUpload.downloadPng", "Download PNG")}
          </LoadingButton>
          <LoadingButton
            variant="contained"
            loading={exporting}
            onClick={() => exportArtwork("pdf")}
            startIcon={<IconWrapper icon="mdi:file-pdf-box" size={20} />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            {t("certificatesUpload.downloadPdf", "Download PDF")}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Revoke, with a reason: the public credential page shows that it was
          withdrawn, and a support ticket six months later needs to know why. */}
      <Dialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t("certificatesUpload.revokeTitle", "Revoke this credential?")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
            {t(
              "certificatesUpload.revokeBody",
              "The credential stays reachable at its verify link and says it was withdrawn, so an employer following an old link sees the truth rather than a broken page. You can reinstate it at any time.",
            )}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t("certificatesUpload.revokeReason", "Reason (optional)")}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRevoking(null)} sx={{ textTransform: "none", fontWeight: 700 }}>
            {t("common.cancel", "Cancel")}
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={revoke.isPending}
            onClick={() => {
              if (revoking) revoke.mutate({ cert: revoking, reason: revokeReason });
              setRevoking(null);
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            {t("certificatesUpload.revoke", "Revoke")}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
