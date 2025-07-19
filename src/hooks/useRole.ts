import { useSelector } from 'react-redux';

interface UserState {
  role: string | null;
  isAuthenticated: boolean;
}

export const useRole = () => {
  const user = useSelector((state: { user: UserState }) => state.user);
  const isAdmin = user.role === 'admin';
  const isInstructor = user.role === 'instructor';
  const isStudent = user.role === 'student';
  const isAdminOrInstructor = user.role === 'admin' || user.role === 'instructor';
  const isSuperAdmin = user.role === 'superadmin';
  const isAuthenticated = user.isAuthenticated;
  const userRole = user.role;
  
  return {
    isSuperAdmin,
    isAdmin,
    isInstructor,
    isStudent,
    isAdminOrInstructor,
    isAuthenticated,
    userRole,
  };
}; 