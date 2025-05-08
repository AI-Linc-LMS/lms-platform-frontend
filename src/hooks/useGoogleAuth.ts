import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../redux/slices/userSlice';
import { googleLogin } from '../services/authApis';
import axios from 'axios';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const handleGoogleLogin = async (googleToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { access_token, refresh_token, user } = await googleLogin(googleToken, clientId);

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
      
      let errorMessage: string;
      
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific status codes
        if (error.response.status === 500) {
          errorMessage = 'Server error occurred with this Google account. Please try a different Google account or contact support.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Google login failed (${error.response.status}): ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
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