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
import { ClientThemeProviderGate } from "@/components/providers/ClientThemeProviderGate";
import { ClientInfoProvider } from "@/lib/contexts/ClientInfoContext";
import { AdminModeProvider } from "@/lib/contexts/AdminModeContext";
import { AdminModeRoleSync } from "@/components/providers/AdminModeRoleSync";
import { CameraRouteGuard } from "@/components/providers/CameraRouteGuard";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { DirectionSync } from "@/components/providers/DirectionSync";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import { ProfileActivationBlocker } from "@/components/auth/ProfileActivationBlocker";

/* ✅ Metadata (SEO) */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") ?? undefined;
  const client = await getClientInfo(host);

  const favicon = client?.app_icon_url
    ? `${client.app_icon_url}?v=${client.id}`
    : `/favicon.ico?v=${Date.now()}`;

  return {
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

  const defaultLang = "en";

  return (
    <html lang={defaultLang} suppressHydrationWarning>
      <head>
        <link rel="icon" href={favicon} />
        <link rel="shortcut icon" href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
        {/* Preconnect to Fontshare for faster font loading */}
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
        <ClientThemeProviderGate client={client} />
        <AuthProvider>
          <ErrorBoundary>
            <I18nProvider clientId={client?.id}>
              <EmotionCacheProvider>
                <ThemeProvider>
                  <DirectionSync />
                  <ReduxProvider>
                    <ThemeModeProvider>
                      <ClientInfoProvider>
                        <AdminModeProvider>
                          <AdminModeRoleSync />
                          <CameraRouteGuard>
                            <TelemetryProvider>
                              <ToastProvider>
                                <ProfileActivationBlocker />
                                {children}
                              </ToastProvider>
                            </TelemetryProvider>
                          </CameraRouteGuard>
                        </AdminModeProvider>
                      </ClientInfoProvider>
                    </ThemeModeProvider>
                  </ReduxProvider>
                </ThemeProvider>
              </EmotionCacheProvider>
            </I18nProvider>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
