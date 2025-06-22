import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/store';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { setUser } from '../redux/slices/userSlice';
import { login, LoginCredentials } from '../services/authApis';
import { clearAnonymousUserId } from '../utils/userIdHelper';
import { useAuthRedirect } from '../contexts/AuthRedirectContext';
import { logRedirectInfo, handleMobileNavigation, waitForAuthState } from '../utils/authRedirectUtils';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { intendedPath, clearIntendedPath } = useAuthRedirect();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials, clientId),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: async (data) => {
      console.log('Login successful, user data:', data.user);
      console.log('User role:', data.user.role);
      
      dispatch(loginSuccess({
        user: data.user,
        token: data.access_token
      }));
      
      // Store the token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Clear anonymous user ID since user is now authenticated
      clearAnonymousUserId();
      
      // Save user data in user slice and localStorage
      const userPayload = {
        id: data.user.id, // Make sure to include the user ID
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        email: data.user.email,
        full_name: data.user.full_name,
        username: data.user.username,
        phone_number: data.user.phone_number,
        role: data.user.role,
        isAuthenticated: true,
      };
      
      console.log('Setting user payload:', userPayload);
      dispatch(setUser(userPayload));
      
      // Wait for authentication state to be properly set
      await waitForAuthState();
      
      // Redirect to intended path if available, otherwise go to home
      if (intendedPath) {
        logRedirectInfo(intendedPath, '/', 'Redirecting after login');
        handleMobileNavigation(intendedPath, navigate);
        clearIntendedPath(); // Clear the intended path after redirecting
      } else {
        logRedirectInfo(null, '/', 'No intended path, going to home');
        handleMobileNavigation('/', navigate);
      }
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