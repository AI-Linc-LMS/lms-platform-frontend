"use client";

import type { ReactNode } from "react";
import { Box, Chip, Stack, Switch, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { AdminAdaptiveCourseDetail, EnrollmentSource } from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Everything about a course that is not its content.
 *
 * These controls used to be nine outline pills in one wrapping row above the tabs, all rendered
 * identically: a status readout, three dialog-openers, three stateful toggles, a price and a
 * publish button. Nothing in the visual language told you which of those a click would do, the
 * labels named the flag ("Auto-enroll off") rather than the outcome, and every real explanation
 * lived in a `title` tooltip — invisible on touch, invisible to a keyboard, gone the moment you
 * looked away.
 *
 * Two rules here, and they are the whole design:
 *   1. Switches are switches and buttons are buttons.
 *   2. Every group states the OUTCOME in a sentence, not the flag name.
 */

const SOURCE_LABEL: Record<EnrollmentSource | "unknown", string> = {
  self: "joined themselves",
  paid: "purchased",
  admin: "added by an admin",
  bulk: "bulk import",
  seed: "seeded",
  migration: "migrated",
  unknown: "unknown",
};

function SettingsCard({
  icon, title, subtitle, children,
}: { icon: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.75 },
        borderRadius: 4,
        border: "1px solid #e4e7f0",
        bgcolor: "#fff",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 30, height: 30, borderRadius: 2, flexShrink: 0, display: "grid",
            placeItems: "center", color: "#fff",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
          }}
        >
          <Icon icon={icon} width={17} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: "1px" }}>{subtitle}</Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

/**
 * One boolean. Named by what it does to students, never by the field name, and carrying its own
 * disabled reason so a control that cannot be used says why instead of just looking broken.
 */
function SettingRow({
  label, help, checked, onChange, pending = false, disabledReason,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: () => void;
  pending?: boolean;
  disabledReason?: string;
}) {
  const disabled = pending || Boolean(disabledReason);
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.25 }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.76rem", color: "#64748b", mt: 0.25, lineHeight: 1.5 }}>{help}</Typography>
        {disabledReason && (
          <Typography sx={{ fontSize: "0.72rem", color: "#b45309", mt: 0.5, fontWeight: 600 }}>
            {disabledReason}
          </Typography>
        )}
      </Box>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7c3aed" },
        }}
      />
    </Stack>
  );
}

