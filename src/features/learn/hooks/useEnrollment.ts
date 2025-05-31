import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { enrollInCourse } from '../../../services/enrolled-courses-content/coursesApis';
import { enrollStudent } from '../../../redux/slices/courseSlice';

interface UseEnrollmentProps {
  clientId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useEnrollment = ({ clientId, onSuccess, onError }: UseEnrollmentProps) => {
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const enrollmentMutation = useMutation({
    mutationFn: (courseId: number) => enrollInCourse(clientId, courseId),
    onMutate: (courseId) => {
      setEnrollingCourseId(courseId);
    },
    onSuccess: (data, courseId) => {
      // Update Redux store
      dispatch(enrollStudent({ courseId, studentId: clientId }));
      
      // Invalidate and refetch enrolled courses
      queryClient.invalidateQueries({ queryKey: ['Courses'] });
      queryClient.invalidateQueries({ queryKey: ['basedLearningCourses', clientId] });
      
      setEnrollingCourseId(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      setEnrollingCourseId(null);
      onError?.(error.message);
    },
  });

  const enrollInCourseHandler = (courseId: number) => {
    enrollmentMutation.mutate(courseId);
  };

  return {
    enrollInCourse: enrollInCourseHandler,
    isEnrolling: enrollmentMutation.isPending,
    enrollingCourseId,
    error: enrollmentMutation.error?.message,
  };
}; 