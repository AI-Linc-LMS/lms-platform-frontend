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

if (isPWAEnabled) {
  void import("./pwa").then(({ initializePWA }) => {
    initializePWA({
      clientId: import.meta.env.VITE_CLIENT_ID,
      baseURL: import.meta.env.VITE_API_URL,
      environment: import.meta.env.MODE,
    });
  });
}

const registerModulePath = isPWAEnabled
  ? "virtual:pwa-register"
  : "./pwa/register-sw-stub";

void import(/* @vite-ignore */ registerModulePath).then(({ registerSW }) => {
  if (isPWAEnabled) {
    registerSW({ immediate: true });
  }
});

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
