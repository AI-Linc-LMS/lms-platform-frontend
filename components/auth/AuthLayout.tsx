"use client";

import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import {
  buildLoginHeroBrandingUi,
  getLoginHeroSloganOverride,
  type LoginHeroBrandingUi,
} from "@/lib/theme/authHeroBranding";
import { AuthLayoutShell } from "./layout/AuthLayoutShell";
import {
  AuthLeftPanel,
  type AuthLeftPanelVariant,
} from "./layout/AuthLeftPanel";
import { AuthRightPanelDefault } from "./layout/AuthRightPanelDefault";
import { resolveClientLogoUrl } from "@/lib/utils/resolveClientLogoUrl";

interface AuthLayoutProps {
  children: ReactNode;
  slogan?: string;
}

export function AuthLayout({ children, slogan }: AuthLayoutProps) {
  const { t } = useTranslation("common");
  const { clientInfo, loading: clientInfoLoading } = useClientInfo();

  const themeFlat = useMemo(
    () => normalizeThemeSettings(clientInfo?.theme_settings),
    [clientInfo?.theme_settings]
  );

  const heroBranding: LoginHeroBrandingUi = useMemo(
    () => buildLoginHeroBrandingUi(themeFlat),
    [themeFlat]
  );

  const sloganOverride = getLoginHeroSloganOverride(themeFlat);
  const sloganText = sloganOverride || slogan?.trim() || t("auth.slogan");
  const useCustomSlogan = Boolean(sloganOverride);

  const loginImgUrl = clientInfo?.login_img_url?.trim() ?? "";
  const leftVariant: AuthLeftPanelVariant = loginImgUrl ? "glass" : "plain";

  const brandName = clientInfo?.name?.trim() || "";
  const logoUrl = resolveClientLogoUrl(clientInfo);

  const rightPanelProps = {
    clientInfoLoading,
    sloganText,
    logoUrl,
    brandName,
    loginImgUrl: loginImgUrl || null,
    heroBranding,
    useCustomSlogan,
  };

  return (
    <AuthLayoutShell
      left={<AuthLeftPanel variant={leftVariant}>{children}</AuthLeftPanel>}
      right={<AuthRightPanelDefault {...rightPanelProps} />}
    />
  );
}
