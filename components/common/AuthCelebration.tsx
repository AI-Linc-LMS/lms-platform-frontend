"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SuccessTick } from "@/components/common/SuccessTick";

/**
 * The sign-in / sign-out tick, and the rule for when it comes down.
 *
 * It stays up across the navigation that follows it. That is the point: the caller awaits the
 * animation, then navigates, and the destination mounts underneath the tick instead of flashing
 * an empty page or a row of shimmers at someone who has just been told they are signed in.
 *
 * Two ways down, and it needs both:
 *   - the route changed, which means the destination is mounted — the normal case;
 *   - a hard cap, for when it did not. A tick that never lifts is a locked screen, so a failed
 *     navigation must not be able to trap the user behind a confirmation.
 */
export function AuthCelebration({
  kind,
  onDone,
}: {
  kind: "signin" | "signout";
  onDone: () => void;
}) {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const startedAt = useRef(pathname);

  useEffect(() => {
    // The route moved: the destination has mounted. A short beat lets it paint before the
    // tick lifts, otherwise the handover is visible as a flicker.
    if (pathname !== startedAt.current) {
      const id = setTimeout(onDone, 180);
      return () => clearTimeout(id);
    }
    // Never navigated. Come down anyway rather than hold the screen hostage.
    const cap = setTimeout(onDone, 2600);
    return () => clearTimeout(cap);
  }, [pathname, onDone]);

  return kind === "signin" ? (
    <SuccessTick
      label={t("auth.loginSuccess")}
      sublabel={t("auth.takingYouIn", "Taking you in…")}
    />
  ) : (
    <SuccessTick
      label={t("auth.logoutSuccess", "Signed out")}
      sublabel={t("auth.seeYouSoon", "See you soon")}
    />
  );
}
