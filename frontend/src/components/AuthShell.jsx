import React from 'react';
import { Link } from 'react-router-dom';
import { Logo, Spinner } from './ui';

const POINTS = [
  ['One feed', 'Listings from Remotive, Arbeitnow, The Muse, JSearch and Jooble, plus curated scholarships.'],
  ['Honest matching', 'Each listing shows which of its skills you have and which you don’t.'],
  ['Everything tracked', 'Saved roles, applications and interview dates in one place.'],
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-[var(--canvas)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between bg-accent-700 p-10 text-white lg:flex">
        <Link to="/jobs" aria-label="HireEasy" className="inline-flex items-center gap-2 text-[18px] font-bold text-white"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#fff" /><path d="M10 8v16M22 8v16M10 16h12" stroke="#1d45ad" strokeWidth="3.2" strokeLinecap="round" /></svg>HireEasy</Link>
        <div className="max-w-md">
          <h2 className="text-[30px] font-bold leading-tight text-white">Find work that fits what you already know.</h2>
          <dl className="mt-10 space-y-6">
            {POINTS.map(([t, d]) => (
              <div key={t} className="border-l-2 border-white/30 pl-4">
                <dt className="text-[14px] font-semibold text-white">{t}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-white/75">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} HireEasy</p>
      </aside>

      <main className="flex items-center justify-center bg-white px-5 py-12">
        <div className="w-full max-w-[380px] animate-slide-up">
          <Link to="/jobs" className="mb-10 inline-block lg:hidden" aria-label="HireEasy"><Logo /></Link>
          <h1 className="text-[22px] font-semibold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[13px] text-gray-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-8 text-[13px] text-gray-500">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

export function GoogleButton({ onClick, loading, text = 'Continue with Google' }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="btn-secondary w-full">
      {loading ? <Spinner className="text-gray-600" /> : (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
      )}
      {text}
    </button>
  );
}

export function OrDivider({ label = 'or' }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="divider flex-1" />
      <span className="text-xs text-gray-400">{label}</span>
      <div className="divider flex-1" />
    </div>
  );
}

export function firebaseMessage(err, fallback) {
  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account uses this email. Create one instead.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
    'auth/email-already-in-use': 'An account already uses this email. Sign in instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
  };
  return map[err?.code] || err?.response?.data?.message || fallback;
}
