export type AssessmentDeviceClass = "desktop" | "mobile" | "tablet";

/** Iconify icon names for each device class (learner/admin UI). */
export const ASSESSMENT_DEVICE_CLASS_ICONS: Record<
  AssessmentDeviceClass,
  string
> = {
  desktop: "mdi:monitor",
  mobile: "mdi:cellphone",
  tablet: "mdi:tablet",
};

/** True if the assessment limits at least one device type. */
export function assessmentHasDeviceRestrictions(assessment: {
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
}): boolean {
  return (
    assessment.allow_desktop === false ||
    assessment.allow_mobile === false ||
    assessment.allow_tablet === false
  );
}

/**
 * Coarse device class for assessment access rules. Aligns with backend
 * X-Client-Device-Type and resolve_device_class heuristics.
 */
export function getClientDeviceClass(): AssessmentDeviceClass {
  if (typeof window === "undefined") {
    return "desktop";
  }
  const ua = navigator.userAgent || "";
  const maxTouch = navigator.maxTouchPoints || 0;

  // iPadOS 13+ reports as MacIntel with touch
  if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && maxTouch > 1)) {
    return "tablet";
  }
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) {
    return "tablet";
  }
  if (/Tablet/i.test(ua)) {
    return "tablet";
  }

  if (
    /iPhone|iPod/i.test(ua) ||
    /Android.*Mobile/i.test(ua) ||
    /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  ) {
    return "mobile";
  }

  const w = window.innerWidth;
  if (maxTouch > 1 && w >= 768 && w <= 1280) {
    return "tablet";
  }

  return "desktop";
}

export function isCurrentDeviceAllowedForAssessment(assessment: {
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
}): boolean {
  const d = getClientDeviceClass();
  const ad = assessment.allow_desktop !== false;
  const am = assessment.allow_mobile !== false;
  const at = assessment.allow_tablet !== false;
  if (d === "desktop") return ad;
  if (d === "mobile") return am;
  return at;
}

export function allowedDeviceLabels(assessment: {
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
}): string[] {
  const out: string[] = [];
  if (assessment.allow_desktop !== false) out.push("desktop");
  if (assessment.allow_mobile !== false) out.push("mobile");
  if (assessment.allow_tablet !== false) out.push("tablet");
  return out;
}
