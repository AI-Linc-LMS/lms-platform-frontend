import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const persistedUser = localStorage.getItem('user');

interface UserState {
  id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  email: string | null;
  full_name: string | null;
  username: string | null;
  profile_picture: string | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = persistedUser
  ? JSON.parse(persistedUser)
  : {
      id: null,
      access_token: null,
      refresh_token: null,
      email: null,
      full_name: null,
      username: null,
      isAuthenticated: false,
      profile_picture: null,
      role: null,
      loading: false,
      error: null,
    };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<UserState>>) => {
      const newState = { ...state, ...action.payload, loading: false, error: null };
      localStorage.setItem('user', JSON.stringify(newState));
      return newState;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: () => {
      localStorage.removeItem('user');
      return {
        ...initialState,
        loading: false,
        error: null
      };
    },
  },
});

export const { setUser, setLoading, setError, logout } = userSlice.actions;
export default userSlice.reducer; 