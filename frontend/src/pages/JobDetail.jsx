import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { jobsAPI } from '../services/api';
import { updateJobInList } from '../store/jobsSlice';
import { setRedirectAfterLogin } from '../store/authSlice';
import { Briefcase, GraduationCap, Award, Radio, Globe, FileText, MapPin, Banknote, Clock, Calendar, Tag, ClipboardList, Rocket, Bookmark, CheckCircle } from 'lucide-react';

const TYPE_LABELS = { job: <span className="flex items-center gap-1.5"><Briefcase size={14}/> Job</span>, internship: <span className="flex items-center gap-1.5"><GraduationCap size={14}/> Internship</span>, scholarship: <span className="flex items-center gap-1.5"><Award size={14}/> Scholarship</span> };
const SOURCE_LABELS = { remotive: <span className="flex items-center gap-1.5"><Radio size={14}/> Remotive</span>, arbeitnow: <span className="flex items-center gap-1.5"><Globe size={14}/> Arbeitnow</span>, scholarship: <span className="flex items-center gap-1.5"><Award size={14}/> Curated</span>, csv: <span className="flex items-center gap-1.5"><FileText size={14}/> CSV Upload</span> };

function ScoreBar({ label, score, color = '#8b5cf6' }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="text-white text-xs font-semibold">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, background: color, '--bar-width': `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await jobsAPI.getJob(id);
        setJob(res.data.job);
      } catch {
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      dispatch(setRedirectAfterLogin(`/jobs/${id}`));
      return navigate('/login', { state: { from: `/jobs/${id}` } });
    }
    setSaving(true);
    try {
      const res = await jobsAPI.saveJob(id);
      setJob(prev => ({ ...prev, isSaved: res.data.saved }));
      dispatch(updateJobInList({ _id: id, isSaved: res.data.saved }));
    } catch (_) {}
    setSaving(false);
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      dispatch(setRedirectAfterLogin(`/jobs/${id}`));
      return navigate('/login', { state: { from: `/jobs/${id}` } });
    }
    setApplying(true);
    try {
      const res = await jobsAPI.applyJob(id);
      setJob(prev => ({ ...prev, isApplied: true }));
      dispatch(updateJobInList({ _id: id, isApplied: true }));
      window.open(res.data.apply_url || job.apply_url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="page-bg pt-24 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="skeleton h-8 w-1/2 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="glass-card p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-4 w-full rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const score = job.matchScore;
  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-bg pt-20 pb-10 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto animate-slide-up">
        {/* Back */}
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-5 transition-colors">
          ← Back to Jobs
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-5">
            <div className="glass-card p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  {(job.company || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-white">{job.title}</h1>
                  <p className="text-gray-400 mt-0.5">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`badge-${job.type}`}>{TYPE_LABELS[job.type]}</span>
                    {job.is_remote && <span className="badge-remote flex items-center gap-1"><Globe size={14} /> Remote</span>}
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-full bg-white/5">
                      {SOURCE_LABELS[job.source] || job.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {job.location && (
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="flex items-center gap-1 text-gray-500 text-xs"><MapPin size={14} /> Location</p>
                    <p className="text-white text-sm font-medium mt-0.5">{job.location}</p>
                  </div>
                )}
                {job.salary && (
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="flex items-center gap-1 text-gray-500 text-xs"><Banknote size={14} /> Compensation</p>
                    <p className="text-white text-sm font-medium mt-0.5">{job.salary}</p>
                  </div>
                )}
                {job.job_type && (
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="flex items-center gap-1 text-gray-500 text-xs"><Clock size={14} /> Type</p>
                    <p className="text-white text-sm font-medium mt-0.5">{job.job_type.replace('_', ' ')}</p>
                  </div>
                )}
                {job.posted_at && (
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="flex items-center gap-1 text-gray-500 text-xs"><Calendar size={14} /> Posted</p>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {job.tags?.length > 0 && (
                <div className="mb-5">
                  <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-2"><Tag size={14} /> Skills & Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/15">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-2"><ClipboardList size={14} /> Description</p>
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply card */}
            <div className="glass-card p-5 sticky top-20">
              {score !== null && score !== undefined && (
                <div className="text-center mb-5">
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{
                      background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                    }}
                  >
                    <div className="absolute w-15 h-15 rounded-full bg-[#080810] flex items-center justify-center"
                      style={{ width: '56px', height: '56px' }}>
                      <span className="text-xl font-bold" style={{ color: scoreColor }}>{Math.round(score)}%</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">Your Match Score</p>

                  <div className="mt-4 space-y-2.5">
                    <ScoreBar label="Skill Match" score={Math.min(score, 100)} color={scoreColor} />
                    <ScoreBar label="Tags Overlap" score={Math.max(score - 20, 0)} color="#3b82f6" />
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleApply}
                  className="btn-apply w-full flex items-center justify-center gap-2 text-sm"
                >
                  {applying ? 'Opening...' : <><Rocket size={16} /> Apply Now</>}
                </a>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    job.isSaved
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'btn-secondary'
                  }`}
                >
                  {saving ? '...' : job.isSaved ? <><Bookmark fill="currentColor" size={16} /> Saved</> : <><Bookmark size={16} /> Save</>}
                </button>
              </div>

              {job.isApplied && (
                <div className="mt-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="flex justify-center items-center gap-1.5 text-green-400 text-xs"><CheckCircle size={14} /> You applied to this job</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
