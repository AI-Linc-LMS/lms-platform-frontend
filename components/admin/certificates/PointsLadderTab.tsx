"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentEmptyState } from "@/components/admin/assessment/shared";
import { LoadingButton } from "@/components/common/LoadingButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import { formatPoints } from "@/lib/certificates/format";
import type {
  CertificateIssuer,
  CertificateTemplate,
  CertificateTier,
} from "@/lib/certificates/types";
import {
  MetaPill,
  NoticeStrip,
  SectionHeading,
  Surface,
  certificateAdminKeys,
  previewPayloadFromTemplate,
  primaryButtonSx,
  quietButtonSx,
  slugify,
} from "./shared";

/**
 * The points ladder: the rungs a learner climbs on total points, each bound to
 * the design they are awarded.
 *
 * Edited as a LOCAL DRAFT and saved in one action rather than row by row. The
 * ladder's central invariant is that thresholds ascend, and a per-row autosave
 * makes that impossible to hold: raising rung 3 above rung 4 is a legitimate
 * intermediate state while you are also raising rung 4. So the whole table is
 * validated together and the save button stays shut until it is coherent.
 */

interface LadderRow {
  /** Stable React key. New rows have no server id yet, and reusing the array
   *  index remounts every input below an insertion, which loses focus mid-type. */
  key: string;
  id?: number;
  slug: string;
  name: string;
  short_name: string;
  code: string;
  tagline: string;
  /** The FLOOR that gates the rung, called `points_threshold` on the wire. It
   *  was written as `points`, a field the serializer does not declare, so every
   *  threshold edit was dropped and reported as a success. */
  points_threshold: number;
  template_id: number | null;
  is_active: boolean;
  /** Read-only, from the server: how many credentials this rung has awarded. */
  issued_count: number;
  /** Whether `reset-defaults` would overwrite this rung. */
  is_default: boolean;
  /** Once the admin edits the slug by hand, renaming the tier stops rewriting
   *  it: a slug is what already-issued credentials and claim URLs point at. */
  slugTouched: boolean;
}

let tempKeySeed = 0;

function rowFromTier(tier: CertificateTier): LadderRow {
  return {
    key: `tier-${tier.id}`,
    id: tier.id,
    slug: tier.slug,
    name: tier.name,
    short_name: tier.short_name,
    code: tier.code,
    tagline: tier.tagline,
    points_threshold: tier.points_threshold,
    template_id: tier.template_id ?? null,
    is_active: tier.is_active,
    issued_count: tier.issued_count,
    is_default: tier.is_default,
    slugTouched: true,
  };
}

function blankRow(previousPoints: number): LadderRow {
  tempKeySeed += 1;
  return {
    key: `new-${tempKeySeed}`,
    slug: "",
    name: "",
    short_name: "",
    code: "",
    tagline: "",
    // Seeded above the rung below it so a fresh row is valid the moment it
    // appears, instead of opening with an ascending-order error.
    points_threshold: Math.max(0, previousPoints) + 1000,
    template_id: null,
    is_active: true,
    issued_count: 0,
    is_default: false,
    slugTouched: false,
  };
}

export interface PointsLadderTabProps {
  clientId: string | number;
  issuer: CertificateIssuer;
}

