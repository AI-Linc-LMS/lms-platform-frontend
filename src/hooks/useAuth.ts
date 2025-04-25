import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/store';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { login, LoginCredentials } from '../services/authAPI';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      // Store token in localStorage or secure storage
      localStorage.setItem('token', data.token);
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