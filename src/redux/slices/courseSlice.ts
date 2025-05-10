import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the course data structure
interface Instructor {
  id: number;
  name: string;
  bio: string;
  profile_pic_url: string;
  linkedin: string;
}

export interface Course {
  id: number;
  instructors: Instructor[];
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  requirements: string;
  learning_objectives: string;
  language: string;
  difficulty_level: string;
  duration_in_hours: number;
  price: string;
  is_free: boolean;
  certificate_available: boolean;
  thumbnail: string | null;
  preview_video_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  client: number;
  enrolled_students: number[];
}

interface CoursesState {
  courses: Course[];
  currentCourse: Course | null;
  loading: boolean;
  error: string | null;
}

const initialState: CoursesState = {
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentCourse: (state, action: PayloadAction<Course>) => {
      state.currentCourse = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    addCourse: (state, action: PayloadAction<Course>) => {
      state.courses.push(action.payload);
    },
    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(course => course.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
      if (state.currentCourse && state.currentCourse.id === action.payload.id) {
        state.currentCourse = action.payload;
      }
    },
    deleteCourse: (state, action: PayloadAction<number>) => {
      state.courses = state.courses.filter(course => course.id !== action.payload);
      if (state.currentCourse && state.currentCourse.id === action.payload) {
        state.currentCourse = null;
      }
    },
    enrollStudent: (state, action: PayloadAction<{ courseId: number, studentId: number }>) => {
      const course = state.courses.find(course => course.id === action.payload.courseId);
      if (course && !course.enrolled_students.includes(action.payload.studentId)) {
        course.enrolled_students.push(action.payload.studentId);
      }
      
      if (state.currentCourse && state.currentCourse.id === action.payload.courseId) {
        if (!state.currentCourse.enrolled_students.includes(action.payload.studentId)) {
          state.currentCourse.enrolled_students.push(action.payload.studentId);
        }
      }
    },
    unenrollStudent: (state, action: PayloadAction<{ courseId: number, studentId: number }>) => {
      const course = state.courses.find(course => course.id === action.payload.courseId);
      if (course) {
        course.enrolled_students = course.enrolled_students.filter(id => id !== action.payload.studentId);
      }
      
      if (state.currentCourse && state.currentCourse.id === action.payload.courseId) {
        state.currentCourse.enrolled_students = state.currentCourse.enrolled_students.filter(
          id => id !== action.payload.studentId
        );
      }
    },
  },
});

export const {
  setCourses,
  setCurrentCourse,
  setLoading,
  setError,
  addCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
} = coursesSlice.actions;

export default coursesSlice.reducer;
