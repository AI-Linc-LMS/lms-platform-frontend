/** Shared score / grade palette for scorecard UI and charts */

export function proficiencyBandColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#0a66c2";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function gradeLevelColor(level: string): string {
  switch (level) {
    case "Interview-Ready":
      return "#10b981";
    case "Advanced":
      return "#0a66c2";
    case "Intermediate":
      return "#f59e0b";
    default:
      return "#9ca3af";
  }
}

export function gradeLevelGradient(level: string): string {
  switch (level) {
    case "Interview-Ready":
      return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    case "Advanced":
      return "linear-gradient(135deg, #0a66c2 0%, #004182 100%)";
    case "Intermediate":
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    default:
      return "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
  }
}

export function statusBadgeColor(badge: string): string {
  if (badge === "Green") return "#10b981";
  if (badge === "Amber") return "#f59e0b";
  return "#ef4444";
}
