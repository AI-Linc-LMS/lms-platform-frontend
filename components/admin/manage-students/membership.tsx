"use client";

import { Chip, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  MembershipAdmin,
  Student,
  StudentDetail,
} from "@/lib/services/admin/admin-student.service";
import { formatDate } from "./detail/shared";

/* ==========================================================================
 * "Remove from organisation": the pieces the directory, the phone cards and the detail page
 * share, so a removed student is named and marked the same way on every surface.
 *
 * Removal is per tenant and reversible. The server stamps removed_at / removed_by on the tenant
 * profile and keeps every record; "Add back" clears the stamp on the same profile. It is NOT the
 * "Inactive" state: that is User.is_active, the shared login's platform-wide switch.
 * ======================================================================== */

/** The directory's two views: current members, and the people removed from the organisation. */
export type MembershipView = "members" | "removed";

/** A translate function as `useTranslation` returns it, narrowed to what these helpers call. */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** A row without the field came from an older server, and an older server knows no removals. */
export function isRemoved(
  student: Pick<Student, "membership"> | Pick<StudentDetail, "membership">
): boolean {
  return student.membership === "removed";
}

/** The admin named on the removal, or the translated fallback once their profile is purged. */
export function removedByName(
  t: Translate,
  removedBy: MembershipAdmin | null | undefined
): string {
  const name = removedBy?.name?.trim();
  return name || t("adminManageStudents.membership.unknownAdmin");
}

/**
 * What the CSV export's Status column says. Removed outranks Active / Inactive for the same
 * reason the chip does: it is the state that decides whether they can use the organisation.
 */
export function studentStatusLabel(
  t: Translate,
  student: Pick<Student, "membership" | "is_active">
): string {
  if (isRemoved(student)) return t("adminManageStudents.membership.removedChip");
  return student.is_active
    ? t("adminManageStudents.active")
    : t("adminManageStudents.inactive");
}

/** "Removed on {date} by {name}", the one sentence the chip tooltip and the banner build on. */
export function removedOnLabel(
  t: Translate,
  student: Pick<Student, "removed_at" | "removed_by">
): string {
  return t("adminManageStudents.membership.removedOn", {
    date: formatDate(student.removed_at),
    name: removedByName(t, student.removed_by),
  });
}

/**
 * The amber "Removed" chip, with the removal stamp as its tooltip.
 *
 * Amber on purpose: the red chip that sits in the same spot means Inactive, a platform-wide
 * login switch, and the two states must not read as one. The Inactive chip is suppressed for a
 * removed row: "they cannot sign in here" is the only state that matters until they are back.
 */
export function RemovedChip({
  student,
  variant = "table",
}: {
  student: Pick<Student, "removed_at" | "removed_by">;
  /** The desktop table runs 18px chips; a phone card runs 22px ones. */
  variant?: "table" | "card";
}) {
  const { t } = useTranslation("common");
  const compact = variant === "table";
  return (
    <Tooltip title={removedOnLabel(t, student)}>
      <Chip
        label={t("adminManageStudents.membership.removedChip")}
        size="small"
        data-testid="removed-chip"
        sx={{
          flexShrink: 0,
          backgroundColor: "#fef3c7",
          color: "#92400e",
          fontWeight: 600,
          fontSize: compact ? "0.65rem" : "0.75rem",
          height: compact ? 18 : 22,
          cursor: "help",
          "& .MuiChip-label": compact ? { px: 0.5 } : {},
        }}
      />
    </Tooltip>
  );
}
