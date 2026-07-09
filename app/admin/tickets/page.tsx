"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Pagination,
  InputAdornment,
  Chip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { TicketStatusChip } from "@/components/tickets/TicketStatusChip";
import { TicketHeroIcon } from "@/components/tickets/TicketHeroIcon";
import { AssigneesDialog } from "@/components/tickets/AssigneesDialog";
import { config } from "@/lib/config";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdminArea, isClientOrgAdminRole } from "@/lib/auth/role-utils";
import {
  ticketService,
  AdminTicketListResponse,
  Ticket,
  TicketStatus,
  TicketCategory,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from "@/lib/services/ticket.service";

const PAGE_SIZE = 15;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function StatCard({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 160,
        p: 2.25,
        borderRadius: 3,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        border: "1px solid",
        borderColor: active ? color : "var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow: active
          ? `0 4px 14px ${color}1f`
          : "0 1px 2px rgba(15,23,42,0.04)",
        transition: "all 0.15s ease",
        "&::before": active
          ? {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: color,
            }
          : {},
        "&:hover": onClick
          ? {
              borderColor: color,
              boxShadow: `0 4px 12px ${color}1f`,
              transform: "translateY(-1px)",
            }
          : {},
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          fontSize: "0.7rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color,
          fontSize: "1.75rem",
          lineHeight: 1.1,
          mt: 0.5,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </Typography>
    </Paper>
  );
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const clientId = useMemo(
    () => Number(clientInfo?.id ?? config.clientId),
    [clientInfo?.id],
  );

  const isAdmin = canAccessAdminArea(user?.role);
  // Mirrors the backend gate on the assignee endpoints: org admins only, since this list
  // decides which mailboxes receive every student's ticket details.
  const canManageAssignees = isClientOrgAdminRole(user?.role);

  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("OPEN");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "">("");
  const [reopenedOnly, setReopenedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [data, setData] = useState<AdminTicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(
    1,
    Math.ceil((data?.count ?? 0) / PAGE_SIZE),
  );

  const load = useCallback(async () => {
    if (!clientId || !isAdmin) return;
    setLoading(true);
    try {
      const res = await ticketService.listAdmin(clientId, {
        status: statusFilter,
        category: categoryFilter,
        reopened: reopenedOnly || undefined,
        search: search.trim(),
        page,
        limit: PAGE_SIZE,
      });
      setData(res);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load tickets",
        "error",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    clientId,
    isAdmin,
    statusFilter,
    categoryFilter,
    reopenedOnly,
    search,
    page,
    showToast,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAdmin) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <IconWrapper icon="mdi:lock" size={48} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
            Admin access required
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            You don't have permission to view the support tickets dashboard.
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  const tickets: Ticket[] = data?.results ?? [];

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1320, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "var(--ticket-text-strong)",
                fontSize: { xs: "1.35rem", md: "1.5rem" },
                letterSpacing: -0.2,
              }}
            >
              Ticket Management
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.5 }}>
              All support requests from your students. Click any row to view and
              resolve.
            </Typography>
          </Box>
          {canManageAssignees && (
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:account-group" size={18} />}
              onClick={() => setAssigneesOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 999,
                px: 2.5,
                py: 1,
                backgroundColor: "var(--ticket-cta-green)",
                color: "var(--font-light)",
                boxShadow: "0 4px 12px rgba(22,163,74,0.28)",
                "&:hover": {
                  backgroundColor: "var(--ticket-cta-green-hover)",
                  boxShadow: "0 6px 16px rgba(22,163,74,0.36)",
                },
              }}
            >
              Assignees
            </Button>
          )}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <StatCard
            label="Open"
            count={data?.open_count ?? 0}
            color="var(--proctoring-strong-dark)"
            active={statusFilter === "OPEN"}
            onClick={() => {
              setStatusFilter("OPEN");
              setPage(1);
            }}
          />
          <StatCard
            label="In Progress"
            count={data?.in_progress_count ?? 0}
            color="var(--ticket-brand)"
            active={statusFilter === "IN_PROGRESS"}
            onClick={() => {
              setStatusFilter("IN_PROGRESS");
              setPage(1);
            }}
          />
          <StatCard
            label="Resolved"
            count={data?.resolved_count ?? 0}
            color="var(--ats-success-muted)"
            active={statusFilter === "RESOLVED"}
            onClick={() => {
              setStatusFilter("RESOLVED");
              setPage(1);
            }}
          />
          <StatCard
            label="All"
            count={
              (data?.open_count ?? 0) +
              (data?.in_progress_count ?? 0) +
              (data?.resolved_count ?? 0)
            }
            color="var(--font-secondary)"
            active={statusFilter === ""}
            onClick={() => {
              setStatusFilter("");
              setPage(1);
            }}
          />
        </Stack>

        <Paper
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid var(--border-default)",
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            position: "relative",
            backgroundColor: "var(--card-bg)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, var(--ticket-brand) 0%, var(--accent-indigo) 100%)",
              zIndex: 1,
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              p: 2,
              borderBottom: "1px solid var(--ticket-row-divider)",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <TextField
              size="small"
              placeholder="Search subject, description, or user email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              sx={{ flex: 1, minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:magnify" size={18} color="var(--font-secondary)" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TicketStatus | "");
                setPage(1);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {TICKET_STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as TicketCategory | "");
                setPage(1);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All categories</MenuItem>
              {TICKET_CATEGORY_OPTIONS.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <Chip
              icon={
                <IconWrapper
                  icon="mdi:lock-reset"
                  size={14}
                  color={reopenedOnly ? "var(--card-bg)" : "var(--ticket-reopen-strong)"}
                />
              }
              label="Reopened only"
              clickable
              onClick={() => {
                setReopenedOnly((v) => !v);
                setPage(1);
              }}
              sx={{
                fontWeight: 600,
                height: 36,
                px: 0.5,
                borderRadius: 999,
                backgroundColor: reopenedOnly ? "var(--ticket-reopen)" : "var(--ticket-reopen-bg)",
                color: reopenedOnly ? "var(--card-bg)" : "var(--warning-strong)",
                border: `1px solid ${reopenedOnly ? "var(--ticket-reopen)" : "var(--ticket-reopen-border)"}`,
                "& .MuiChip-icon": {
                  ml: 0.75,
                  color: reopenedOnly ? "var(--card-bg)" : "var(--ticket-reopen-strong)",
                },
                "&:hover": {
                  backgroundColor: reopenedOnly ? "var(--ticket-reopen-hover)" : "var(--ticket-reopen-soft)",
                },
              }}
            />
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={28} />
            </Box>
          ) : tickets.length === 0 ? (
            <Box
              sx={{
                py: { xs: 6, md: 8 },
                px: { xs: 3, md: 5 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background:
                  "radial-gradient(ellipse at top, var(--info-surface) 0%, var(--card-bg) 65%)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2.5,
                  filter:
                    "drop-shadow(0 6px 14px rgba(66,133,244,0.22))",
                }}
              >
                <TicketHeroIcon size={148} color="var(--ticket-brand)" />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--ticket-text-strong)",
                  fontSize: { xs: "1.125rem", md: "1.25rem" },
                }}
              >
                {statusFilter || categoryFilter || search.trim()
                  ? "No tickets match the current filters"
                  : "All caught up — your queue is empty"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1.25,
                  color: "var(--font-secondary)",
                  maxWidth: 480,
                  lineHeight: 1.6,
                }}
              >
                {statusFilter || categoryFilter || search.trim()
                  ? "Try clearing a filter or switching tabs to see other tickets."
                  : "No open support tickets right now. New tickets raised by students will appear here in real time."}
              </Typography>

              {(statusFilter || categoryFilter || search.trim()) && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setStatusFilter("");
                    setCategoryFilter("");
                    setSearch("");
                    setPage(1);
                  }}
                  startIcon={
                    <IconWrapper icon="mdi:filter-remove-outline" size={18} />
                  }
                  sx={{
                    mt: 3.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 999,
                    px: 3,
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "var(--card-bg)" }}>
                      {[
                        "ID",
                        "Subject",
                        "From",
                        "Category",
                        "Status",
                        "Created",
                      ].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            color: "var(--font-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            borderBottom: "1px solid var(--border-default)",
                            py: 1.75,
                            backgroundColor: "var(--card-bg)",
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                      <TableCell
                        sx={{
                          borderBottom: "1px solid var(--border-default)",
                          backgroundColor: "var(--card-bg)",
                        }}
                      />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow
                        key={t.id}
                        sx={{
                          cursor: "pointer",
                          transition: "background-color 0.12s ease",
                          "&:hover": { backgroundColor: "var(--surface)" },
                          "& .MuiTableCell-root": {
                            borderBottom: "1px solid var(--ticket-row-divider)",
                          },
                        }}
                        onClick={() => router.push(`/admin/tickets/${t.id}`)}
                      >
                        <TableCell
                          sx={{
                            color: "var(--font-secondary)",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          #{t.id}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "var(--ticket-text-strong)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.subject}
                          </Typography>
                          {t.description && t.description !== t.subject && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--font-secondary)",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ color: "var(--ticket-text-strong)", fontWeight: 500 }}
                          >
                            {t.raised_by?.full_name || "—"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "var(--font-secondary)",
                              fontSize: "0.72rem",
                            }}
                          >
                            {t.raised_by?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.category_display}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              backgroundColor: "var(--surface-indigo-light)",
                              color: "var(--ticket-brand-strong)",
                              border: "1px solid var(--ticket-brand-soft)",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            <TicketStatusChip status={t.status} />
                            {t.reopened_at && (
                              <Chip
                                label="Reopened"
                                size="small"
                                icon={
                                  <IconWrapper
                                    icon="mdi:lock-reset"
                                    size={12}
                                    color="var(--warning-strong)"
                                  />
                                }
                                sx={{
                                  height: 22,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  letterSpacing: 0.3,
                                  backgroundColor: "var(--ticket-reopen-bg)",
                                  color: "var(--warning-strong)",
                                  border: "1px solid var(--ticket-reopen-border)",
                                  "& .MuiChip-icon": {
                                    ml: 0.5,
                                    mr: -0.25,
                                  },
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell
                          sx={{ color: "var(--font-secondary)", fontSize: "0.825rem" }}
                        >
                          {formatDate(t.created_at)}
                        </TableCell>
                        <TableCell align="right">
                          <IconWrapper
                            icon="mdi:chevron-right"
                            size={18}
                            color="var(--border-light)"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 2,
                    borderTop: "1px solid var(--ticket-row-divider)",
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      {canManageAssignees && (
        <AssigneesDialog
          open={assigneesOpen}
          clientId={clientId}
          onClose={() => setAssigneesOpen(false)}
        />
      )}
    </MainLayout>
  );
}
