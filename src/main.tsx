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
import { initializePWA } from "./pwa";
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

initializePWA({
  clientId: import.meta.env.VITE_CLIENT_ID,
  baseURL: import.meta.env.VITE_API_URL,
  environment: import.meta.env.MODE,
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
