import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Inbox, Bookmark, MapPin } from 'lucide-react';
import { applicationsAPI } from '../services/api';
import { CompanyAvatar, EmptyState, PageHeader, Segmented, TYPE_NAMES } from '../components/ui';

function Row({ app, onRemove }) {
  const job = app.job_id || app.job_snapshot || {};
  const id = app.job_id?._id;
  const date = new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <CompanyAvatar company={job.company} size={36} />
      <div className="min-w-0 flex-1">
        {id
          ? <Link to={`/jobs/${id}`} className="block truncate text-[13px] font-medium text-gray-900 hover:underline hover:underline-offset-4">{job.title || 'Untitled listing'}</Link>
          : <p className="truncate text-[13px] font-medium text-gray-900">{job.title || 'Untitled listing'} <span className="font-normal text-gray-400">· listing expired</span></p>}
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
          <span className="truncate">{[job.company, TYPE_NAMES[job.type]].filter(Boolean).join(' · ')}</span>
          {job.location && <><MapPin size={11} className="flex-shrink-0" /><span className="truncate">{job.location}</span></>}
        </p>
      </div>
      <span className="num hidden w-24 flex-shrink-0 text-right text-xs text-gray-500 sm:block">{date}</span>
      <div className="flex flex-shrink-0 items-center gap-1">
        {job.apply_url && (
          <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="Open listing" title="Open listing">
            <ArrowUpRight size={15} />
          </a>
        )}
        <button onClick={() => onRemove(app)} className="btn-ghost btn-sm text-gray-500">Remove</button>
      </div>
    </li>
  );
}

export default function Applications() {
  const [tab, setTab] = useState('applied');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    applicationsAPI.getApplications({ action: tab })
      .then((res) => alive && setApplications(res.data.applications))
      .catch(() => alive && setError('Couldn’t load your list. Refresh to try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab]);

  const handleRemove = async (app) => {
    const prev = applications;
    setApplications((list) => list.filter((a) => a._id !== app._id));
    try { await applicationsAPI.deleteApplication(app._id); } catch { setApplications(prev); }
  };

  return (
    <div className="page">
      <div className="mx-auto max-w-4xl animate-fade-in">
        <PageHeader
          title="Applications"
          description="Listings you’ve opened with Apply, and the ones you saved for later."
          actions={<Segmented label="Show" value={tab} onChange={setTab} options={[{ value: 'applied', label: 'Applied' }, { value: 'saved', label: 'Saved' }]} />}
        />

        {error ? (
          <div className="alert-error">{error}</div>
        ) : loading ? (
          <div className="glass-card divide-y divide-[var(--line)]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5"><div className="skeleton h-9 w-9" /><div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-2/5" /><div className="skeleton h-3 w-1/4" /></div></div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={tab === 'applied' ? Inbox : Bookmark}
            title={tab === 'applied' ? 'No applications yet' : 'Nothing saved yet'}
            body={tab === 'applied' ? 'When you open a listing with Apply, it’s recorded here so you can follow up.' : 'Use the bookmark on any listing to keep it here.'}
            action={<Link to="/jobs" className="btn-secondary btn-sm">Browse opportunities</Link>}
          />
        ) : (
          <>
            <ul className="glass-card divide-y divide-[var(--line)]">
              {applications.map((app) => <Row key={app._id} app={app} onRemove={handleRemove} />)}
            </ul>
            <p className="num mt-3 text-xs text-gray-500">{applications.length} {applications.length === 1 ? 'listing' : 'listings'}</p>
          </>
        )}
      </div>
    </div>
  );
}
