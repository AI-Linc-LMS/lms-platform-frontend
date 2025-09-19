import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import App from "./App.tsx";
import withAppInitializer from "./hocs/withAppInitializer.tsx";

const AppWithInitializer = withAppInitializer(App);
import { store } from "./redux/store";
import { UserActivityProvider } from "./contexts/UserActivityContext";
import { initializePWA } from "./pwa";

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
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <UserActivityProvider>
          <AppWithInitializer />
          <ReactQueryDevtools initialIsOpen={false} />
        </UserActivityProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