export function PointsLadderTab({ clientId, issuer }: PointsLadderTabProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const labels = useCertificateArtworkLabels();

  const tiersQuery = useQuery({
    queryKey: certificateAdminKeys.tiers(clientId),
    queryFn: () => adminCertificatesService.listTiers(clientId),
  });
  const templatesQuery = useQuery({
    queryKey: certificateAdminKeys.templates(clientId),
    queryFn: () => adminCertificatesService.listTemplates(clientId),
  });

  const [rows, setRows] = useState<LadderRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);

  // Refetches must not silently discard half-finished edits: only re-seed the
  // draft while it is clean.
  const serverTiers = useMemo(() => tiersQuery.data?.tiers ?? [], [tiersQuery.data]);

  useEffect(() => {
    if (!tiersQuery.data || dirty) return;
    const sorted = [...tiersQuery.data.tiers].sort(
      (a, b) => a.rank - b.rank || a.points_threshold - b.points_threshold,
    );
    setRows(sorted.map(rowFromTier));
  }, [tiersQuery.data, dirty]);

  // Memoised: a fresh `[]` each render would re-key the Map below and rebuild
  // every design dropdown on every keystroke in the table.
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const templateById = useMemo(
    () => new Map(templates.map((tpl) => [tpl.id, tpl])),
    [templates],
  );

  const patchRow = (key: string, next: Partial<LadderRow>) => {
    setDirty(true);
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...next } : row)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    setDirty(true);
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  /* -------------------------------------------------------------- *
   * Validation
   * -------------------------------------------------------------- */

  const problems = useMemo(() => {
    const list: string[] = [];
    const slugs = new Set<string>();
    const codes = new Set<string>();
    const ranks = new Set<number>();
    rows.forEach((row, index) => {
      const rank = index + 1;
      if (ranks.has(rank)) {
        list.push(
          t("certificatesUpload.errDuplicateRank", "Rank {{rank}} appears twice.", { rank }),
        );
      }
      ranks.add(rank);
      if (!row.name.trim()) {
        list.push(
          t("certificatesUpload.errTierName", "Rung {{rank}} needs a name.", { rank }),
        );
      }
      const slug = row.slug.trim();
      if (!slug) {
        list.push(t("certificatesUpload.errTierSlug", "Rung {{rank}} needs a slug.", { rank }));
      } else if (slugs.has(slug)) {
        list.push(
          t("certificatesUpload.errDuplicateSlug", "The slug {{slug}} is used twice.", { slug }),
        );
      }
      slugs.add(slug);
      const code = row.code.trim().toUpperCase();
      if (code.length !== 2) {
        list.push(
          t("certificatesUpload.errTierCode", "Rung {{rank}} needs a two letter code.", { rank }),
        );
      } else if (codes.has(code)) {
        list.push(
          t("certificatesUpload.errDuplicateCode", "The code {{code}} is used twice.", { code }),
        );
      }
      codes.add(code);
      // An explicit finite check, so a blank or unparseable field FAILS rather
      // than passing: the previous version compared NaN against NaN, which is
      // false both ways, so the ascending-order rule accepted anything.
      if (!Number.isFinite(row.points_threshold) || row.points_threshold < 0) {
        list.push(
          t("certificatesUpload.errTierPoints", "Rung {{rank}} needs a points threshold.", { rank }),
        );
      } else if (
        index > 0 &&
        Number.isFinite(rows[index - 1].points_threshold) &&
        row.points_threshold <= rows[index - 1].points_threshold
      ) {
        list.push(
          t(
            "certificatesUpload.errAscending",
            "Rung {{rank}} must sit above the rung below it. Every threshold has to be higher than the last.",
            { rank },
          ),
        );
      }
    });
    // The same sentence can be produced by several rows; an admin needs to read
    // the rule once, not five times.
    return Array.from(new Set(list));
  }, [rows, t]);

  /* -------------------------------------------------------------- *
   * Persistence
   * -------------------------------------------------------------- */

  const save = async () => {
    setSaving(true);
    try {
      const keptIds = new Set(rows.map((row) => row.id).filter(Boolean) as number[]);
      const removed = serverTiers.filter((tier) => !keptIds.has(tier.id));

      for (const tier of removed) {
        await adminCertificatesService.deleteTier(clientId, tier.id);
      }

      /**
       * Park every row whose rank is about to change on a rank nothing else
       * uses, before writing the real ones.
       *
       * Reordering two rungs means one of them briefly holds a rank the other
       * still has. If the backend enforces rank uniqueness per client - which a
       * ladder plainly wants - a straight pass would 400 halfway through and
       * leave the ladder half-saved, with the admin looking at an error that
       * says nothing about swapping two rows. The park pass costs one extra
       * request per moved rung on a table that never has more than a handful.
       */
      const rankByServerId = new Map(serverTiers.map((tier) => [tier.id, tier.rank]));
      const moved = rows
        .map((row, index) => ({ row, rank: index + 1 }))
        .filter(({ row, rank }) => row.id != null && rankByServerId.get(row.id) !== rank);
      for (let i = 0; i < moved.length; i += 1) {
        await adminCertificatesService.updateTier(clientId, moved[i].row.id as number, {
          rank: 1000 + i,
        });
      }
      // Sequential, not Promise.all: the ladder has at most a handful of rungs,
      // and a partial failure inside a parallel batch would leave the admin
      // guessing which rungs landed.
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const body = {
          rank: index + 1,
          slug: row.slug.trim(),
          name: row.name.trim(),
          short_name: row.short_name.trim() || row.name.trim(),
          code: row.code.trim().toUpperCase(),
          tagline: row.tagline.trim(),
          points_threshold: Math.round(row.points_threshold),
          template_id: row.template_id,
          is_active: row.is_active,
        };
        if (row.id) {
          await adminCertificatesService.updateTier(clientId, row.id, body);
        } else {
          await adminCertificatesService.createTier(clientId, body);
        }
      }
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: certificateAdminKeys.tiers(clientId) });
      queryClient.invalidateQueries({ queryKey: certificateAdminKeys.overview(clientId) });
      showToast(t("certificatesUpload.ladderSaved", "Points ladder saved."), "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.ladderSaveError", "Could not save the points ladder."),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    setSaving(true);
    try {
      const fresh = await adminCertificatesService.resetTierDefaults(clientId);
      setRows([...fresh.tiers].sort((a, b) => a.rank - b.rank).map(rowFromTier));
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: certificateAdminKeys.tiers(clientId) });
      showToast(
        t("certificatesUpload.ladderReset", "The seven default rungs are back."),
        "success",
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("certificatesUpload.ladderResetError", "Could not restore the default ladder."),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const topPoints = rows.length ? rows[rows.length - 1].points_threshold : 0;
  // Which rungs `reset-defaults` would overwrite, straight from the server, so
  // a button labelled "restore" can say what it will touch.
  const defaultSlugs = tiersQuery.data?.default_slugs ?? [];

  if (tiersQuery.isLoading) {
    return (
      <Stack spacing={2.5}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: "var(--radius-card)" }} />
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: "var(--radius-card)" }} />
      </Stack>
    );
  }

  if (tiersQuery.isError) {
    return (
      <AssessmentEmptyState
        icon="mdi:cloud-alert-outline"
        title={t("certificatesUpload.ladderErrorTitle", "The points ladder did not load")}
        description={t(
          "certificatesUpload.ladderErrorBody",
          "The certificates service did not answer. Nothing has been changed, so retrying is safe.",
        )}
        action={
          <Button
            variant="contained"
            onClick={() => tiersQuery.refetch()}
            startIcon={<IconWrapper icon="mdi:refresh" size={20} />}
            sx={primaryButtonSx}
          >
            {t("common.retry", "Try again")}
          </Button>
        }
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      {/* Ladder visualisation */}
      <Surface>
        <SectionHeading
          icon="mdi:stairs-up"
          title={t("certificatesUpload.ladderShape", "The shape of the progression")}
          subtitle={t(
            "certificatesUpload.ladderShapeNote",
            "Rungs are spaced evenly by rank so every one stays readable. The number above each rung is its real threshold.",
          )}
        />
        {rows.length === 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
            {t(
              "certificatesUpload.ladderEmptyShape",
              "Add a rung below and it appears here.",
            )}
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", pb: 1 }}>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                minWidth: rows.length * 128,
                pt: 1,
              }}
            >
              {rows.map((row, index) => {
                // Height by rank, not by points: a linear points axis buries the
                // first four rungs against the baseline once the top rung is
                // 100,000, and the picture is about the ORDER of the climb. The
                // threshold is printed on every rung so nothing is hidden.
                const height = 34 + ((index + 1) / rows.length) * 86;
                const invalid =
                  index > 0 && row.points_threshold <= rows[index - 1].points_threshold;
                return (
                  <Stack key={row.key} spacing={0.75} alignItems="center" sx={{ width: 112 }}>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        color: invalid ? "var(--error-500)" : "var(--font-primary)",
                      }}
                    >
                      {formatPoints(row.points_threshold)}
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        height,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: "var(--font-light)",
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        opacity: row.is_active ? 1 : 0.4,
                        background: invalid
                          ? "linear-gradient(180deg, #f87171, #dc2626)"
                          : "linear-gradient(180deg, #a855f7, #7c3aed)",
                        boxShadow: invalid
                          ? "0 10px 22px -12px rgba(220,38,38,0.8)"
                          : "0 10px 22px -12px rgba(124,58,237,0.8)",
                      }}
                    >
                      {row.code.trim().toUpperCase() || index + 1}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--font-primary)",
                        textAlign: "center",
                        lineHeight: 1.25,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {row.name || t("certificatesUpload.untitledTier", "Untitled rung")}
                    </Typography>
                  </Stack>
                );
              })}
            </Box>
          </Box>
        )}
      </Surface>

      {problems.length > 0 ? (
        <NoticeStrip
          tone="danger"
          title={t("certificatesUpload.ladderProblems", "Fix these before saving")}
        >
          <Stack spacing={0.25}>
            {problems.map((message) => (
              <Box key={message} component="span" sx={{ display: "block" }}>
                {message}
              </Box>
            ))}
          </Stack>
        </NoticeStrip>
      ) : null}

      {/* The table */}
      <Surface padded={false} sx={{ overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 1320 }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-tertiary)",
                    bgcolor: "var(--surface)",
                    borderBottom: "1px solid var(--border-default)",
                    whiteSpace: "nowrap",
                  },
                  "& + tbody td": { borderColor: "var(--border-default)" },
                }}
              >
                <TableCell sx={{ width: 64 }}>{t("certificatesUpload.colRank", "Rank")}</TableCell>
                <TableCell>{t("certificatesUpload.colTierName", "Name")}</TableCell>
                <TableCell>{t("certificatesUpload.colSlug", "Slug")}</TableCell>
                <TableCell sx={{ width: 96 }}>{t("certificatesUpload.colCode", "Code")}</TableCell>
                <TableCell>{t("certificatesUpload.colShortName", "Short name")}</TableCell>
                <TableCell>{t("certificatesUpload.colTagline", "Tagline")}</TableCell>
                <TableCell sx={{ width: 132 }}>
                  {t("certificatesUpload.colPoints", "Points")}
                </TableCell>
                <TableCell sx={{ width: 220 }}>
                  {t("certificatesUpload.colTemplate", "Design")}
                </TableCell>
                <TableCell sx={{ width: 90 }}>
                  {t("certificatesUpload.colIssued", "Issued")}
                </TableCell>
                <TableCell sx={{ width: 78 }}>
                  {t("certificatesUpload.colActive", "Active")}
                </TableCell>
                <TableCell sx={{ width: 128 }} align="right">
                  {t("certificatesUpload.colActions", "Actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const bound = row.template_id ? templateById.get(row.template_id) : undefined;
                return (
                  <TableRow key={row.key} hover>
                    <TableCell>
                      <MetaPill
                        color="var(--ai-violet)"
                        label={index + 1}
                        sx={{ minWidth: 34, justifyContent: "center", fontWeight: 800 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={row.name}
                        placeholder={t("certificatesUpload.tierNamePlaceholder", "Learning Foundations")}
                        onChange={(e) =>
                          patchRow(row.key, {
                            name: e.target.value,
                            slug: row.slugTouched ? row.slug : slugify(e.target.value),
                          })
                        }
                        InputProps={{ disableUnderline: false, sx: { fontWeight: 700, fontSize: 14 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={row.slug}
                        onChange={(e) =>
                          patchRow(row.key, { slug: slugify(e.target.value), slugTouched: true })
                        }
                        InputProps={{
                          sx: { fontFamily: "var(--font-mono)", fontSize: 12.5 },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={row.code}
                        inputProps={{ maxLength: 2 }}
                        onChange={(e) =>
                          patchRow(row.key, {
                            code: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase(),
                          })
                        }
                        InputProps={{ sx: { fontWeight: 800, letterSpacing: "0.08em" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={row.short_name}
                        placeholder={row.name}
                        onChange={(e) => patchRow(row.key, { short_name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      {/* The tagline is PRINTED on the certificate and the
                          backend has always stored it; the ladder simply never
                          sent it, so an admin had no way to set the line their
                          learners actually read. */}
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={row.tagline}
                        placeholder={t(
                          "certificatesUpload.tierTaglinePlaceholder",
                          "for reaching this milestone",
                        )}
                        onChange={(e) => patchRow(row.key, { tagline: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        type="number"
                        fullWidth
                        value={Number.isFinite(row.points_threshold) ? row.points_threshold : 0}
                        onChange={(e) =>
                          patchRow(row.key, { points_threshold: Number(e.target.value) })
                        }
                        error={
                          index > 0 && row.points_threshold <= rows[index - 1].points_threshold
                        }
                        InputProps={{ sx: { fontWeight: 700 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TextField
                          select
                          size="small"
                          variant="standard"
                          fullWidth
                          value={row.template_id ?? ""}
                          onChange={(e) =>
                            patchRow(row.key, {
                              template_id: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        >
                          <MenuItem value="">
                            {t("certificatesUpload.noTemplate", "No design yet")}
                          </MenuItem>
                          {templates.map((tpl) => (
                            <MenuItem key={tpl.id} value={tpl.id}>
                              {tpl.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Tooltip title={t("certificatesUpload.previewDesign", "Preview this design")}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!bound}
                              onClick={() => bound && setPreviewTemplate(bound)}
                            >
                              <IconWrapper icon="mdi:eye-outline" size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--font-primary)",
                        }}
                      >
                        {row.issued_count > 0 ? formatPoints(row.issued_count) : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {/* Deactivating a rung that has awarded credentials is not
                          the same as deleting one, but it still stops a ladder
                          the learners are climbing. Removing it outright is what
                          NULLs the tier FK on every credential it issued and
                          disarms the (student, tier) partial unique that stops
                          the sweep minting them a second time - which is why the
                          backend soft-deletes and why this warns first. */}
                      <Tooltip
                        title={
                          row.issued_count > 0 && !row.is_active
                            ? t(
                                "certificatesUpload.tierInactiveWarning",
                                "This rung has already awarded {{count}} certificate(s). Turning it off stops new ones; the ones already issued are untouched.",
                                { count: row.issued_count },
                              )
                            : ""
                        }
                      >
                        <Switch
                          size="small"
                          checked={row.is_active}
                          onChange={(e) => patchRow(row.key, { is_active: e.target.checked })}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--ai-violet)" },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "var(--ai-violet)",
                            },
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          aria-label={t("certificatesUpload.moveUp", "Move up")}
                        >
                          <IconWrapper icon="mdi:arrow-up" size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === rows.length - 1}
                          onClick={() => move(index, 1)}
                          aria-label={t("certificatesUpload.moveDown", "Move down")}
                        >
                          <IconWrapper icon="mdi:arrow-down" size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "var(--error-500)" }}
                          onClick={() => {
                            setDirty(true);
                            setRows((prev) => prev.filter((item) => item.key !== row.key));
                          }}
                          aria-label={t("certificatesUpload.removeRung", "Remove rung")}
                        >
                          <IconWrapper icon="mdi:trash-can-outline" size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        {rows.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <AssessmentEmptyState
              icon="mdi:stairs"
              title={t("certificatesUpload.noTiersTitle", "No rungs on the ladder")}
              description={t(
                "certificatesUpload.noTiersBody",
                "A rung awards a certificate the moment a learner's total points cross its threshold. Restore the seven seeded rungs, or build your own.",
              )}
              action={
                <Button
                  variant="contained"
                  onClick={() => setConfirmReset(true)}
                  startIcon={<IconWrapper icon="mdi:backup-restore" size={20} />}
                  sx={primaryButtonSx}
                >
                  {t("certificatesUpload.resetDefaults", "Restore the default ladder")}
                </Button>
              }
            />
          </Box>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
          sx={{
            p: 2,
            borderTop: "1px solid var(--border-default)",
          }}
        >
          <Button
            onClick={() => {
              setDirty(true);
              setRows((prev) => [...prev, blankRow(topPoints)]);
            }}
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            sx={{ ...quietButtonSx, color: "var(--ai-violet)" }}
          >
            {t("certificatesUpload.addRung", "Add a rung")}
          </Button>
          <Button
            color="inherit"
            onClick={() => setConfirmReset(true)}
            startIcon={<IconWrapper icon="mdi:backup-restore" size={20} />}
            sx={quietButtonSx}
          >
            {t("certificatesUpload.resetDefaults", "Restore the default ladder")}
          </Button>
          <Box sx={{ flex: 1 }} />
          {dirty ? (
            <MetaPill
              icon="mdi:circle-medium"
              color="var(--warning-600)"
              label={t("certificatesUpload.unsaved", "Unsaved changes")}
            />
          ) : null}
          <Button
            onClick={() => {
              setDirty(false);
              const sorted = [...serverTiers].sort((a, b) => a.rank - b.rank);
              setRows(sorted.map(rowFromTier));
            }}
            disabled={!dirty || saving}
            sx={quietButtonSx}
          >
            {t("certificatesUpload.discard", "Discard")}
          </Button>
          <LoadingButton
            variant="contained"
            loading={saving}
            disabled={!dirty || problems.length > 0}
            onClick={save}
            startIcon={<IconWrapper icon="mdi:content-save-outline" size={20} />}
            sx={{ ...primaryButtonSx, px: 3 }}
          >
            {t("certificatesUpload.saveLadder", "Save ladder")}
          </LoadingButton>
        </Stack>
      </Surface>

      <ConfirmDialog
        open={confirmReset}
        title={t("certificatesUpload.resetLadderTitle", "Restore the default ladder?")}
        message={t(
          "certificatesUpload.resetLadderBody",
          "This restores the {{count}} seeded rung(s): {{slugs}}. Rungs your team authored are left alone, and certificates already issued keep the threshold they were awarded at, so no learner loses a credential.",
          {
            count: defaultSlugs.length,
            slugs: defaultSlugs.join(", "),
          },
        )}
        confirmText={t("certificatesUpload.resetConfirm", "Restore")}
        cancelText={t("common.cancel", "Cancel")}
        confirmColor="error"
        onConfirm={() => {
          setConfirmReset(false);
          void resetDefaults();
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <Dialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 4, bgcolor: "var(--card-bg)" } },
        }}
      >
        <DialogContent sx={{ p: 2.5 }}>
          {previewTemplate ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                border: "1px solid var(--border-default)",
                bgcolor: "var(--surface)",
              }}
            >
              <CertificatePreview
                payload={previewPayloadFromTemplate(previewTemplate, issuer, {
                  sourceKind: "points",
                  subtitle: previewTemplate.name,
                })}
                labels={labels}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
