import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

interface GoogleAuthResult {
  authentication?: { idToken?: string };
  idToken?: string;
}

const GoogleLoginButton = () => {
  const { handleGoogleLogin, isLoading, error } = useGoogleAuth();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const handleNativeSignIn = useCallback(async () => {
    try {
      setInitError(null);
      await GoogleAuth.initialize({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ["profile", "email"],
      });
      const result = (await GoogleAuth.signIn()) as unknown as GoogleAuthResult;
      const token = result.authentication?.idToken || result.idToken;
      if (!token) {
        setInitError("Google authentication failed. Please try again.");
        return;
      }
      await handleGoogleLogin(token);
    } catch {
      setInitError("Google authentication failed. Please try again.");
    }
  }, [handleGoogleLogin]);

  useEffect(() => {
    if (isNative) {
      return;
    }

    const loadGoogleScript = () => {
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
        setIsScriptLoaded(true);
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
      };
      script.onerror = () => {
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
  }, [isNative]);

  const initializeGoogleSignIn = () => {
    try {
      if (!window.google?.accounts?.id) {
        setInitError(
          "Google authentication not available. Please refresh the page."
        );
        return;
      }

      const initConfig = {
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        cancel_on_tap_outside: true,
      } as Parameters<typeof window.google.accounts.id.initialize>[0];

      window.google.accounts.id.initialize(initConfig);

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
        } else {
          setInitError(
            "Unable to render Google sign-in button. Please refresh the page."
          );
        }
      }, 50);
    } catch {
      setInitError(
        "Error initializing Google authentication. Please refresh the page."
      );
    }
  };

  const handleGoogleResponse = (response: { credential: string }) => {
    if (response.credential) {
      handleGoogleLogin(response.credential);
    } else {
      setInitError(
        "No authentication data received from Google. Please try again."
      );
    }
  };

  if (isNative) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleNativeSignIn}
            disabled={isLoading}
            className={`w-full max-w-xs h-12 bg-white border rounded-lg flex items-center justify-center ${
              isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google logo"
              className="h-5 w-5 mr-2"
            />
            <span className="text-gray-800 text-sm font-medium">Sign in with Google</span>
          </button>
        </div>
        {(error || initError) && (
          <p className="text-red-500 mt-2 text-sm">{error || initError}</p>
        )}
      </div>
    );
  }

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
