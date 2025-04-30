import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/store';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { setUser } from '../redux/slices/userSlice';
import { login, LoginCredentials } from '../services/authApis';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      dispatch(loginSuccess({
        user: data.user,
        token: data.access_token
      }));
      
      // Store both tokens individually in localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Save user data in user slice and localStorage
      const userPayload = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        email: data.user.email,
        full_name: data.user.full_name,
        username: data.user.username,
        isAuthenticated: true,
      };
      dispatch(setUser(userPayload));
      
      // Log token storage for debugging
      console.log('Tokens stored after login:', {
        access_token_stored: !!data.access_token,
        refresh_token_stored: !!data.refresh_token
      });
      
      // Redirect to dashboard or home page
      navigate('/');
    },
    onError: (error: Error) => {
      dispatch(loginFailure(error.message));
    },
  });

  const handleLogin = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  return {
    handleLogin,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
  };
}; 