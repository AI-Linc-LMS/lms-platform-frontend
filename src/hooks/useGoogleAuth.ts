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

      // Store both tokens individually in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Update Redux store with user data
      dispatch(
        setUser({
          access_token,
          refresh_token,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          isAuthenticated: true,
        })
      );
      
      // Log token storage for debugging
      console.log('Google login tokens stored:', {
        access_token_stored: !!access_token,
        refresh_token_stored: !!refresh_token
      });

      // Redirect to home page
      navigate('/');
    } catch (error: unknown) {
      console.error('Google login error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
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