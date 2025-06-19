import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../redux/slices/userSlice';
import { googleLogin } from '../services/authApis';
import { clearAnonymousUserId } from '../utils/userIdHelper';
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
      
      // Clear anonymous user ID since user is now authenticated
      clearAnonymousUserId();
      
      // Update Redux store with user data
      dispatch(
        setUser({
          id: user.id,
          access_token,
          refresh_token,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          profile_picture: user.profile_picture,
          role: user.role,
          isAuthenticated: true,
        })
      );

      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      
      // Set a more user-friendly error message
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setError('Invalid Google account or authorization. Please try again.');
        } else if (error.response?.status === 500) {
          setError('Server error. Please try again later or use a different account.');
        } else if (error.message.includes('Network Error')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(error.response?.data?.message || error.response?.data?.detail || 'Failed to log in with Google. Please try again.');
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return { handleGoogleLogin, isLoading, error };
}; 