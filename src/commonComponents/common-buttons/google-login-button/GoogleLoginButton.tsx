import  { useEffect } from "react";
import { useAppDispatch } from '../../../redux/store';
import { setUser } from '../../../redux/slices/userSlice';
import { googleLogin } from '../../../services/authAPI';

const GOOGLE_CLIENT_ID = "445213339495-s1t369nhvvpjvlqgg1aqe3penui9a4a5.apps.googleusercontent.com";
const GOOGLE_REDIRECT_URI = "http://localhost:5173"; // or your deployed frontend URL

const GoogleLoginButton = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        interface GoogleAccounts {
          accounts: {
            id: {
              initialize: (config: { client_id: string; callback: () => void }) => void;
              renderButton: (element: HTMLElement | null, options: { theme: string; size: string }) => void;
            };
          };
        }
        
        (window as unknown as { google: GoogleAccounts }).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: () => {}, // Not used in code flow
        });
        // Use the same type assertion as above for consistency
        (window as unknown as { google: GoogleAccounts }).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large" }
        );
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const handleGoogleLogin = async () => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Check for access token in URL hash on component mount
  useEffect(() => {
    // Check if we're returning from Google OAuth
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        // Clear the hash from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Process the token
        const processToken = async () => {
          try {
            // Call your backend API with the token
            const userData = await googleLogin(accessToken);
            
            // Dispatch the user data to Redux store
            dispatch(setUser({
              id: userData.user.id,
              email: userData.user.email,
              name: userData.user.name || userData.user.email.split('@')[0], // Fallback to email username if name not provided
              role: userData.user.role || 'user', // Default role if not provided
              isAuthenticated: true
            }));
            
            // Redirect to the stored path or dashboard
            const redirectPath = localStorage.getItem('redirectAfterLogin') || '/dashboard';
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
          } catch (error) {
            console.error("Error processing Google token:", error);
            // Handle error appropriately
          }
        };
        
        processToken();
      }
    }
  }, [dispatch]);

  return (
    <div>
      <div id="google-signin-btn" style={{ display: "none" }}></div>
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center border border-gray-300 h-14 rounded-xl bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <g clipPath="url(#clip0_3547_342)">
            <path d="M19.805 10.2303C19.805 9.55056 19.7499 8.86711 19.6323 8.19836H10.2V12.0492H15.6014C15.3773 13.2911 14.6571 14.3898 13.5791 15.0879V17.5866H16.8001C18.6534 15.8449 19.805 13.2728 19.805 10.2303Z" fill="#4285F4"/>
            <path d="M10.1999 20.0001C12.897 20.0001 15.1714 19.1147 16.8 17.5866L13.579 15.0879C12.6863 15.6918 11.5347 16.0403 10.1999 16.0403C7.5937 16.0403 5.38088 14.2832 4.58797 11.9167H1.26318V14.4927C2.88263 17.7588 6.30649 20.0001 10.1999 20.0001Z" fill="#34A853"/>
            <path d="M4.58797 11.9166C4.39597 11.3124 4.2876 10.6658 4.2876 9.99984C4.2876 9.33384 4.39597 8.68724 4.58797 8.08306V5.50708H1.26318C0.57051 6.857 0.199951 8.39078 0.199951 9.99984C0.199951 11.609 0.57051 13.1427 1.26318 14.4926L4.58797 11.9166Z" fill="#FBBC05"/>
            <path d="M10.1999 3.95981C11.6543 3.95981 12.9661 4.4842 14.0048 5.46934L16.8774 2.59662C15.1684 0.98921 12.8939 0 10.1999 0C6.30649 0 2.88263 2.24126 1.26318 5.50732L4.58797 8.0833C5.38088 5.71682 7.5937 3.95981 10.1999 3.95981Z" fill="#EA4335"/>
          </g>
          <defs>
            <clipPath id="clip0_3547_342">
              <rect width="20" height="20" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
};

export default GoogleLoginButton; 