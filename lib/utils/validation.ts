// Simple validation helpers (can be replaced with zodResolver after installing @hookform/resolvers)

export const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email address';
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};

export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return undefined;
};

export const validateOTP = (otp: string): string | undefined => {
  if (!otp) return 'OTP is required';
  if (otp.length !== 6) return 'OTP must be 6 digits';
  return undefined;
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Phone number is required';
  if (phone.length < 10) return 'Phone number must be at least 10 digits';
  return undefined;
};


