import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { auth, signOut } from '../firebase';
import { Home, Briefcase, ListChecks, CalendarDays, FileText, LogOut, ChevronDown, Search } from 'lucide-react';
import { Logo } from './ui';

const LINKS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/applications', label: 'Applied', icon: ListChecks },
  { to: '/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/resume-builder', label: 'Resume', icon: FileText },
];

function NavSearch() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [q, setQ] = useState(location.pathname === '/jobs' ? params.get('q') || '' : '');

  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); navigate(`/jobs${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}
      className="relative hidden w-full max-w-[280px] lg:block"
    >
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search jobs, skills, companies"
        aria-label="Search jobs"
        className="h-9 w-full rounded-md border border-transparent bg-[#edf1f6] pl-9 pr-3 text-[13px] text-gray-900 placeholder-gray-500 outline-none transition focus:border-accent-500 focus:bg-white"
      />
    </form>
  );
}

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const esc = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menuOpen]);

  if (['/login', '/register'].includes(location.pathname)) return null;

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) {}
    dispatch(logout());
    navigate('/login');
  };

  const initials = (user?.name || user?.email || '?')
    .split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to={isAuthenticated ? '/dashboard' : '/jobs'} aria-label="HireEasy home" className="flex-shrink-0">
            <Logo />
          </Link>
          <NavSearch key={location.key} />

          <div className="ml-auto flex h-full items-center">
            {isAuthenticated ? (
              <>
                <nav className="hidden h-full items-stretch md:flex" aria-label="Main">
                  {LINKS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) => `flex w-[76px] flex-col items-center justify-center gap-0.5 border-b-2 text-xs transition-colors ${
                        isActive ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.75} />
                      {label}
                    </NavLink>
                  ))}
                </nav>

                <div className="relative ml-2 border-l border-[var(--line)] pl-3 md:h-10 md:self-center" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-gray-900"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white">{initials}</span>
                    <span className="hidden items-center md:flex">Me <ChevronDown size={12} /></span>
                  </button>

                  {menuOpen && (
                    <div role="menu" className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-xl animate-fade-in">
                      <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent-600 text-sm font-bold text-white">{initials}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                          <p className="truncate text-xs text-gray-500">{[user?.course, user?.degree].filter(Boolean).join(' · ') || user?.email}</p>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <Link to="/dashboard" role="menuitem" className="block rounded-md px-3 py-2 text-[13px] font-medium text-accent-700 hover:bg-accent-50">View profile</Link>
                        {LINKS.slice(1).map(({ to, label, icon: Icon }) => (
                          <Link key={to} to={to} role="menuitem" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 md:hidden">
                            <Icon size={15} className="text-gray-500" /> {label}
                          </Link>
                        ))}
                        <button onClick={handleLogout} role="menuitem" className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-100">
                          <LogOut size={15} className="text-gray-500" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink to="/jobs" className={({ isActive }) => `mr-2 hidden text-[13px] font-semibold sm:block ${isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Jobs</NavLink>
                <Link to="/login" className="btn-secondary btn-sm">Sign in</Link>
                <Link to="/register" className="btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-white md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="grid h-14 grid-cols-5">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-accent-700' : 'text-gray-500'}`}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
