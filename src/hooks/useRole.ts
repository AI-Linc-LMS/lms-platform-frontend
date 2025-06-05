import { useSelector } from 'react-redux';

interface UserState {
  role: string | null;
  isAuthenticated: boolean;
}

export const useRole = () => {
  const user = useSelector((state: { user: UserState }) => state.user);
  
  const isAdmin = user.role === 'admin';
  const isStudent = user.role === 'student';
  const isAuthenticated = user.isAuthenticated;
  const userRole = user.role;
  
  return {
    isAdmin,
    isStudent,
    isAuthenticated,
    userRole,
  };
}; 