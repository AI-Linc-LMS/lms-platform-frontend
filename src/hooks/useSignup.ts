import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { signupUser, SignupPayload, SignupResponse } from '../services/authAPI';
import { toast } from 'react-hot-toast';

interface UseSignupOptions {
  onSuccess?: (data: SignupResponse) => void;
  onError?: (error: Error) => void;
}

export const useSignup = (options?: UseSignupOptions) => {
  const navigate = useNavigate();

  return useMutation<SignupResponse, Error, SignupPayload>({
    mutationFn: signupUser,
    onSuccess: (data) => {
      console.log('Signup successful:', data);
      console.log('Full signup response:', JSON.stringify(data, null, 2));
      toast.success('Account created successfully! Please log in.');
      options?.onSuccess?.(data);
      navigate('/login');
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      toast.error(errorMessage);
      options?.onError?.(error);
    },
  });
}; 