import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

interface GoogleAuthResult {
  authentication?: { idToken?: string };
  idToken?: string;
}

const GoogleSignupButton = () => {
  const { handleGoogleLogin, isLoading, error } = useGoogleAuth();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) return;

    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleSignUp();
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

  const initializeGoogleSignUp = () => {
    window.google?.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google?.accounts.id.renderButton(
      document.getElementById("google-signup-btn"),
      {
        theme: "outline",
        size: "large",
        width: 300,
        text: "signup_with",
        logo_alignment: "center",
      }
    );
  };

  const handleNativeSignIn = async () => {
    await GoogleAuth.initialize({ clientId: GOOGLE_CLIENT_ID, scopes: ["profile", "email"] });
    const result = (await GoogleAuth.signIn()) as unknown as GoogleAuthResult;
    const token = result.authentication?.idToken || result.idToken;
    if (token) {
      await handleGoogleLogin(token);
    }
  };

  const handleGoogleResponse = (response: { credential: string }) => {
    handleGoogleLogin(response.credential);
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
            <span className="text-gray-800 text-sm font-medium">Sign up with Google</span>
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="flex justify-center">
        <div
          id="google-signup-btn"
          className={`w-full max-w-xs transform transition-transform ${
            isLoading ? "cursor-not-allowed" : "hover:scale-97"
          }`}
        ></div>
      </div>
      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}
    </div>
  );
};

export default GoogleSignupButton;