/** The state of the world, in a sentence. If this is hard to write, the settings are wrong. */
function ResolvedState({ lines }: { lines: string[] }) {
  return (
    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #eef2f7" }}>
      <Typography
        sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#94a3b8", mb: 0.75 }}
      >
        Right now
      </Typography>
      <Stack spacing={0.5}>
        {lines.map((line) => (
          <Stack key={line} direction="row" spacing={0.75} alignItems="flex-start">
            <Box sx={{ color: "#a855f7", mt: "2px" }}><Icon icon="mdi:circle-small" width={16} /></Box>
            <Typography sx={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.5 }}>{line}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export interface CourseSettingsPanelProps {
  course: AdminAdaptiveCourseDetail;
  tenantName: string;
  pendingSetting: string | null;
  canSetPricing: boolean;
  onToggleAutoEnroll: () => void;
  onToggleSelfEnroll: () => void;
  onToggleContentLock: () => void;
  onToggleClipboard: () => void;
  onOpenPricing: () => void;
  onAssignCohorts: () => void;
  onEditDetails: () => void;
  onPublish: () => void;
  publishing?: boolean;
  /** Content health ("N items still missing") + its regenerate action. */
  healthSlot?: ReactNode;
  /** Cover art panel, moved out of its own tab. */
  coverSlot?: ReactNode;
  /** Cohort start date, moved out of the Content tab so all pacing sits together. */
  scheduleSlot?: ReactNode;
}

export function CourseSettingsPanel({
  course,
  tenantName,
  pendingSetting,
  canSetPricing,
  onToggleAutoEnroll,
  onToggleSelfEnroll,
  onToggleContentLock,
  onToggleClipboard,
  onOpenPricing,
  onAssignCohorts,
  onEditDetails,
  onPublish,
  publishing = false,
  healthSlot,
  coverSlot,
  scheduleSlot,
}: CourseSettingsPanelProps) {
  const summary = course.enrollment_summary;
  const cohorts = course.assigned_cohorts ?? [];

  // Catalog listing is DERIVED, not a peer switch: a paid course is listed whether or not
  // self_enroll_enabled is set (the backend filters on `self_enroll_enabled OR is_paid`, which
  // is deliberate — it stops priced courses being invisible everywhere). Showing self-enroll as
  // an independent toggle while pricing silently overrode it is how this got confusing.
  const listedInCatalog = course.self_enroll_enabled || course.is_paid;

  const accessLines: string[] = [];
  if (course.auto_enroll) {
    accessLines.push(`Every student at ${tenantName} is enrolled automatically, including anyone who joins later.`);
  }
  if (listedInCatalog) {
    accessLines.push(
      course.is_paid && !course.self_enroll_enabled
        ? "Listed in the student catalog because it has a price."
        : "Students can find this in the catalog and join it themselves.",
    );
  }
  if (cohorts.length) {
    accessLines.push(`Assigned to ${cohorts.map((c) => c.name).join(", ")}.`);
  }
  if (!accessLines.length) {
    accessLines.push("Only students you add directly. It is not listed anywhere for students to find.");
  }
  if (!course.is_published) {
    accessLines.push("None of this takes effect until the course is published.");
  }

  const pacingLines = course.content_locked
    ? [
        "Weeks unlock on the cohort schedule rather than all at once.",
        "Without a start date below, there are no deadlines and no late penalties yet.",
      ]
    : ["Every week is open from the start, and all work earns full points whenever it is done."];

  return (
    <Stack spacing={2.5}>
      <SettingsCard
        icon="mdi:card-text-outline"
        title="Course details"
        subtitle={course.is_published ? "Published — students can see this" : "Draft — not visible to students"}
      >
        <Stack spacing={1.5}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{course.title}</Typography>
            {course.description && (
              <Typography sx={{ fontSize: "0.8rem", color: "#64748b", mt: 0.5, lineHeight: 1.55 }}>
                {course.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Box
              component="button"
              onClick={onEditDetails}
              sx={{
                px: 2, py: 0.85, borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                fontWeight: 800, fontSize: "0.78rem", color: "#7c3aed",
                bgcolor: "#f5f3ff", border: "1px solid #ede9fe",
              }}
            >
              Edit title &amp; description
            </Box>
            <Box
              component="button"
              onClick={onPublish}
              disabled={publishing}
              sx={{
                px: 2, py: 0.85, borderRadius: 999, cursor: publishing ? "default" : "pointer",
                fontFamily: "inherit", fontWeight: 800, fontSize: "0.78rem",
                color: course.is_published ? "#475569" : "#fff",
                bgcolor: course.is_published ? "#f8fafc" : "#7c3aed",
                border: course.is_published ? "1px solid #e4e7f0" : "1px solid transparent",
                opacity: publishing ? 0.6 : 1,
              }}
            >
              {course.is_published ? "Unpublish" : "Publish course"}
            </Box>
          </Stack>
          <ResolvedState
            lines={[
              course.is_published
                ? "Students who have access can open this course now."
                : "Nobody can open this yet. Publishing is what makes every setting below take effect.",
            ]}
          />
        </Stack>
      </SettingsCard>

      {healthSlot && (
        <SettingsCard
          icon="mdi:clipboard-alert-outline"
          title="Content health"
          subtitle="Anything still missing from this course"
        >
          {healthSlot}
        </SettingsCard>
      )}

      {/* Roster first. The question an admin actually has is not "what is auto_enroll set to",
          it is "who is in this course and how did they get here". */}
      <SettingsCard
        icon="mdi:account-group-outline"
        title="Who is enrolled"
        subtitle={summary ? `${summary.total} student${summary.total === 1 ? "" : "s"}` : "—"}
      >
        {summary && summary.total > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {Object.entries(summary.by_source)
              .filter(([, n]) => (n ?? 0) > 0)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .map(([source, n]) => (
                <Chip
                  key={source}
                  size="small"
                  label={`${n} ${SOURCE_LABEL[source as EnrollmentSource | "unknown"] ?? source}`}
                  sx={{ fontWeight: 700, fontSize: "0.72rem", bgcolor: "#f5f3ff", color: "#6d28d9", border: "1px solid #ede9fe" }}
                />
              ))}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Nobody is enrolled yet.
          </Typography>
        )}
      </SettingsCard>

      <SettingsCard
        icon="mdi:account-multiple-plus-outline"
        title="Who can join"
        subtitle="Three ways in, and they work independently"
      >
        <SettingRow
          label={`Enroll everyone at ${tenantName}`}
          help="Adds every active student now, and anyone who joins later. Turning this off later does not remove them."
          checked={course.auto_enroll}
          pending={pendingSetting === "auto_enroll"}
          onChange={onToggleAutoEnroll}
          disabledReason={
            course.is_paid
              ? "A paid course can't also be given away — make it free first."
              : undefined
          }
        />
        <SettingRow
          label="List in the student catalog"
          help="Students browse the catalog and join on their own."
          checked={listedInCatalog}
          pending={pendingSetting === "self_enroll_enabled"}
          onChange={onToggleSelfEnroll}
          disabledReason={
            course.is_paid && !course.self_enroll_enabled
              ? "Always listed while it has a price."
              : course.auto_enroll
                ? "No practical effect right now — everyone is already enrolled."
                : undefined
          }
        />

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>Cohorts:</Typography>
          {cohorts.length ? (
            cohorts.map((c) => (
              <Chip key={c.id} size="small" label={c.name} sx={{ fontWeight: 700, fontSize: "0.72rem" }} />
            ))
          ) : (
            <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>none</Typography>
          )}
          <Box
            component="button"
            onClick={onAssignCohorts}
            sx={{
              border: 0, p: 0, background: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: "0.78rem", fontWeight: 800, color: "#7c3aed",
            }}
          >
            Assign to a cohort
          </Box>
        </Stack>

        <ResolvedState lines={accessLines} />
      </SettingsCard>

      <SettingsCard
        icon="mdi:shield-lock-outline"
        title="Coding editor"
        subtitle={course.allow_clipboard ? "Students can copy and paste" : "Copy and paste is blocked"}
      >
        {/* Was a pill on every coding set in the module tree. It is one decision about a cohort,
            not a per-topic one, so it belongs here and applies to the whole course. */}
        <SettingRow
          label="Allow copy and paste in the code editor"
          help="Off is stricter: pasting the answer is the easiest way to skip a coding exercise. Applies to every coding set in this course."
          checked={course.allow_clipboard}
          pending={pendingSetting === "allow_clipboard"}
          onChange={onToggleClipboard}
        />
      </SettingsCard>

      <SettingsCard icon="mdi:calendar-clock-outline" title="Pacing" subtitle="How fast students can move">
        <SettingRow
          label="Release weeks on a schedule"
          help="Off means the whole course is open immediately."
          checked={course.content_locked}
          pending={pendingSetting === "content_locked"}
          onChange={onToggleContentLock}
        />
        <ResolvedState lines={pacingLines} />
        {scheduleSlot && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eef2f7" }}>{scheduleSlot}</Box>
        )}
      </SettingsCard>

      {canSetPricing && (
        <SettingsCard
          icon="mdi:cash-multiple"
          title="Enrollment cost"
          subtitle={course.is_paid ? "Students pay to enroll" : "Free to enroll"}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ flex: 1, fontSize: "0.875rem", color: "#0f172a", fontWeight: 700 }}>
              {course.is_paid ? `${course.currency} ${course.price}` : "Free"}
            </Typography>
            <Box
              component="button"
              onClick={onOpenPricing}
              sx={{
                px: 2, py: 0.85, borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                fontWeight: 800, fontSize: "0.78rem", color: "#7c3aed",
                bgcolor: "#f5f3ff", border: "1px solid #ede9fe",
              }}
            >
              {course.is_paid ? "Change price" : "Charge for this course"}
            </Box>
          </Stack>
          {course.auto_enroll && (
            <Typography sx={{ fontSize: "0.72rem", color: "#b45309", mt: 1, fontWeight: 600 }}>
              Auto-enroll is on, so this course can&apos;t carry a price until you turn that off.
            </Typography>
          )}
        </SettingsCard>
      )}

      {coverSlot && (
        <SettingsCard icon="mdi:image-outline" title="Cover art" subtitle="How this course looks in listings">
          {coverSlot}
        </SettingsCard>
      )}
    </Stack>
  );
}
