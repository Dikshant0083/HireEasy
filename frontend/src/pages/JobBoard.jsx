import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { setJobs, appendJobs, setLoading, setFilters, updateJobInList } from '../store/jobsSlice';
import { setRedirectAfterLogin } from '../store/authSlice';
import { jobsAPI } from '../services/api';
import JobCard from '../components/JobCard';
import FilterPanel from '../components/FilterPanel';

import { Radio, Globe, Sparkles, Search, Award, FileText } from 'lucide-react';

const LIMIT = 20;
const SOURCES = [
  { key: 'remotive',    label: <span className="flex items-center gap-1.5"><Radio size={14} /> Remotive</span>,      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { key: 'arbeitnow',  label: <span className="flex items-center gap-1.5"><Globe size={14} /> Arbeitnow</span>,      color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { key: 'themuse',    label: <span className="flex items-center gap-1.5"><Sparkles size={14} /> The Muse</span>,        color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { key: 'jsearch',    label: <span className="flex items-center gap-1.5"><Search size={14} /> Indeed/LinkedIn</span>, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { key: 'jooble',     label: <span className="flex items-center gap-1.5"><Globe size={14} /> Jooble (India)</span>, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { key: 'scholarship',label: <span className="flex items-center gap-1.5"><Award size={14} /> Scholarships</span>,    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { key: 'csv',        label: <span className="flex items-center gap-1.5"><FileText size={14} /> CSV Upload</span>,      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-8 w-full rounded-lg" />
    </div>
  );
}

export default function JobBoard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jobs, total, pages, page, loading } = useSelector((s) => s.jobs);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const [searchParams] = useSearchParams();
  const hasSkills = user?.skills?.length > 0;

  const [localFilters, setLocalFilters] = useState({
    type: searchParams.get('type') || '',
    search: '',
    remote: false,
    source: '',
  });
  const [sortBy, setSortBy] = useState(isAuthenticated && hasSkills ? 'score' : 'date');
  const debounceRef = useRef(null);

  const fetchJobs = useCallback(async (pageNum = 1, append = false, currentFilters = localFilters, sort = sortBy) => {
    dispatch(setLoading(true));
    try {
      const params = { page: pageNum, limit: LIMIT, sortBy: sort };
      if (currentFilters.type)   params.type   = currentFilters.type;
      if (currentFilters.search) params.search  = currentFilters.search;
      if (currentFilters.remote) params.remote  = 'true';
      if (currentFilters.source) params.source  = currentFilters.source;
      const res = await jobsAPI.getJobs(params);
      if (append) dispatch(appendJobs(res.data));
      else dispatch(setJobs(res.data));
    } catch (err) {
      console.error('Failed to fetch jobs:', err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, localFilters, sortBy]);

  // Initial load
  useEffect(() => { fetchJobs(1, false, localFilters, sortBy); }, []);

  // When user logs in and has skills, switch to score sort
  useEffect(() => {
    if (isAuthenticated && hasSkills && sortBy === 'date') {
      setSortBy('score');
      fetchJobs(1, false, localFilters, 'score');
    }
  }, [isAuthenticated, hasSkills]);

  const handleFilterChange = (newFilters) => {
    setLocalFilters(newFilters);
    dispatch(setFilters(newFilters));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchJobs(1, false, newFilters, sortBy), 400);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    fetchJobs(1, false, localFilters, newSort);
  };

  const handleLoadMore = () => {
    if (page < pages) fetchJobs(page + 1, true, localFilters, sortBy);
  };

  const handleSave = async (job) => {
    if (!isAuthenticated) {
      dispatch(setRedirectAfterLogin(`/jobs/${job._id}`));
      return navigate('/login', { state: { from: `/jobs/${job._id}` } });
    }
    try {
      const res = await jobsAPI.saveJob(job._id);
      dispatch(updateJobInList({ _id: job._id, isSaved: res.data.saved }));
    } catch (e) { console.error('Save error:', e.response?.data || e.message); }
  };

  const handleApply = async (job) => {
    if (!isAuthenticated) {
      dispatch(setRedirectAfterLogin(`/jobs/${job._id}`));
      return navigate('/login', { state: { from: `/jobs/${job._id}` } });
    }
    try {
      await jobsAPI.applyJob(job._id);
      dispatch(updateJobInList({ _id: job._id, isApplied: true }));
    } catch (_) {}
  };

  const hasMore = page < pages;

  return (
    <div className="page-bg pt-20 pb-10 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🌐 Live Opportunities</h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time jobs from Remotive, Arbeitnow, The Muse, Findwork &amp; more
              </p>
            </div>

            {/* Sort toggle */}
            <div className="flex items-center gap-2 glass-card px-3 py-2">
              <span className="text-gray-500 text-xs">Sort:</span>
              <button
                onClick={() => handleSortChange('date')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'date' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                🕐 Latest
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) return navigate('/login');
                  if (!hasSkills) return navigate('/dashboard');
                  handleSortChange('score');
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'score' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title={!hasSkills ? 'Upload resume to enable match sorting' : ''}
              >
                🎯 Best Match
                {!isAuthenticated && <span className="ml-1 text-[9px] opacity-60">(login)</span>}
                {isAuthenticated && !hasSkills && <span className="ml-1 text-[9px] opacity-60">(upload resume)</span>}
              </button>
            </div>
          </div>

          {/* Source chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SOURCES.map(s => (
              <button
                key={s.key}
                onClick={() => handleFilterChange({ ...localFilters, source: localFilters.source === s.key ? '' : s.key })}
                className={`text-[11px] px-3 py-1 rounded-full border font-medium transition-all ${s.color} ${
                  localFilters.source === s.key ? 'opacity-100 ring-1 ring-current' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Match score banner if sorted by score */}
          {sortBy === 'score' && hasSkills && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <span className="text-green-400">🎯</span>
              <p className="text-green-300 text-xs">
                Showing jobs best matched to your skills: <strong>{user.skills.slice(0, 5).join(', ')}{user.skills.length > 5 ? '...' : ''}</strong>
              </p>
              <Link to="/dashboard" className="ml-auto text-green-400 text-xs hover:text-green-300 flex-shrink-0">
                Update Skills →
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterPanel filters={localFilters} onChange={handleFilterChange} total={total} />
            </div>
          </div>

          {/* Job grid */}
          <div className="flex-1">
            {loading && jobs.length === 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-white font-semibold mb-2">No results found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onSave={handleSave}
                      onApply={handleApply}
                      showScore={isAuthenticated && hasSkills}
                    />
                  ))}
                  {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk${i}`} />)}
                </div>

                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="btn-secondary disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : `Load More (${total - jobs.length} remaining)`}
                    </button>
                  </div>
                )}

                <p className="text-center text-gray-600 text-xs mt-6">
                  Showing {jobs.length} of {total.toLocaleString()} opportunities
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
