"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Box, Typography } from "@mui/material";
import { accountsService } from "@/lib/services/accounts.service";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { SignInLoader } from "@/components/common/SignInLoader";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
            error_callback?: (error: any) => void;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

interface GoogleSignInProps {
  disabled?: boolean;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  disabled = false,
}) => {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isInitialized = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Ensure component only renders client-side content after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    try {
      // Send the credential (ID token) to the backend
      // This is called when using One Tap or credential flow
      await googleLogin(response.credential);
      showToast("Login successful!", "success");
      setIsRedirecting(true);
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      // Small delay to show success message, then redirect
      setTimeout(() => {
        window.location.href = redirectUrl; // Full page reload
      }, 500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        "Google sign-in failed. Please try again.";
      showToast(errorMessage, "error");
      setIsRedirecting(false);
    }
  }, [googleLogin, showToast, searchParams]);

  useEffect(() => {
    if (!isMounted) return;

    if (!config.googleClientId) {
      return;
    }

    if (isInitialized.current) {
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts && googleButtonRef.current) {
        // Initialize Google Sign-In with credential (ID token) callback
        // This will be called when user signs in via button or One Tap
        try {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleGoogleSignIn,
            // Disable FedCM to avoid network errors
            use_fedcm_for_prompt: false,
            // Add error callback
            error_callback: (error: any) => {
              if (error.type === "popup_closed_by_user") {
                // User closed the popup, don't show error
                return;
              }
              showToast(
                "Google sign-in encountered an error. Please try again.",
                "error"
              );
            },
          });

          // Render Google button on the hidden div
          try {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signin_with",
              width: 300,
            });
          } catch (error) {
            // Failed to render Google button
          }

          isInitialized.current = true;
        } catch (error) {
          showToast(
            "Failed to initialize Google sign-in. Please refresh the page.",
            "error"
          );
        }
      }
    };
    
    script.onerror = () => {
      showToast(
        "Failed to load Google sign-in. Please check your connection.",
        "error"
      );
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      // Only remove if it still exists and is attached to the DOM
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript && existingScript.parentNode) {
        try {
          existingScript.remove();
        } catch (error) {
          // Element may have already been removed by React
        }
      }
    };
  }, [isMounted, handleGoogleSignIn, showToast]);

  // Conditional return AFTER all hooks
  if (isRedirecting) {
    return <SignInLoader />;
  }

  const handleClick = () => {
    if (!config.googleClientId) {
      showToast("Google sign-in is not configured", "error");
      return;
    }

    if (!window.google || !window.google.accounts || !isInitialized.current) {
      showToast(
        "Google sign-in is loading. Please try again in a moment.",
        "info"
      );
      return;
    }

    // Click the hidden Google button to trigger the credential flow
    // This will call handleGoogleSignIn with the credential (ID token)
    const googleButton = googleButtonRef.current?.querySelector(
      'div[role="button"]'
    ) as HTMLElement;
    if (googleButton) {
      googleButton.click();
    } else {
      // Fallback: use prompt for One Tap
      window.google.accounts.id.prompt();
    }
  };

  return (
    <>
      {/* Hidden Google button for credential flow - only render on client */}
      {isMounted && (
        <div
          ref={googleButtonRef}
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            pointerEvents: "none",
          }}
          suppressHydrationWarning
        />
      )}
      <Button
        fullWidth
        variant="outlined"
        onClick={handleClick}
        disabled={disabled || !config.googleClientId}
        size="small"
        sx={{
          mt: 0,
          mb: 0,
          py: 1.25,
          borderColor: "#e2e8f0",
          borderWidth: 1.5,
          color: "text.primary",
          textTransform: "none",
          backgroundColor: "white",
          fontWeight: 500,
          fontSize: "0.875rem",
          "&:hover": {
            borderColor: "#cbd5e1",
            backgroundColor: "#f8fafc",
            borderWidth: 1.5,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="#000" fillRule="evenodd">
              <path
                d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
                fill="#EA4335"
              />
              <path
                d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.78 2.16c1.7-1.57 2.69-3.88 2.69-6.51z"
                fill="#4285F4"
              />
              <path
                d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
                fill="#FBBC05"
              />
              <path
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.76.53-1.78.9-3.18.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z"
                fill="#34A853"
              />
            </g>
          </svg>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: "0.9375rem" }}
          >
            Sign in with Google
          </Typography>
        </Box>
      </Button>
    </>
  );
};
