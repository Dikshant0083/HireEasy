import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { Briefcase, GraduationCap, Award, CheckCircle, Bookmark, MapPin, ClipboardList } from 'lucide-react';

const TYPE_LABELS = { job: <span className="flex items-center gap-1.5"><Briefcase size={12}/> Job</span>, internship: <span className="flex items-center gap-1.5"><GraduationCap size={12}/> Internship</span>, scholarship: <span className="flex items-center gap-1.5"><Award size={12}/> Scholarship</span> };

function ApplicationCard({ app, onDelete }) {
  const job = app.job_id || app.job_snapshot;
  if (!job) return null;

  return (
    <div className="glass-card p-5 flex items-start justify-between gap-4 animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge-${job.type || 'job'} text-[10px]`}>
            {TYPE_LABELS[job.type] || TYPE_LABELS.job}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            app.action === 'applied'
              ? 'bg-green-500/15 text-green-400 border border-green-500/20'
              : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
          }`}>
            {app.action === 'applied' ? <span className="flex items-center gap-1"><CheckCircle size={12} /> Applied</span> : <span className="flex items-center gap-1"><Bookmark size={12} /> Saved</span>}
          </span>
        </div>

        <h3 className="text-white font-semibold text-sm">{job.title}</h3>
        <p className="text-gray-400 text-xs mt-0.5">{job.company}</p>

        <div className="flex items-center gap-3 mt-2">
          {job.location && (
            <span className="flex items-center gap-1 text-gray-500 text-xs"><MapPin size={12} /> {job.location}</span>
          )}
          <span className="text-gray-600 text-xs">
            {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-end">
        {(job.apply_url) && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-apply text-xs py-1.5 px-3"
          >
            Open →
          </a>
        )}
        {app.job_id?._id && (
          <Link to={`/jobs/${app.job_id._id}`} className="text-purple-400 text-xs hover:text-purple-300">
            Details
          </Link>
        )}
        <button
          onClick={() => onDelete(app._id)}
          className="text-gray-600 hover:text-red-400 text-xs transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function Applications() {
  const [tab, setTab] = useState('applied');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await applicationsAPI.getApplications({ action: tab });
        setApplications(res.data.applications);
      } catch (_) {}
      setLoading(false);
    }
    load();
  }, [tab]);

  const handleDelete = async (id) => {
    try {
      await applicationsAPI.deleteApplication(id);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (_) {}
  };

  return (
    <div className="page-bg pt-20 pb-10 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
          <ClipboardList size={24} className="text-purple-400" /> My Applications
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'applied', label: <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Applied</span> },
            { value: 'saved', label: <span className="flex items-center gap-1.5"><Bookmark size={14} /> Saved</span> },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.value
                  ? 'bg-purple-600 text-white'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="skeleton h-4 w-3/4 rounded mb-2" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">{tab === 'applied' ? '📭' : '🔖'}</div>
            <p className="text-white font-semibold mb-2">
              {tab === 'applied' ? 'No applications yet' : 'No saved jobs yet'}
            </p>
            <p className="text-gray-400 text-sm mb-5">
              {tab === 'applied'
                ? 'Browse jobs and click "Apply Now" to track your applications'
                : 'Save jobs using the ☆ button to find them later'}
            </p>
            <Link to="/jobs" className="btn-primary text-sm py-2 px-5">
              Browse Jobs →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app._id} app={app} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
