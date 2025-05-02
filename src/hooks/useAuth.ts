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
      localStorage.setItem('token', data.access_token);
      // Save user data in user slice and localStorage
      const userPayload = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        email: data.user.email,
        full_name: data.user.full_name,
        username: data.user.username,
        profile_picture: data.user.profile_picture || null,
        isAuthenticated: true,
      };
      dispatch(setUser(userPayload));
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