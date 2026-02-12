/** Common status display for all clients: ended, binded, expired, active. */
export function getAttendanceStatusDisplay(activity: {
  meeting_status?: string | null;
  is_valid: boolean;
}): { label: string; chipSx: { bgcolor: string; color: string } } {
  const isEnded = activity.meeting_status === "ended";
  const isBinded = activity.meeting_status === "binded";
  const isExpired = !activity.is_valid;
  const label = isEnded
    ? "Ended"
    : isBinded
      ? "Binded"
      : isExpired
        ? "Expired"
        : "Active";
  const chipSx = isEnded
    ? { bgcolor: "#9ca3af", color: "#1f2937" }
    : isBinded
      ? { bgcolor: "#dbeafe", color: "#1e40af" }
      : isExpired
        ? { bgcolor: "#fed7aa", color: "#9a3412" }
        : { bgcolor: "#d1fae5", color: "#065f46" };
  return { label, chipSx };
}
