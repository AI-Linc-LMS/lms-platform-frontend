import { useEffect } from "react";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleLoginButton = () => {
  const { handleGoogleLogin, isLoading, error } = useGoogleAuth();

  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleSignIn();
      };
      script.onerror = () => {
        console.error(
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
    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    (window as any).google.accounts.id.renderButton(
      document.getElementById("google-signin-btn"),
      {
        theme: "outline",
        size: "large",
        width: 300,
        text: "signin_with",
        logo_alignment: "center",
      }
    );
  };

  const handleGoogleResponse = (response: { credential: string }) => {
    handleGoogleLogin(response.credential);
  };

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
      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
