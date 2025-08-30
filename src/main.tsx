import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import App from "./App.tsx";
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
const envConfig = {
  clientId: import.meta.env.VITE_CLIENT_ID,
  baseURL: import.meta.env.VITE_API_URL,
  environment: import.meta.env.MODE,
};

console.log("Main.tsx: Initializing PWA with config:", envConfig);

// Add immediate debugging
setTimeout(() => {
  console.log("=== PWA DEBUG INFO ===");
  console.log("Service Worker supported:", "serviceWorker" in navigator);
  console.log(
    "Service Worker controller:",
    navigator.serviceWorker?.controller
  );
  console.log(
    "Session storage PWA config:",
    window.sessionStorage.getItem("pwa-config")
  );

  // Test API call to see what happens
  console.log("Making test API call...");
  fetch(`https://be-app.ailinc.com/accounts/clients/${envConfig.clientId}/test`)
    .then(() => console.log("Test API call completed"))
    .catch((e) => console.log("Test API call failed:", e));
}, 2000);

initializePWA(envConfig);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <UserActivityProvider>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </UserActivityProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
