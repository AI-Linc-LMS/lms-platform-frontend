"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AssessmentDataTable,
  AssessmentEmptyState,
  AssessmentFilterBar,
  AssessmentSharedPagination,
  AssessmentTableSkeleton,
  StatusChip,
  type AssessmentColumn,
  type ActiveFilterChip,
  type FilterSelectDef,
} from "@/components/admin/assessment/shared";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import {
  adminCertificatesService,
  publicCertificatesService,
} from "@/lib/services/certificates.service";
import {
  certificateFileBase,
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/lib/certificates/export";
import { formatCertificateDate, formatPoints, verifyUrlFor } from "@/lib/certificates/format";
import type {
  CertificateSourceKind,
  CertificateStatus,
  IssuedCertificate,
  IssuedCertificateQuery,
} from "@/lib/certificates/types";
import {
  MetaPill,
  certificateAdminKeys,
  fieldSx,
  primaryButtonSx,
  quietButtonSx,
  secondaryButtonSx,
  sourceKindMeta,
} from "./shared";

/**
 * Who holds what.
 *
 * A credential is never deleted from here. Revoking marks it revoked so the
 * public verification URL keeps resolving and says so: a certificate already
 * linked from someone's LinkedIn profile must answer "this was withdrawn"
 * rather than 404, which reads as the issuer's site being broken.
 *
 * A register row is a ROW, not a wall of artwork. The list serializer sends no
 * design block on purpose - an eleven-token palette across 25 rows is dead
 * weight - so this table shows what an admin needs to answer "who holds what
 * and why was it issued", and opens the full credential on demand through the
 * server's own preview, which renders from the frozen snapshot.
 *
 * The columns that answer "why" (`completion_percent`, `score_percent`,
 * `points_at_issue` against `threshold_at_issue`, and the serial number) are
 * all on the wire already and were simply not being read.
 */

const PAGE_SIZES = [10, 25, 50];

export interface IssuedTabProps {
  clientId: string | number;
}

/* No `issuer` prop: the register no longer assembles artwork locally, so it has
 * no use for the tenant identity. The one credential an admin opens is fetched
 * whole, issuer block included, from the endpoint that draws it for everybody
 * else. */

/**
 * What a credential was earned for, in one line.
 *
 * Every input is a snapshot column, never a recomputation: a graduate's
 * certificate says they finished 100% of a course, and re-deriving that today
 * after the course grew three modules would restate it as 74% on the admin's
 * screen while the document in their hand still says 100.
 */
function earnedFor(cert: IssuedCertificate): string {
  if (cert.completion_percent != null) return `${Math.round(cert.completion_percent)}% complete`;
  if (cert.score_percent != null) return `${Math.round(cert.score_percent)}%`;
  if (cert.points_at_issue != null) {
    const threshold =
      cert.threshold_at_issue != null ? ` / ${formatPoints(cert.threshold_at_issue)}` : "";
    return `${formatPoints(cert.points_at_issue)}${threshold} pts`;
  }
  return "-";
}

export function IssuedTab({ clientId }: IssuedTabProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labels = useCertificateArtworkLabels();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | CertificateStatus>("");
  const [sourceKind, setSourceKind] = useState<"" | CertificateSourceKind>("");
  /** A tier SLUG (the backend takes a slug or an id). The ladder is one of the
   *  three source kinds and had no filter at all, despite the query type
   *  declaring one. */
  const [tier, setTier] = useState("");
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

  // `q`, not `search`. The backend reads `q` and ignores anything else, so the
  // register answered every search with the same unfiltered first page and no
  // indication that the search had done nothing - which makes the table
  // unusable for its main job on a tenant with thousands of credentials.
  const query = useMemo<IssuedCertificateQuery>(
    () => ({
      ...(search ? { q: search } : {}),
      ...(status ? { status } : {}),
      ...(sourceKind ? { source_kind: sourceKind } : {}),
      ...(tier ? { tier } : {}),
      page: page + 1,
      page_size: pageSize,
    }),
    [search, status, sourceKind, tier, page, pageSize],
  );

  const issuedQuery = useQuery({
    queryKey: certificateAdminKeys.issued(clientId, query),
    queryFn: () => adminCertificatesService.listIssued(clientId, query),
    // Keeps the previous page on screen while the next one loads, so paging
    // does not flash an empty table.
    placeholderData: keepPreviousData,
  });

  const tiersQuery = useQuery({
    queryKey: certificateAdminKeys.tiers(clientId),
    queryFn: () => adminCertificatesService.listTiers(clientId),
    staleTime: 5 * 60 * 1000,
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

  /**
   * The artwork for the one credential an admin opened.
   *
   * Fetched rather than assembled: the register rows carry no design at all, so
   * there is nothing local to draw from, and the public credential endpoint
   * returns the same `render_payload` the learner sees - which is the whole
   * point of opening it.
   */
  const viewingQuery = useQuery({
    queryKey: ["certificates", "credential", viewing?.credential_id ?? ""],
    queryFn: () => publicCertificatesService.getCredential(viewing?.credential_id as string),
    enabled: Boolean(viewing?.credential_id),
    staleTime: 5 * 60 * 1000,
  });
  const viewingPayload = viewingQuery.data ?? null;

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
      if (!viewingPayload) return;
      const base = certificateFileBase(viewingPayload);
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
  const filtersActive = Boolean(search || status || sourceKind || tier);

  const clearFilters = () => {
    setSearchInput("");
    setStatus("");
    setSourceKind("");
    setTier("");
    setPage(0);
  };

  /** The three facets the register filters on, in the shape the shared admin
   *  filter bar takes. Hand-laid TextFields were four different widths. */
  const filterSelects: FilterSelectDef[] = [
    {
      key: "status",
      label: t("certificatesUpload.filterStatus", "Status"),
      value: status,
      options: [
        { value: "issued", label: t("certificatesUpload.statusIssued", "Issued") },
        { value: "revoked", label: t("certificatesUpload.statusRevoked", "Revoked") },
      ],
      onChange: (v) => {
        setStatus(v as "" | CertificateStatus);
        setPage(0);
      },
    },
    {
      key: "source",
      label: t("certificatesUpload.filterSource", "Earned from"),
      value: sourceKind,
      options: [
        { value: "adaptive_course", label: t("certificatesUpload.sourceCourse", "Course") },
        { value: "assessment", label: t("certificatesUpload.sourceAssessment", "Assessment") },
        { value: "points", label: t("certificatesUpload.sourceTier", "Points tier") },
      ],
      onChange: (v) => {
        setSourceKind(v as "" | CertificateSourceKind);
        setPage(0);
      },
    },
    {
      key: "tier",
      label: t("certificatesUpload.filterTier", "Ladder rung"),
      value: tier,
      options: (tiersQuery.data?.tiers ?? []).map((rung) => ({
        value: rung.slug,
        label: rung.short_name || rung.name,
      })),
      onChange: (v) => {
        setTier(v);
        setPage(0);
      },
    },
  ];

  const activeChips: ActiveFilterChip[] = [
    ...(status
      ? [
          {
            key: "status",
            label:
              status === "revoked"
                ? t("certificatesUpload.statusRevoked", "Revoked")
                : t("certificatesUpload.statusIssued", "Issued"),
            onClear: () => {
              setStatus("");
              setPage(0);
            },
          },
        ]
      : []),
    ...(sourceKind
      ? [
          {
            key: "source",
            label: sourceKindMeta(sourceKind).label,
            onClear: () => {
              setSourceKind("");
              setPage(0);
            },
          },
        ]
      : []),
    ...(tier
      ? [
          {
            key: "tier",
            label:
              (tiersQuery.data?.tiers ?? []).find((rung) => rung.slug === tier)?.short_name || tier,
            onClear: () => {
              setTier("");
              setPage(0);
            },
          },
        ]
      : []),
  ];

  /** The register as columns rather than a hand-rolled table, so the header
   *  casing, the row hairlines and the responsive column hiding are the ones
   *  every other admin table already has. */
  const columns: AssessmentColumn<IssuedCertificate>[] = [
    {
      key: "recipient",
      header: t("certificatesUpload.colRecipient", "Recipient"),
      minWidth: 190,
      render: (cert) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--font-primary)", lineHeight: 1.3 }}
          >
            {cert.recipient_name}
          </Typography>
          {/* The email, nested under `student`. `recipient_name` is the name
              FROZEN on the document and can differ from the account's current
              one, which is exactly why the two are not flattened together - and
              the email is the only thing that tells two learners with the same
              display name apart before one of their credentials gets revoked. */}
          {cert.student?.email ? (
            <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}>
              {cert.student.email}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      key: "title",
      header: t("certificatesUpload.colTitle", "Certificate"),
      minWidth: 190,
      render: (cert) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.3 }}
          >
            {cert.title}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "var(--font-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {cert.credential_id}
          </Typography>
        </Box>
      ),
    },
    {
      key: "source",
      header: t("certificatesUpload.colSource", "Earned from"),
      hideBelow: "md",
      minWidth: 160,
      render: (cert) => {
        const meta = sourceKindMeta(cert.source?.kind ?? "");
        return (
          <MetaPill
            icon={meta.icon}
            label={cert.source?.label || meta.label}
            title={cert.source?.label || meta.label}
            sx={{ maxWidth: 220 }}
          />
        );
      },
    },
    {
      key: "earned",
      header: t("certificatesUpload.colScore", "Points or score"),
      hideBelow: "md",
      minWidth: 140,
      render: (cert) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--font-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {earnedFor(cert)}
          </Typography>
          {cert.serial_no ? (
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: "var(--font-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {cert.serial_no}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      key: "issued_at",
      header: t("certificatesUpload.colIssued", "Issued"),
      hideBelow: "lg",
      minWidth: 120,
      render: (cert) => (
        <Typography sx={{ fontSize: "0.85rem", color: "var(--font-primary)" }}>
          {formatCertificateDate(cert.issued_at)}
        </Typography>
      ),
    },
    {
      key: "status",
      header: t("certificatesUpload.colStatus", "Status"),
      minWidth: 108,
      render: (cert) =>
        cert.status === "revoked" ? (
          <StatusChip
            tone="error"
            icon="mdi:cancel"
            label={t("certificatesUpload.statusRevoked", "Revoked")}
          />
        ) : (
          <StatusChip
            tone="success"
            icon="mdi:check-circle-outline"
            label={t("certificatesUpload.statusIssued", "Issued")}
          />
        ),
    },
    {
      key: "actions",
      header: t("certificatesUpload.colActions", "Actions"),
      align: "right",
      width: 132,
      render: (cert) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title={t("certificatesUpload.viewCertificate", "View")}>
            <IconButton
              size="small"
              onClick={() => setViewing(cert)}
              sx={{ color: "var(--font-tertiary)", "&:hover": { color: "var(--ai-violet)" } }}
            >
              <IconWrapper icon="mdi:eye-outline" size={19} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("certificatesUpload.copyVerifyLink", "Copy the verify link")}>
            <IconButton
              size="small"
              onClick={() => copyVerifyLink(cert)}
              sx={{ color: "var(--font-tertiary)", "&:hover": { color: "var(--ai-violet)" } }}
            >
              <IconWrapper icon="mdi:link-variant" size={19} />
            </IconButton>
          </Tooltip>
          {cert.status === "revoked" ? (
            <Tooltip title={t("certificatesUpload.reinstate", "Reinstate")}>
              <IconButton
                size="small"
                disabled={reinstate.isPending}
                onClick={() => reinstate.mutate(cert)}
                sx={{ color: "var(--success-500)" }}
              >
                <IconWrapper icon="mdi:restore" size={19} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t("certificatesUpload.revoke", "Revoke")}>
              <IconButton
                size="small"
                onClick={() => {
                  setRevokeReason("");
                  setRevoking(cert);
                }}
                sx={{ color: "var(--error-500)" }}
              >
                <IconWrapper icon="mdi:cancel" size={19} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <AssessmentFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t(
          "certificatesUpload.searchIssued",
          "Search by learner, email or credential id",
        )}
        selects={filterSelects}
        activeChips={activeChips}
        onClearAll={clearFilters}
      />

      {issuedQuery.isLoading ? (
        <AssessmentTableSkeleton rows={8} columns={7} />
      ) : issuedQuery.isError ? (
        <AssessmentEmptyState
          icon="mdi:cloud-alert-outline"
          title={t("certificatesUpload.issuedErrorTitle", "The credential list did not load")}
          description={t(
            "certificatesUpload.issuedErrorBody",
            "The certificates service did not answer. Nothing has been changed, so retrying is safe.",
          )}
          action={
            <Button
              variant="contained"
              onClick={() => issuedQuery.refetch()}
              startIcon={<IconWrapper icon="mdi:refresh" size={20} />}
              sx={primaryButtonSx}
            >
              {t("common.retry", "Try again")}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <AssessmentEmptyState
          icon={filtersActive ? "mdi:file-search-outline" : "mdi:certificate-outline"}
          title={
            filtersActive
              ? t("certificatesUpload.noMatchTitle", "Nothing matches that")
              : t("certificatesUpload.noIssuedTitle", "No certificates issued yet")
          }
          description={
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
              <Button onClick={clearFilters} sx={quietButtonSx}>
                {t("certificatesUpload.clearFilters", "Clear the filters")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Box>
          <AssessmentDataTable<IssuedCertificate>
            columns={columns}
            rows={rows}
            rowKey={(cert) => cert.id}
            dense
          />
          <Box sx={{ mt: 2 }}>
            {/* The shared footer takes a 1-based page; the query state stays
                0-based because that is what the request builder already adds
                one to. */}
            <AssessmentSharedPagination
              total={total}
              page={page + 1}
              pageSize={pageSize}
              onPageChange={(next) => setPage(Math.max(0, next - 1))}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
              perPageOptions={PAGE_SIZES}
            />
          </Box>
        </Box>
      )}

      {/* Credential viewer */}
      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 4, bgcolor: "var(--card-bg)" } },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--font-primary)", lineHeight: 1.25 }}
              >
                {viewing?.recipient_name}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: "var(--font-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {viewing?.credential_id}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setViewing(null)}
              aria-label={t("common.close", "Close")}
              sx={{ color: "var(--font-tertiary)" }}
            >
              <IconWrapper icon="mdi:close" size={22} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {viewingPayload ? (
            <CertificatePreview ref={artworkRef} payload={viewingPayload} labels={labels} />
          ) : (
            <Skeleton
              variant="rounded"
              sx={{ width: "100%", aspectRatio: "1000 / 707", borderRadius: 2.5 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => viewing && copyVerifyLink(viewing)}
            startIcon={<IconWrapper icon="mdi:link-variant" size={20} />}
            sx={quietButtonSx}
          >
            {t("certificatesUpload.copyVerifyLink", "Copy the verify link")}
          </Button>
          <Box sx={{ flex: 1 }} />
          <LoadingButton
            variant="outlined"
            loading={exporting}
            onClick={() => exportArtwork("png")}
            startIcon={<IconWrapper icon="mdi:image-outline" size={20} />}
            sx={secondaryButtonSx}
          >
            {t("certificatesUpload.downloadPng", "Download PNG")}
          </LoadingButton>
          <LoadingButton
            variant="contained"
            loading={exporting}
            onClick={() => exportArtwork("pdf")}
            startIcon={<IconWrapper icon="mdi:file-pdf-box" size={20} />}
            sx={{ ...primaryButtonSx, px: 2.5 }}
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
        slotProps={{
          paper: { sx: { borderRadius: 4, bgcolor: "var(--card-bg)" } },
        }}
      >
        <DialogTitle
          sx={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--font-primary)" }}
        >
          {t("certificatesUpload.revokeTitle", "Revoke this credential?")}
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", mb: 2, lineHeight: 1.7 }}
          >
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
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRevoking(null)} sx={quietButtonSx}>
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
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "999px",
              px: 2.5,
              bgcolor: "var(--error-500)",
              "&:hover": { bgcolor: "var(--error-600)" },
            }}
          >
            {t("certificatesUpload.revoke", "Revoke")}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
