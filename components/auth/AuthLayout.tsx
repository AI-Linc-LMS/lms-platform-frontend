"use client";

import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { resolveAuthLayoutVariant } from "@/lib/auth/auth-layout-variants";
import { AuthLayoutShell } from "./layout/AuthLayoutShell";
import { AuthLeftPanel } from "./layout/AuthLeftPanel";
import { AuthRightPanelDefault } from "./layout/AuthRightPanelDefault";
import { AuthRightPanelClient28 } from "./layout/AuthRightPanelClient28";

interface AuthLayoutProps {
  children: ReactNode;
  slogan?: string;
}

export function AuthLayout({ children, slogan }: AuthLayoutProps) {
  const { t } = useTranslation("common");
  const { clientInfo, loading: clientInfoLoading } = useClientInfo();
  const sloganText = slogan ?? t("auth.slogan");
  const variant = resolveAuthLayoutVariant();

  const brandName = clientInfo?.name?.trim() || "";
  const logoUrl =
    clientInfo?.login_logo_url?.trim() ||
    clientInfo?.app_logo_url?.trim() ||
    "";

  const rightPanelProps = {
    clientInfoLoading,
    sloganText,
    logoUrl,
    brandName,
  };

  return (
    <AuthLayoutShell
      left={<AuthLeftPanel variant={variant}>{children}</AuthLeftPanel>}
      right={
        variant === "client28" ? (
          <AuthRightPanelClient28 {...rightPanelProps} />
        ) : (
          <AuthRightPanelDefault {...rightPanelProps} />
        )
      }
    />
  );
}
