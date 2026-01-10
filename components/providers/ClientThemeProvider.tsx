"use client";

import { useEffect } from "react";

export function ClientThemeProvider({ client }: { client: any }) {
  useEffect(() => {
    if (!client?.theme_settings) return;
    const themeSettings = client.theme_settings;

    document.body.style.setProperty("--primary-50", themeSettings.primary50);
    document.body.style.setProperty("--primary-100", themeSettings.primary100);
    document.body.style.setProperty("--primary-200", themeSettings.primary200);
    document.body.style.setProperty("--primary-300", themeSettings.primary300);
    document.body.style.setProperty("--primary-400", themeSettings.primary400);
    document.body.style.setProperty("--primary-500", themeSettings.primary500);
    document.body.style.setProperty("--primary-600", themeSettings.primary600);
    document.body.style.setProperty("--primary-700", themeSettings.primary700);
    document.body.style.setProperty("--primary-800", themeSettings.primary800);
    document.body.style.setProperty("--primary-900", themeSettings.primary900);

    document.body.style.setProperty(
      "--secondary-50",
      themeSettings.secondary50
    );
    document.body.style.setProperty(
      "--secondary-100",
      themeSettings.secondary100
    );
    document.body.style.setProperty(
      "--nav-background",
      themeSettings.navBackground
    );
    document.body.style.setProperty(
      "--font-dark-nav",
      themeSettings.fontDarkNav
    );
    document.body.style.setProperty(
      "--font-light-nav",
      themeSettings.fontLightNav
    );
    document.body.style.setProperty(
      "--secondary-200",
      themeSettings.secondary200
    );
    document.body.style.setProperty(
      "--secondary-300",
      themeSettings.secondary300
    );
    document.body.style.setProperty(
      "--secondary-400",
      themeSettings.secondary400
    );
    document.body.style.setProperty(
      "--secondary-500",
      themeSettings.secondary500
    );
    document.body.style.setProperty(
      "--nav-selected",
      themeSettings.navSelected
    );
    document.body.style.setProperty(
      "--secondary-600",
      themeSettings.secondary600
    );
    document.body.style.setProperty(
      "--secondary-700",
      themeSettings.secondary700
    );

    document.body.style.setProperty(
      "--accent-yellow",
      themeSettings.accentYellow
    );
    document.body.style.setProperty("--accent-blue", themeSettings.accentBlue);
    document.body.style.setProperty(
      "--accent-green",
      themeSettings.accentGreen
    );
    document.body.style.setProperty("--accent-red", themeSettings.accentRed);
    document.body.style.setProperty(
      "--accent-orange",
      themeSettings.accentOrange
    );
    document.body.style.setProperty("--accent-teal", themeSettings.accentTeal);
    document.body.style.setProperty(
      "--accent-purple",
      themeSettings.accentPurple
    );
    document.body.style.setProperty("--accent-pink", themeSettings.accentPink);

    document.body.style.setProperty("--neutral-50", themeSettings.neutral50);
    document.body.style.setProperty("--neutral-100", themeSettings.neutral100);
    document.body.style.setProperty("--neutral-200", themeSettings.neutral200);
    document.body.style.setProperty("--neutral-300", themeSettings.neutral300);
    document.body.style.setProperty("--neutral-400", themeSettings.neutral400);
    document.body.style.setProperty("--neutral-500", themeSettings.neutral500);
    document.body.style.setProperty("--neutral-600", themeSettings.neutral600);
    document.body.style.setProperty("--neutral-700", themeSettings.neutral700);
    document.body.style.setProperty("--neutral-800", themeSettings.neutral800);

    document.body.style.setProperty("--success-50", themeSettings.success50);
    document.body.style.setProperty("--success-100", themeSettings.success100);
    document.body.style.setProperty("--success-500", themeSettings.success500);

    document.body.style.setProperty("--warning-100", themeSettings.warning100);
    document.body.style.setProperty("--warning-500", themeSettings.warning500);

    document.body.style.setProperty("--error-100", themeSettings.error100);
    document.body.style.setProperty("--error-500", themeSettings.error500);
    document.body.style.setProperty("--error-600", themeSettings.error600);

    document.body.style.setProperty("--font-light", themeSettings.fontLight);
    document.body.style.setProperty("--course-cta", themeSettings.courseCta);

    document.body.style.setProperty("--main-background", "#ffffff");
    document.body.style.setProperty(
      "--default-primary",
      themeSettings.defaultPrimary
    );
    document.body.style.setProperty("--font-dark", themeSettings.fontDark);
    document.body.style.setProperty("--background", "#ffffff");
    document.body.style.setProperty("--foreground", "#171717");
  }, [client]);

  return null;
}
