import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, ArrowUpRight, Bookmark, Check, SearchX } from 'lucide-react';
import { jobsAPI } from '../services/api';
import { updateJobInList } from '../store/jobsSlice';
import { setRedirectAfterLogin } from '../store/authSlice';
import { CompanyAvatar, EmptyState, SOURCE_NAMES, TYPE_NAMES, cleanText, matchTone, timeAgo } from '../components/ui';

const prettyType = (t = '') => t.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Fact({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-[13px]">
      <dt className="text-gray-500">{label}</dt>
      <dd className="min-w-0 text-right text-gray-800">{children}</dd>
    </div>
  );
}

function MatchPanel({ job, isAuthenticated, hasSkills }) {
  if (!isAuthenticated) {
    return (
      <p className="text-[13px] text-gray-600">
        <Link to="/login" className="text-accent-600 hover:text-accent-700">Sign in</Link> and upload a resume to see how your skills compare.
      </p>
    );
  }
  if (job.matchScore === null || job.matchScore === undefined) {
    if (!hasSkills) {
      return (
        <p className="text-[13px] text-gray-600">
          <Link to="/dashboard" className="text-accent-600 hover:text-accent-700">Upload a resume</Link> to see how your skills compare.
        </p>
      );
    }
    const named = [...(job.matchedSkills || []), ...(job.missingSkills || [])];
    return (
      <div className="text-[13px] text-gray-600">
        <p>
          {named.length === 0
            ? 'This listing doesn’t name specific skills, so there’s nothing to compare.'
            : `This listing names only ${named.length} skill${named.length === 1 ? '' : 's'}, too few for a reliable match score.`}
        </p>
        {named.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.matchedSkills.map((s) => <span key={s} className="tag border-emerald-200 bg-emerald-50 text-emerald-700"><Check size={12} className="mr-1" />{s}</span>)}
            {job.missingSkills.map((s) => <span key={s} className="tag text-gray-500">{s}</span>)}
          </div>
        )}
      </div>
    );
  }
  const tone = matchTone(job.matchScore);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={`num text-[28px] font-semibold leading-none ${tone.text}`}>{job.matchScore}%</span>
        <span className="text-xs text-gray-500">{tone.label}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${job.matchScore}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        You have {job.matchedSkills.length} of {job.matchedSkills.length + job.missingSkills.length} skills this listing mentions.
      </p>
      {job.matchedSkills.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow mb-2">You have</p>
          <div className="flex flex-wrap gap-1">
            {job.matchedSkills.map((s) => <span key={s} className="tag text-emerald-700"><Check size={12} className="mr-1" />{s}</span>)}
          </div>
        </div>
      )}
      {job.missingSkills.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow mb-2">Not on your resume</p>
          <div className="flex flex-wrap gap-1">
            {job.missingSkills.map((s) => <span key={s} className="tag text-gray-600">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();
  const cameToApply = isAuthenticated && location.state?.afterAuth === 'apply';
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    jobsAPI.getJob(id)
      .then((res) => { if (alive) { setJob(res.data.job); setStatus('ready'); } })
      .catch(() => alive && setStatus('missing'));
    return () => { alive = false; };
  }, [id, isAuthenticated]);

  const requireLogin = (reason = 'save') => {
    dispatch(setRedirectAfterLogin(`/jobs/${id}`));
    navigate('/login', { state: { from: `/jobs/${id}`, reason } });
  };

  const handleSave = async () => {
    if (!isAuthenticated) return requireLogin();
    setSaving(true);
    try {
      const res = await jobsAPI.saveJob(id);
      setJob((prev) => ({ ...prev, isSaved: res.data.saved }));
      dispatch(updateJobInList({ _id: id, isSaved: res.data.saved }));
    } catch (_) {}
    setSaving(false);
  };

  // Guests sign in first so the application is recorded; they come back here to apply.
  const handleApply = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      return requireLogin('apply');
    }
    if (job.isApplied) return;
    jobsAPI.applyJob(id).then(() => {
      setJob((prev) => ({ ...prev, isApplied: true }));
      dispatch(updateJobInList({ _id: id, isApplied: true }));
    }).catch(() => {});
  };

  if (status === 'loading') {
    return (
      <div className="page">
        <div className="mx-auto max-w-5xl">
          <div className="skeleton mb-8 h-4 w-24" />
          <div className="flex gap-4">
            <div className="skeleton h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2.5"><div className="skeleton h-3 w-40" /><div className="skeleton h-6 w-2/3" /></div>
          </div>
          <div className="mt-10 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-3.5" style={{ width: `${95 - i * 7}%` }} />)}</div>
        </div>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <div className="page">
        <div className="mx-auto max-w-lg pt-10">
          <EmptyState icon={SearchX} title="This listing is no longer available" body="Listings from job boards expire when the employer closes them."
            action={<Link to="/jobs" className="btn-secondary btn-sm">Browse opportunities</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mx-auto max-w-5xl animate-fade-in">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/jobs'))} className="btn-ghost btn-sm -ml-3 mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <header className="glass-card flex items-start gap-4 p-6">
          <CompanyAvatar company={job.company} logo={job.company_logo} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-gray-600">{job.company || 'Company not listed'}</p>
            <h1 className="mt-0.5 text-[22px] font-semibold leading-tight sm:text-[26px]">{job.title}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`badge-${job.type || 'job'}`}>{TYPE_NAMES[job.type] || 'Job'}</span>
              {job.is_remote && <span className="badge-remote">Remote</span>}
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="glass-card min-w-0 space-y-8 p-6">
            {job.tags?.length > 0 && (
              <section>
                <h2 className="section-title mb-3">Skills and tags</h2>
                <div className="flex flex-wrap gap-1.5">{job.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
              </section>
            )}
            <section>
              <h2 className="section-title mb-3">About this {TYPE_NAMES[job.type]?.toLowerCase() || 'role'}</h2>
              {job.description ? (
                <div className="max-w-[68ch] whitespace-pre-line text-[14px] leading-7 text-gray-700">{cleanText(job.description)}</div>
              ) : (
                <p className="text-[13px] text-gray-500">The source didn’t include a description. Open the original listing for full details.</p>
              )}
              {job.description?.length >= 1990 && (
                <p className="mt-3 text-[13px] text-gray-500">Description shortened. The full text is on the original listing.</p>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="glass-card p-4">
              {cameToApply && !job.isApplied && (
                <p className="alert-success mb-3">You’re signed in. Apply now and it will be saved to your applications.</p>
              )}
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer" onClick={handleApply} className="btn-primary w-full">
                {!isAuthenticated
                  ? 'Sign in to apply'
                  : <>{job.type === 'scholarship' ? 'View scholarship' : 'Apply on company site'} <ArrowUpRight size={15} /></>}
              </a>
              <button onClick={handleSave} disabled={saving} className="btn-secondary mt-2 w-full" aria-pressed={!!job.isSaved}>
                <Bookmark size={15} fill={job.isSaved ? 'currentColor' : 'none'} /> {job.isSaved ? 'Saved' : 'Save for later'}
              </button>
              {job.isApplied && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600"><Check size={13} /> Marked as applied</p>
              )}
            </div>

            <div className="glass-card p-4">
              <h2 className="section-title mb-3">Your match</h2>
              <MatchPanel job={job} isAuthenticated={isAuthenticated} hasSkills={user?.skills?.length > 0} />
            </div>

            <div className="glass-card px-4 py-1.5">
              <dl className="divide-y divide-[var(--line)]">
                <Fact label="Location">{job.location}</Fact>
                <Fact label="Compensation">{job.salary && <span className="num">{job.salary}</span>}</Fact>
                <Fact label="Employment">{job.job_type && prettyType(job.job_type)}</Fact>
                <Fact label="Posted">{job.posted_at && timeAgo(job.posted_at)}</Fact>
                <Fact label="Source">{SOURCE_NAMES[job.source] || job.source}</Fact>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
