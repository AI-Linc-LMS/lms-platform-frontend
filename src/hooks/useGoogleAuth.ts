import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../redux/slices/userSlice';
import { googleLogin } from '../services/authApis';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleLogin = async (googleToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { access_token, refresh_token, user } = await googleLogin(googleToken);

      console.log('Google login response:', { access_token, refresh_token, user });
      
      // Store token in localStorage
      localStorage.setItem('token', access_token);
      
      // Store the current timestamp for token expiration checks
      localStorage.setItem('tokenTimestamp', Date.now().toString());

      // Update Redux store with user data
      dispatch(
        setUser({
          access_token,
          refresh_token,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          profile_picture: user.profile_picture,
          isAuthenticated: true,
        })
      );

      // Redirect to home page
      navigate('/');
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleGoogleLogin,
    isLoading,
    error,
  };
}; 