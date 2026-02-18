/** Common status display for all clients: live, ended, binded, expired, active. */
export function getAttendanceStatusDisplay(activity: {
  meeting_status?: string | null;
  is_valid: boolean;
}): { label: string; chipSx: { bgcolor: string; color: string } } {
  const status = activity.meeting_status;
  if (status === "ended") {
    return { label: "Ended", chipSx: { bgcolor: "#9ca3af", color: "#1f2937" } };
  }
  if (status === "live") {
    return { label: "Live", chipSx: { bgcolor: "#d1fae5", color: "#065f46" } };
  }
  if (status === "binded") {
    return { label: "Binded", chipSx: { bgcolor: "#dbeafe", color: "#1e40af" } };
  }
  if (status === "expired" || !activity.is_valid) {
    return { label: "Expired", chipSx: { bgcolor: "#fed7aa", color: "#9a3412" } };
  }
  return { label: "Active", chipSx: { bgcolor: "#d1fae5", color: "#065f46" } };
}
