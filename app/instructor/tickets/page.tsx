"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import {
  ticketService,
  TICKET_CATEGORY_OPTIONS,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from "@/lib/services/ticket.service";

/**
 * An instructor's ticket queue: the doubts raised by students in the cohorts they staff.
 *
 * This is the surface that replaces "My Tickets" for a teacher. The distinction matters — an
 * instructor is not a person filing support requests, they are the person answering their batch's
 * questions, and the previous menu entry pointed them at the learner raise-flow instead.
 *
 * Scoping is entirely the backend's: `tickets/instructor/` returns every ticket from a cohort this
 * caller staffs plus anything assigned to them directly, and nothing else. There is deliberately no
 * client-side filter standing in for that, so the two cannot disagree.
 */

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  OPEN: { bg: "color-mix(in srgb,#f59e0b 14%,transparent)", fg: "#b45309" },
  IN_PROGRESS: { bg: "color-mix(in srgb,#6366f1 14%,transparent)", fg: "#4338ca" },
  RESOLVED: { bg: "color-mix(in srgb,#10b981 14%,transparent)", fg: "#047857" },
  CLOSED: { bg: "color-mix(in srgb,#64748b 14%,transparent)", fg: "#475569" },
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
];

export default function InstructorTicketsPage() {
  const { push } = useInstantNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  // Resolve-from-here: contract change - a ticket's ASSIGNEE may resolve it, not only admins.
  const [resolveFor, setResolveFor] = useState<Ticket | null>(null);
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await ticketService.listInstructor(config.clientId, {
          ...(status ? { status: status as TicketStatus } : {}),
          ...(category ? { category } : {}),
        });
        if (!cancelled) setTickets(rows);
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, category]);

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === "OPEN").length;
    return { total: tickets.length, open };
  }, [tickets]);

  /**
   * Whether THIS teacher owns the ticket. TicketUserMini carries both the profile id (`id`) and
   * the User id (`user_id`), and the auth context's id space isn't guaranteed to be either, so
   * match on both plus the email - a false negative only hides a convenience button.
   */
  const isAssignedToMe = useCallback(
    (t: Ticket): boolean => {
      const a = t.assigned_to_user;
      if (!a || !user) return false;
      if (a.id === user.id || a.user_id === user.id) return true;
      return Boolean(a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase());
    },
    [user],
  );

  const submitResolve = async () => {
    if (!resolveFor || !notes.trim() || resolving) return;
    setResolving(true);
    try {
      const updated = await ticketService.resolve(Number(config.clientId), resolveFor.id, {
        admin_resolution_notes: notes.trim(),
      });
      setTickets((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
      setResolveFor(null);
      setNotes("");
      showToast("Ticket resolved. The student has been notified.", "success");
    } catch (err) {
      // unwrapError already put the server's own reason in the message.
      showToast(err instanceof Error ? err.message : "Couldn't resolve the ticket.", "error");
    } finally {
      setResolving(false);
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Support"
        icon="mdi:ticket-confirmation-outline"
        title="Cohort tickets"
        description="Doubts raised by students in the batches you teach."
      />

      <Reveal>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key || "all"}
              label={f.label}
              onClick={() => setStatus(f.key)}
              sx={{
                fontWeight: 700,
                cursor: "pointer",
                bgcolor: status === f.key ? "var(--primary-500)" : "var(--card-bg)",
                color: status === f.key ? "#fff" : "var(--font-secondary)",
                border: "1px solid var(--border-default)",
              }}
            />
          ))}
        </Stack>
        {/* Category filter — passed straight through as ?category=; the backend still scopes what
            a teacher may see (assigned to them: any category; their cohorts: teaching categories). */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="All categories"
            size="small"
            onClick={() => setCategory("")}
            sx={{
              fontWeight: 700,
              cursor: "pointer",
              bgcolor: category === "" ? "var(--primary-500)" : "var(--card-bg)",
              color: category === "" ? "#fff" : "var(--font-secondary)",
              border: "1px solid var(--border-default)",
            }}
          />
          {TICKET_CATEGORY_OPTIONS.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              size="small"
              onClick={() => setCategory(category === c.value ? "" : c.value)}
              sx={{
                fontWeight: 700,
                cursor: "pointer",
                bgcolor: category === c.value ? "var(--primary-500)" : "var(--card-bg)",
                color: category === c.value ? "#fff" : "var(--font-secondary)",
                border: "1px solid var(--border-default)",
              }}
            />
          ))}
        </Stack>
      </Reveal>

      {loading ? (
        <Typography sx={{ color: "var(--font-secondary)" }}>Loading…</Typography>
      ) : tickets.length === 0 ? (
        <Reveal>
          <Box
            sx={{
              borderRadius: 3,
              border: "1px dashed var(--border-default)",
              p: 4,
              textAlign: "center",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Icon icon="mdi:ticket-outline" width={34} style={{ color: "#94a3b8" }} />
            <Typography sx={{ fontWeight: 700, mt: 1 }}>No tickets yet</Typography>
            {/* The most likely cause by far, so say it plainly rather than let a teacher
                conclude the page is broken. */}
            <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mt: 0.5 }}>
              Tickets from students in the cohorts you teach appear here. If you expect to see some,
              ask an admin to confirm you are assigned to that cohort.
            </Typography>
          </Box>
        </Reveal>
      ) : (
        <Stack spacing={1.25}>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.8rem" }}>
            {counts.total} ticket{counts.total === 1 ? "" : "s"}
            {counts.open ? ` · ${counts.open} open` : ""}
          </Typography>
          {tickets.map((t) => {
            const tone = STATUS_TONES[t.status] ?? STATUS_TONES.CLOSED;
            return (
              <Reveal key={t.id}>
                <Box
                  onClick={() => push(`/tickets/${t.id}`)}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid var(--border-default)",
                    bgcolor: "var(--card-bg)",
                    p: 1.75,
                    cursor: "pointer",
                    transition: "border-color .15s",
                    "&:hover": { borderColor: "var(--primary-400)" },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.94rem" }} noWrap>
                        {t.subject}
                      </Typography>
                      <Typography
                        sx={{ color: "var(--font-secondary)", fontSize: "0.78rem", mt: 0.3 }}
                      >
                        {t.raised_by?.full_name || "A student"}
                        {t.cohort_name ? ` · ${t.cohort_name}` : ""}
                        {` · ${t.category_display}`}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1, py: 0.3, borderRadius: 999, fontSize: "0.68rem", fontWeight: 800,
                        bgcolor: tone.bg, color: tone.fg, flexShrink: 0,
                      }}
                    >
                      {t.status_display || t.status}
                    </Box>
                  </Stack>
                  {/* Assigned vs unassigned is the triage signal a teacher scans for. */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.6 }}>
                    {t.assigned_to_user && (
                      <Typography
                        sx={{ color: "var(--font-secondary)", fontSize: "0.72rem", flex: 1, minWidth: 0 }}
                      >
                        <Icon icon="mdi:account-check-outline" width={13} style={{ verticalAlign: -2 }} />{" "}
                        {t.assigned_to_user.full_name}
                        {isAssignedToMe(t) ? " (you)" : ""}
                        {t.assigned_by_user === null ? " (auto-routed)" : ""}
                      </Typography>
                    )}
                    {/* The assignee may resolve their own ticket (not only admins) - offer it
                        right here instead of sending the teacher hunting for an admin. */}
                    {isAssignedToMe(t) && t.status !== "RESOLVED" && (
                      <Chip
                        size="small"
                        label="Resolve"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotes(t.admin_resolution_notes || "");
                          setResolveFor(t);
                        }}
                        sx={{
                          fontWeight: 800,
                          cursor: "pointer",
                          ml: "auto",
                          color: "#047857",
                          bgcolor: "color-mix(in srgb,#10b981 14%,transparent)",
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              </Reveal>
            );
          })}
        </Stack>
      )}

      {/* Assignee resolve dialog - a lighter sibling of the admin resolve form (that one is
          inline in the admin detail page, not a reusable component). Notes are required; the
          endpoint notifies the student on success. */}
      <Dialog
        open={Boolean(resolveFor)}
        onClose={resolving ? undefined : () => setResolveFor(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Resolve ticket{resolveFor ? ` · ${resolveFor.subject}` : ""}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mb: 1.5 }}>
            The student is notified by email and in-app with what you write here.
          </Typography>
          <TextField
            label="Resolution notes *"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Explain how you resolved the doubt, and any follow-up steps."
            disabled={resolving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setResolveFor(null)}
            disabled={resolving}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitResolve()}
            disabled={resolving || !notes.trim()}
            startIcon={
              resolving ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:check" width={16} />
            }
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.5, bgcolor: "#047857", "&:hover": { bgcolor: "#065f46" } }}
          >
            {resolving ? "Resolving…" : "Resolve & notify"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
