import { useEffect, useState } from "react";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Type definitions for Google Identity Services
interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential: string }) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (
      element: HTMLElement,
      config: {
        theme: string;
        size: string;
        width: number;
        text: string;
        logo_alignment: string;
      }
    ) => void;
  };
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const GoogleLoginButton = () => {
  const { handleGoogleLogin, isLoading, error } = useGoogleAuth();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleScript = () => {
      // Check if script is already loaded
      if (
        document.querySelector(
          "script[src='https://accounts.google.com/gsi/client']"
        )
      ) {
        setIsScriptLoaded(true);
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        //console.log('[Google Auth] Script loaded successfully');
        setIsScriptLoaded(true);
        // Add a small delay for mobile browsers
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
      };
      script.onerror = () => {
        //console.error("Failed to load Google authentication script:", e);
        setInitError(
          "Failed to load Google authentication script. Please try again later."
        );
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();

    return () => {
      const existingScript = document.querySelector(
        "script[src='https://accounts.google.com/gsi/client']"
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    try {
      if (!window.google?.accounts?.id) {
        //console.error('[Google Auth] Google accounts object not available');
        setInitError(
          "Google authentication not available. Please refresh the page."
        );
        return;
      }

      //console.log('[Google Auth] Initializing Google Sign-In');

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Add a small delay before rendering button for mobile
      setTimeout(() => {
        const buttonElement = document.getElementById("google-signin-btn");
        if (buttonElement) {
          window.google!.accounts.id.renderButton(buttonElement, {
            theme: "outline",
            size: "large",
            width: 300,
            text: "signin_with",
            logo_alignment: "center",
          });
          //console.log('[Google Auth] Button rendered successfully');
        } else {
          //console.error('[Google Auth] Button element not found');
          setInitError(
            "Unable to render Google sign-in button. Please refresh the page."
          );
        }
      }, 50);
    } catch {
      //console.error('[Google Auth] Error initializing Google Sign-In:', error);
      setInitError(
        "Error initializing Google authentication. Please refresh the page."
      );
    }
  };

  const handleGoogleResponse = (response: { credential: string }) => {
    //console.log('[Google Auth] Received response from Google');
    if (response.credential) {
      handleGoogleLogin(response.credential);
    } else {
      //console.error('[Google Auth] No credential received from Google');
      setInitError(
        "No authentication data received from Google. Please try again."
      );
    }
  };

  // Show loading state while script is loading
  if (!isScriptLoaded && !initError) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center">
          <div className="w-full max-w-xs h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="flex justify-center">
        <div
          id="google-signin-btn"
          className={`w-full max-w-xs transform transition-transform ${
            isLoading ? "cursor-not-allowed" : "hover:scale-97"
          }`}
        ></div>
      </div>
      {(error || initError) && (
        <p className="text-red-500 mt-2 text-sm">{error || initError}</p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
