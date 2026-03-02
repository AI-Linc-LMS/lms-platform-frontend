export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "1",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  /** Optional: URL for server-side speech-to-text (e.g. Canary Qwen 2.5B). When set, STT uses this API instead of browser Web Speech API. */
  sttApiUrl: process.env.NEXT_PUBLIC_STT_API_URL || "",
} as const;
