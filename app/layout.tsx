import type { Metadata } from "next";
import "./globals.css";
import { ThemeModeProvider } from "@/lib/contexts/ThemeContext";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ToastProvider } from "@/components/common/Toast";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { EmotionCacheProvider } from "@/lib/emotion-cache";
import { getClientInfo } from "@/lib/utils/clientInfo";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ClientInfoProvider } from "@/lib/contexts/ClientInfoContext";
import { ClientThemeSync } from "@/components/providers/ClientThemeSync";
import { ClientFaviconSync } from "@/components/providers/ClientFaviconSync";
import { ClientFontLink } from "@/components/providers/ClientFontLink";
import { AdminModeProvider } from "@/lib/contexts/AdminModeContext";
import { AdminModeRoleSync } from "@/components/providers/AdminModeRoleSync";
import { CameraRouteGuard } from "@/components/providers/CameraRouteGuard";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { DirectionSync } from "@/components/providers/DirectionSync";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import { ProfileActivationBlocker } from "@/components/auth/ProfileActivationBlocker";
import { TenantSetupBlocker } from "@/components/auth/TenantSetupBlocker";
import { XPGainProvider } from "@/components/community/XPGainProvider";
import { XpCelebrationOverlay } from "@/components/common/XpCelebrationOverlay";
import { TourProvider } from "@/components/community/TourProvider";
import { config } from "@/lib/config";
import { themeToCssBlock } from "@/lib/theme/themeToCssBlock";

/* ✅ Metadata (SEO) */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") ?? undefined;
  const client = await getClientInfo(host);

  const favicon = client?.app_icon_url
    ? `${client.app_icon_url}?v=${client.id}`
    : `/favicon.ico?v=${Date.now()}`;

  return {
    ...(config.appUrl ? { metadataBase: new URL(`${config.appUrl}/`) } : {}),
    title: {
      default: client?.name ?? "LMS Platform",
      template: "%s",
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

/* ✅ Force favicon for browser */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get("host") ?? undefined;
  const client = await getClientInfo(host);
  const favicon = client?.app_icon_url
    ? `${client.app_icon_url}?v=${client.id}-${Date.now()}`
    : `/favicon.ico?v=${Date.now()}`;

  // Inline the tenant palette as `:root { --... }` so the very first browser
  // paint already uses the saved theme. Without this the page would briefly
  // show the `globals.css :root` defaults (blue slate) and then jump to the
  // tenant theme once `ClientThemeSync` ran in JS - the visible 2-3 flash
  // sequence on refresh.
  const tenantCss = themeToCssBlock(client?.theme_settings);

  const defaultLang = "en";

  return (
    <html lang={defaultLang} suppressHydrationWarning>
      <head>
        {tenantCss ? (
          // Server-rendered, sanitized in `themeToCssBlock` - only allow-listed
          // CSS-safe characters can reach the inlined block. `suppressHydrationWarning`
          // is required: Next dev/Turbopack injects a `body[unresolved] { opacity: 0 }`
          // FOUC-prevention <style> at the top of <head>, which shifts our style's
          // DOM position between SSR and CSR. Browser extensions (Grammarly,
          // Dark Reader, etc.) do the same. The diff is cosmetic - our SSR style
          // is still in the document and still applies on first paint.
          <style
            id="aw-tenant-theme"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: tenantCss }}
          />
        ) : null}
        <link rel="icon" href={favicon} />
        <link rel="shortcut icon" href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap"
        />
      </head>

      <body className={`antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <ErrorBoundary>
            <I18nProvider clientId={client?.id}>
              <EmotionCacheProvider>
                <ClientInfoProvider initialClient={client}>
                  <ClientThemeSync initialClient={client} />
                  <ClientFaviconSync initialClient={client} />
                  <ClientFontLink initialClient={client} />
                  <ThemeProvider initialClient={client}>
                    <DirectionSync />
                    <ReduxProvider>
                      <ThemeModeProvider>
                        <AdminModeProvider>
                          <AdminModeRoleSync />
                          <CameraRouteGuard>
                            <TelemetryProvider>
                              <ToastProvider>
                                <XPGainProvider>
                                  <TourProvider>
                                    <ProfileActivationBlocker />
                                    <TenantSetupBlocker />
                                    {children}
                                    <XpCelebrationOverlay />
                                  </TourProvider>
                                </XPGainProvider>
                              </ToastProvider>
                            </TelemetryProvider>
                          </CameraRouteGuard>
                        </AdminModeProvider>
                      </ThemeModeProvider>
                    </ReduxProvider>
                  </ThemeProvider>
                </ClientInfoProvider>
              </EmotionCacheProvider>
            </I18nProvider>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
