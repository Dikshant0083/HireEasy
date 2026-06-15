import { createSlice } from '@reduxjs/toolkit';

const stored = (() => {
  try { return JSON.parse(localStorage.getItem('hireeasy_user')); } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored || null,              // MongoDB user profile (serializable POJO)
    isAuthenticated: !!stored,
    loading: true,                     // true until Firebase onAuthStateChanged fires
    error: null,
    redirectAfterLogin: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;      // plain JS object from MongoDB
      state.isAuthenticated = !!action.payload;
      state.loading = false;
      if (action.payload) {
        localStorage.setItem('hireeasy_user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('hireeasy_user');
      }
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => { state.error = action.payload; },
    setRedirectAfterLogin: (state, action) => { state.redirectAfterLogin = action.payload; },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.redirectAfterLogin = null;
      localStorage.removeItem('hireeasy_user');
    },
  },
});

export const {
  setUser, setAuthLoading, setError, setRedirectAfterLogin, logout,
} = authSlice.actions;
export default authSlice.reducer;
