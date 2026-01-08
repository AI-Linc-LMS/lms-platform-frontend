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
import { ClientThemeProvider } from "@/components/providers/ClientThemeProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ClientInfoProvider } from "@/lib/contexts/ClientInfoContext";
import { AdminModeProvider } from "@/lib/contexts/AdminModeContext";
import { CameraRouteGuard } from "@/components/providers/CameraRouteGuard";

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

  return (
    <html lang="en" suppressHydrationWarning>
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
        <ClientThemeProvider client={client} />

        <ErrorBoundary>
          <EmotionCacheProvider>
            <ThemeProvider>
              <ReduxProvider>
                <ThemeModeProvider>
                  <AuthProvider>
                    <ClientInfoProvider>
                      <AdminModeProvider>
                        <CameraRouteGuard>
                          <ToastProvider>{children}</ToastProvider>
                        </CameraRouteGuard>
                      </AdminModeProvider>
                    </ClientInfoProvider>
                  </AuthProvider>
                </ThemeModeProvider>
              </ReduxProvider>
            </ThemeProvider>
          </EmotionCacheProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
