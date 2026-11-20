import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SlidersHorizontal, SearchX, X, Search, FileText, Sparkles } from 'lucide-react';
import { setJobs, appendJobs, setLoading, setFilters, updateJobInList } from '../store/jobsSlice';
import { setRedirectAfterLogin } from '../store/authSlice';
import { jobsAPI } from '../services/api';
import JobCard from '../components/JobCard';
import FilterPanel, { EMPTY_FILTERS } from '../components/FilterPanel';
import { EmptyState, Segmented, Spinner } from '../components/ui';

const LIMIT = 24;

function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="skeleton h-4 w-3/5" />
          <div className="skeleton h-3.5 w-1/3" />
          <div className="flex gap-4 pt-1"><div className="skeleton h-3 w-24" /><div className="skeleton h-3 w-24" /><div className="skeleton h-3 w-20" /></div>
          <div className="skeleton h-3 w-full" />
        </div>
        <div className="skeleton h-14 w-14 rounded-lg" />
      </div>
    </div>
  );
}

function SideRail({ isAuthenticated, user }) {
  const skills = user?.skills || [];
  return (
    <div className="space-y-4">
      {!isAuthenticated ? (
        <div className="glass-card p-5">
          <Sparkles size={20} className="text-accent-600" />
          <p className="mt-3 text-[15px] font-semibold text-gray-900">See how well you match</p>
          <p className="mt-1 text-[13px] text-gray-600">Register, upload your resume and every listing shows which of its skills you have.</p>
          <Link to="/register" className="btn-primary mt-4 w-full">Register for free</Link>
          <Link to="/login" className="mt-2 block text-center text-[13px] font-semibold text-accent-700 hover:underline">Already registered? Sign in</Link>
        </div>
      ) : skills.length === 0 ? (
        <div className="glass-card p-5">
          <FileText size={20} className="text-accent-600" />
          <p className="mt-3 text-[15px] font-semibold text-gray-900">Add your resume</p>
          <p className="mt-1 text-[13px] text-gray-600">We read your skills from it to rank jobs and show your match on each one.</p>
          <Link to="/dashboard" className="btn-primary mt-4 w-full">Upload resume</Link>
        </div>
      ) : (
        <div className="glass-card p-5">
          <p className="text-[15px] font-semibold text-gray-900">Matching on your skills</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 12).map((s) => <span key={s} className="tag">{s}</span>)}
            {skills.length > 12 && <span className="tag text-gray-500">+{skills.length - 12}</span>}
          </div>
          <Link to="/dashboard" className="mt-4 inline-block text-[13px] font-semibold text-accent-700 hover:underline">Update resume</Link>
        </div>
      )}
      <div className="glass-card p-5">
        <p className="text-[15px] font-semibold text-gray-900">Explore</p>
        <ul className="mt-2 space-y-1 text-[13px]">
          {[['Internships', '/jobs?type=internship'], ['Scholarships', '/jobs?type=scholarship'], ['Jobs', '/jobs?type=job']].map(([l, to]) => (
            <li key={to}><Link to={to} className="block py-1 text-gray-700 hover:text-accent-700">{l}</Link></li>
          ))}
        </ul>
      </div>
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

  const [filters, setLocalFilters] = useState({ ...EMPTY_FILTERS, type: searchParams.get('type') || '', search: searchParams.get('q') || '' });
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(isAuthenticated && hasSkills ? 'score' : 'date');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const requestId = useRef(0);

  const fetchJobs = useCallback(async (pageNum, append, f, sort) => {
    const id = ++requestId.current; // ignore responses that arrive after a newer request
    dispatch(setLoading(true));
    setError('');
    try {
      const params = { page: pageNum, limit: LIMIT, sortBy: sort };
      if (f.type) params.type = f.type;
      if (f.search.trim()) params.search = f.search.trim();
      if (f.remote) params.remote = 'true';
      if (f.source) params.source = f.source;
      const res = await jobsAPI.getJobs(params);
      if (id !== requestId.current) return;
      dispatch(append ? appendJobs(res.data) : setJobs(res.data));
    } catch (err) {
      if (id === requestId.current) setError('Could not load opportunities. Check your connection and try again.');
    } finally {
      if (id === requestId.current) dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Load on first visit, and again when ?q= or ?type= changes (navbar search, Explore links).
  const urlQ = searchParams.get('q') || '';
  const urlType = searchParams.get('type') || '';
  useEffect(() => {
    const next = { ...filters, search: urlQ, type: urlType };
    setQuery(urlQ);
    setLocalFilters(next);
    fetchJobs(1, false, next, sortBy);
  }, [urlQ, urlType]);

  useEffect(() => {
    if (isAuthenticated && hasSkills && sortBy === 'date') {
      setSortBy('score');
      fetchJobs(1, false, filters, 'score');
    }
  }, [isAuthenticated, hasSkills]);

  const handleFilterChange = (next) => {
    setLocalFilters(next);
    dispatch(setFilters(next));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchJobs(1, false, next, sortBy), 0);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    handleFilterChange({ ...filters, search: query.trim() });
  };

  const handleSortChange = (next) => {
    if (next === 'score' && !isAuthenticated) return navigate('/login', { state: { from: '/jobs' } });
    if (next === 'score' && !hasSkills) return navigate('/dashboard');
    setSortBy(next);
    fetchJobs(1, false, filters, next);
  };

  const requireLogin = (job, reason = 'save') => {
    const from = `/jobs/${job._id}`;
    dispatch(setRedirectAfterLogin(from));
    navigate('/login', { state: { from, reason } });
  };

  const handleSave = async (job) => {
    if (!isAuthenticated) return requireLogin(job);
    dispatch(updateJobInList({ _id: job._id, isSaved: !job.isSaved })); // optimistic
    try {
      const res = await jobsAPI.saveJob(job._id);
      dispatch(updateJobInList({ _id: job._id, isSaved: res.data.saved }));
    } catch {
      dispatch(updateJobInList({ _id: job._id, isSaved: job.isSaved }));
    }
  };

  // Guests must sign in first so the application can be recorded against their account.
  // Signed-in users: the link opens the listing and we record it as applied.
  const handleApply = async (job, e) => {
    if (!isAuthenticated) {
      e?.preventDefault();
      return requireLogin(job, 'apply');
    }
    if (job.isApplied) return;
    try {
      await jobsAPI.applyJob(job._id);
      dispatch(updateJobInList({ _id: job._id, isApplied: true }));
    } catch (_) {}
  };

  const activeCount = [filters.type, filters.source, filters.remote].filter(Boolean).length;
  const hasMore = page < pages;
  const initialLoading = loading && jobs.length === 0;
  const typeName = { job: 'Jobs', internship: 'Internships', scholarship: 'Scholarships' }[filters.type];
  const heading = filters.search ? `${typeName || 'Opportunities'} for “${filters.search}”` : typeName || 'All opportunities';

  return (
    <div className="min-h-screen bg-[var(--canvas)] pb-28 pt-16 md:pb-16">
      <section className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <h1 className="text-[22px] font-bold sm:text-[26px]">Find jobs, internships and scholarships</h1>
          <p className="mt-1 text-[14px] text-gray-600">Listings from top job boards in one place, refreshed every hour.</p>
          <form onSubmit={submitSearch} role="search" className="mt-5 flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-[0_6px_24px_rgba(16,24,40,0.08)] sm:flex-row sm:items-center sm:rounded-full">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter skills, designation or company"
                aria-label="Search jobs"
                className="h-11 w-full rounded-full bg-transparent pl-11 pr-4 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            <div className="hidden h-6 w-px bg-[var(--line)] sm:block" />
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value, search: query.trim() })}
              aria-label="Opportunity type"
              className="h-11 rounded-full bg-transparent px-4 text-[14px] text-gray-700 outline-none sm:w-44"
            >
              <option value="">All types</option>
              <option value="job">Jobs</option>
              <option value="internship">Internships</option>
              <option value="scholarship">Scholarships</option>
            </select>
            <button type="submit" className="btn-primary h-11 px-8 text-[14px]">Search</button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-60 lg:flex-shrink-0`}>
            <div className="lg:sticky lg:top-20">
              <FilterPanel filters={filters} onChange={handleFilterChange} />
            </div>
          </aside>

          <section className="min-w-0 flex-1" aria-live="polite" aria-busy={loading}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-semibold text-gray-900">{heading}</h2>
                <p className="num text-[13px] text-gray-500">
                  {initialLoading ? 'Loading…' : `${total.toLocaleString()} result${total === 1 ? '' : 's'}`}
                  {filters.search && !initialLoading && (
                    <button type="button" onClick={() => { setQuery(''); handleFilterChange({ ...filters, search: '' }); }} className="ml-2 inline-flex items-center gap-0.5 font-semibold text-accent-700 hover:underline">
                      <X size={12} /> Clear search
                    </button>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowFilters((v) => !v)} className="btn-secondary btn-sm lg:hidden" aria-expanded={showFilters}>
                  <SlidersHorizontal size={14} /> Filters{activeCount > 0 && ` (${activeCount})`}
                </button>
                <span className="hidden text-[13px] text-gray-500 sm:inline">Sort by</span>
                <Segmented label="Sort" value={sortBy} onChange={handleSortChange}
                  options={[{ value: 'date', label: 'Newest' }, { value: 'score', label: 'Best match' }]} />
              </div>
            </div>

            {error ? (
              <EmptyState icon={SearchX} title="Something went wrong" body={error}
                action={<button className="btn-secondary btn-sm" onClick={() => fetchJobs(1, false, filters, sortBy)}>Try again</button>} />
            ) : initialLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : jobs.length === 0 ? (
              <EmptyState icon={SearchX} title="No matching opportunities" body="Try different keywords or clear a filter."
                action={<button className="btn-secondary btn-sm" onClick={() => { setQuery(''); handleFilterChange(EMPTY_FILTERS); }}>Clear all</button>} />
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} onSave={handleSave} onApply={handleApply} showScore={isAuthenticated && hasSkills} />
                  ))}
                </div>
                <div className="mt-6 flex flex-col items-center gap-2">
                  {hasMore && (
                    <button onClick={() => fetchJobs(page + 1, true, filters, sortBy)} disabled={loading} className="btn-secondary">
                      {loading ? <><Spinner /> Loading</> : 'Show more jobs'}
                    </button>
                  )}
                  <p className="num text-xs text-gray-500">Showing {jobs.length.toLocaleString()} of {total.toLocaleString()}</p>
                </div>
              </>
            )}
          </section>

          <aside className="hidden w-[280px] flex-shrink-0 xl:block">
            <div className="sticky top-20"><SideRail isAuthenticated={isAuthenticated} user={user} /></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
