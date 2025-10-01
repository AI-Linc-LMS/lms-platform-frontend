import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@mui/material/styles";
import "./index.css";
import App from "./App.tsx";
import withAppInitializer from "./hocs/withAppInitializer.tsx";

const AppWithInitializer = withAppInitializer(App);
import { store } from "./redux/store";
import { UserActivityProvider } from "./contexts/UserActivityContext";
import { initializePWA, pwaManager } from "./pwa";
import theme from "./styles/theme.ts";

import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// initializePWA({
//   clientId: import.meta.env.VITE_CLIENT_ID,
//   baseURL: import.meta.env.VITE_API_URL,
//   environment: import.meta.env.MODE,
// });

// Initialize PWA with config
initializePWA({
  clientId: import.meta.env.VITE_CLIENT_ID,
  baseURL: import.meta.env.VITE_API_URL,
  environment: import.meta.env.MODE,
});

// Set custom messages
pwaManager.setMessages({
  update: {
    title: "🎉 New Features Available",
    message:
      "We've added exciting new features and performance improvements. Update now to try them out!",
  },
  install: {
    title: "📱 Get the App",
    message:
      "Install our app for faster access, offline support, and a native app experience.",
  },
  offline: {
    title: "⚠️ Connection Lost",
    message:
      "You're currently offline. Don't worry, your work is saved locally.",
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <UserActivityProvider>
            <AppWithInitializer />
            <ReactQueryDevtools initialIsOpen={false} />
          </UserActivityProvider>
        </QueryClientProvider>
      </Provider>
    </ThemeProvider>
  </StrictMode>
);
