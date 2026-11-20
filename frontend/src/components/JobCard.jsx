import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Wallet, Briefcase, Clock, Check, Globe } from 'lucide-react';
import { CompanyAvatar, MatchPill, SOURCE_NAMES, TYPE_NAMES, cleanText, timeAgo } from './ui';

const prettyType = (t = '') => t.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function JobCard({ job, onSave, onApply, showScore = true }) {
  const employment = job.type === 'job' ? prettyType(job.job_type || '') : TYPE_NAMES[job.type];
  const snippet = cleanText(job.description).replace(/\s+/g, ' ');

  return (
    <article className="glass-card-hover group relative p-5">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug text-gray-900 group-hover:text-accent-700">
            {/* Stretched link: the whole card opens the job, buttons below stay clickable. */}
            <Link to={`/jobs/${job._id}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">
              {job.title}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-[14px] font-medium text-gray-700">{job.company || 'Company not listed'}</p>
            {showScore && <MatchPill score={job.matchScore} />}
          </div>

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-gray-600">
            <li className="flex min-w-0 items-center gap-1.5">
              {job.is_remote ? <Globe size={15} className="text-gray-400" /> : <MapPin size={15} className="text-gray-400" />}
              <span className="max-w-[220px] truncate">{job.is_remote ? `Remote${job.location && !/remote/i.test(job.location) ? ` · ${job.location}` : ''}` : job.location || 'Location not listed'}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Wallet size={15} className="text-gray-400" />
              <span className="num max-w-[200px] truncate">{job.salary || 'Not disclosed'}</span>
            </li>
            {employment && (
              <li className="flex items-center gap-1.5"><Briefcase size={15} className="text-gray-400" /> {employment}</li>
            )}
          </ul>

          {snippet && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{snippet}</p>}

          {job.tags?.length > 0 && (
            <p className="mt-2.5 truncate text-[12px] text-gray-500">
              {job.tags.slice(0, 6).join('  ·  ')}
            </p>
          )}
        </div>

        <CompanyAvatar company={job.company} logo={job.company_logo} size={56} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-gray-500">
          <span className={`badge-${job.type || 'job'} hidden sm:inline-flex`}>{TYPE_NAMES[job.type] || 'Job'}</span>
          <Clock size={13} className="flex-shrink-0" />
          <span className="truncate">{job.posted_at ? timeAgo(job.posted_at) : 'Recently'} · via {SOURCE_NAMES[job.source] || job.source}</span>
        </div>
        <div className="relative z-10 flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSave?.(job)}
            className={`btn-ghost btn-sm ${job.isSaved ? 'text-accent-700' : ''}`}
            aria-pressed={!!job.isSaved}
          >
            <Bookmark size={15} fill={job.isSaved ? 'currentColor' : 'none'} /> {job.isSaved ? 'Saved' : 'Save'}
          </button>
          {job.isApplied ? (
            <span className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700"><Check size={13} /> Applied</span>
          ) : (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer" onClick={(e) => onApply?.(job, e)} className="btn-apply">
              Apply
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
