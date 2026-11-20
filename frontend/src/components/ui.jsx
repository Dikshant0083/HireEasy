import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function Logo({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#2557d6" />
        <path d="M10 8v16M22 8v16M10 16h12" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      {!compact && <span className="text-[18px] font-bold tracking-tight text-gray-900">Hire<span className="text-accent-600">Easy</span></span>}
    </span>
  );
}

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-gray-600">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="glass-card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line-strong)] text-gray-600">
          <Icon size={18} strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-gray-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count !== undefined && <span className="num text-gray-500">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 'max-w-md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/40 p-0 animate-fade-in sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${width} max-h-[92vh] overflow-y-auto rounded-t-2xl border border-[var(--line-strong)] bg-[var(--panel)] shadow-2xl animate-slide-up sm:rounded-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Deterministic muted colour per company, so the same company always looks the same.
const AVATAR_TONES = [['#eaf0fd', '#1d4bb8'], ['#f3effd', '#5b3db5'], ['#e9f8f0', '#12784a'], ['#fff4e5', '#a15c07'], ['#fdecee', '#b42336'], ['#e7f6fa', '#0f6b85']];

export function CompanyAvatar({ company, logo, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const name = (company || '?').trim();
  const [bg, fg] = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  const box = { width: size, height: size };

  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt=""
        style={box}
        loading="lazy"
        className="flex-shrink-0 rounded-lg border border-[var(--line)] bg-white object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      style={{ ...box, background: bg, color: fg, fontSize: Math.round(size * 0.4) }}
      className="flex flex-shrink-0 items-center justify-center rounded-lg border border-black/[0.04] font-bold"
      aria-hidden="true"
    >
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
}

export function matchTone(score) {
  if (score >= 70) return { text: 'text-emerald-700', bar: 'bg-emerald-500', chip: 'bg-emerald-50', label: 'Strong match' };
  if (score >= 40) return { text: 'text-amber-700', bar: 'bg-amber-500', chip: 'bg-amber-50', label: 'Partial match' };
  return { text: 'text-gray-600', bar: 'bg-gray-400', chip: 'bg-gray-100', label: 'Low match' };
}

export function MatchPill({ score }) {
  if (score === null || score === undefined) return null;
  const tone = matchTone(score);
  return (
    <span className={`num inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${tone.chip} ${tone.text}`} title={`${tone.label}: based on how many of this listing's skills you have and how much of your skillset it uses`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.bar}`} />
      {score}% match
    </span>
  );
}

export function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

// Listing text can arrive entity-escaped ("&lt;p&gt;") or as raw HTML. Decode (at most twice),
// turn block ends into line breaks, and drop tags. DOMParser output is text only, nothing is rendered.
export function cleanText(input = '') {
  let t = String(input || '');
  for (let i = 0; i < 2 && /&[a-z#0-9]+;/i.test(t); i++) {
    t = new DOMParser().parseFromString(t, 'text/html').documentElement.textContent || '';
  }
  return t
    .replace(/<\/(p|li|h\d|div)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

export const SOURCE_NAMES = {
  remotive: 'Remotive',
  arbeitnow: 'Arbeitnow',
  themuse: 'The Muse',
  jsearch: 'JSearch',
  jooble: 'Jooble',
  scholarship: 'Curated',
  csv: 'Imported',
};

export const TYPE_NAMES = { job: 'Job', internship: 'Internship', scholarship: 'Scholarship' };
