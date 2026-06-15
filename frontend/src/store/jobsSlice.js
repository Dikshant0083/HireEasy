import { createSlice } from '@reduxjs/toolkit';

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    total: 0,
    pages: 0,
    page: 1,
    selectedJob: null,
    loading: false,
    error: null,
    filters: {
      type: '',
      search: '',
      remote: false,
      source: '',
    },
  },
  reducers: {
    setJobs: (state, action) => {
      state.jobs = action.payload.jobs;
      state.total = action.payload.total;
      state.pages = action.payload.pages;
      state.page = action.payload.page;
    },
    appendJobs: (state, action) => {
      state.jobs = [...state.jobs, ...action.payload.jobs];
      state.total = action.payload.total;
      state.pages = action.payload.pages;
      state.page = action.payload.page;
    },
    setSelectedJob: (state, action) => { state.selectedJob = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
      state.jobs = [];
    },
    updateJobInList: (state, action) => {
      const idx = state.jobs.findIndex(j => j._id === action.payload._id);
      if (idx !== -1) state.jobs[idx] = { ...state.jobs[idx], ...action.payload };
    },
  },
});

export const { setJobs, appendJobs, setSelectedJob, setLoading, setError, setFilters, updateJobInList } = jobsSlice.actions;
export default jobsSlice.reducer;
