import { Profiler, StrictMode } from "react";
import type { ProfilerOnRenderCallback } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import "./index.css";
import "./i18n"; // Initialize i18n
import App from "./App.tsx";
import withAppInitializer from "./hocs/withAppInitializer.tsx";

const AppWithInitializer = withAppInitializer(App);
import { store } from "./redux/store";
import { UserActivityProvider } from "./contexts/UserActivityContext";
import theme from "./styles/theme.ts";
import {
  recordProfilerSample,
  startPerfMonitoring,
} from "./monitoring/perfLogger";
import QueryDevtoolsGate from "./components/QueryDevtoolsGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const isPWAEnabled = import.meta.env.VITE_ENABLE_PWA === "true";

// Unregister all service workers and clear caches to prevent API caching issues
// This runs asynchronously and non-blocking to avoid delays
const unregisterServiceWorkers = () => {
  // Use setTimeout to make it non-blocking
  setTimeout(async () => {
    if ("serviceWorker" in navigator) {
      try {
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );

        // Clear all caches
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
      } catch (error) {
        // Silently fail if service worker operations fail
      }
    }
  }, 0);
};

// Unregister service workers immediately on app start (non-blocking)
unregisterServiceWorkers();

if (isPWAEnabled) {
  void import("./pwa").then(({ initializePWA }) => {
    initializePWA({
      clientId: import.meta.env.VITE_CLIENT_ID,
      baseURL: import.meta.env.VITE_API_URL,
      environment: import.meta.env.MODE,
    });
  });
}

// Skip service worker registration when PWA flag is enabled
if (!isPWAEnabled) {
  const registerModulePath = "./pwa/register-sw-stub";
  void import(/* @vite-ignore */ registerModulePath).then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

startPerfMonitoring();

const handleProfilerRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration
) => {
  recordProfilerSample(id, phase, actualDuration, baseDuration);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <UserActivityProvider>
            <Profiler id="AppShell" onRender={handleProfilerRender}>
              <AppWithInitializer />
            </Profiler>
            <QueryDevtoolsGate />
          </UserActivityProvider>
        </QueryClientProvider>
      </Provider>
    </ThemeProvider>
  </StrictMode>
);
