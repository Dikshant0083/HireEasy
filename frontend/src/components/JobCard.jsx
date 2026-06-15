import React from 'react';
import { Link } from 'react-router-dom';

const TYPE_CONFIG = {
  job: { label: '💼 Job', className: 'badge-job' },
  internship: { label: '🎓 Internship', className: 'badge-internship' },
  scholarship: { label: '🏅 Scholarship', className: 'badge-scholarship' },
};

const SOURCE_CONFIG = {
  remotive:    { label: '📡 Remotive',           color: 'text-blue-400' },
  arbeitnow:   { label: '🌍 Arbeitnow',          color: 'text-green-400' },
  themuse:     { label: '✨ The Muse',            color: 'text-pink-400' },
  jsearch:     { label: '🔍 Indeed/LinkedIn',    color: 'text-sky-400' },
  jooble:      { label: '🇮🇳 Jooble',            color: 'text-orange-400' },
  scholarship: { label: '🏅 Curated',            color: 'text-yellow-400' },
  csv:         { label: '📄 CSV Upload',         color: 'text-purple-400' },
};

function ScoreRing({ score }) {
  if (score === null || score === undefined) return null;
  const pct = Math.round(score);
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
        }}
      >
        <div className="absolute w-9 h-9 rounded-full bg-[#080810] flex items-center justify-center">
          <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className="text-[9px] text-gray-500 mt-1">Match</span>
    </div>
  );
}

function CompanyAvatar({ company, logo }) {
  const [imgError, setImgError] = React.useState(false);

  const initial = (company || 'C')[0].toUpperCase();
  const colors = ['#7c3aed', '#db2777', '#2563eb', '#059669', '#d97706', '#dc2626'];
  const color = colors[initial.charCodeAt(0) % colors.length];

  const fallback = (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: color }}
    >
      {initial}
    </div>
  );

  if (!logo || imgError) return fallback;

  return (
    <img
      src={logo}
      alt={company}
      className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10 p-1 flex-shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

export default function JobCard({ job, onSave, onApply, showScore = true }) {
  const typeConfig = TYPE_CONFIG[job.type] || TYPE_CONFIG.job;
  const sourceConfig = SOURCE_CONFIG[job.source] || { label: job.source, color: 'text-gray-400' };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass-card-hover p-5 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <CompanyAvatar company={job.company} logo={job.company_logo} />
          <div className="flex-1 min-w-0">
            <Link
              to={`/jobs/${job._id}`}
              className="text-white font-semibold text-sm hover:text-purple-300 transition-colors line-clamp-2 block"
            >
              {job.title}
            </Link>
            <p className="text-gray-400 text-xs mt-0.5 truncate">{job.company}</p>
          </div>
        </div>
        {showScore && <ScoreRing score={job.matchScore} />}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={typeConfig.className}>{typeConfig.label}</span>
        {job.is_remote && <span className="badge-remote">🌐 Remote</span>}
        {job.location && !job.is_remote && (
          <span className="px-2.5 py-1 rounded-full text-xs text-gray-400 bg-white/5 border border-white/10">
            📍 {job.location.slice(0, 20)}
          </span>
        )}
        {job.salary && (
          <span className="px-2.5 py-1 rounded-full text-xs text-green-400 bg-green-500/10 border border-green-500/20">
            💰 {job.salary.slice(0, 20)}
          </span>
        )}
      </div>

      {/* Tags */}
      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/10">
              {tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-500">
              +{job.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${sourceConfig.color}`}>
            via {sourceConfig.label}
          </span>
          {job.posted_at && (
            <span className="text-[10px] text-gray-600">· {formatDate(job.posted_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={(e) => { e.preventDefault(); onSave && onSave(job); }}
            className={`p-1.5 rounded-lg text-sm transition-all ${
              job.isSaved
                ? 'text-yellow-400 bg-yellow-500/10'
                : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10'
            }`}
            title={job.isSaved ? 'Unsave' : 'Save'}
          >
            {job.isSaved ? '⭐' : '☆'}
          </button>

          {/* Apply button */}
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (onApply) {
                // applyJob handler will redirect to login if needed
                onApply(job);
              }
            }}
            className="btn-apply flex items-center gap-1"
          >
            Apply Now →
          </a>
        </div>
      </div>
    </div>
  );
}
