import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { auth, signOut } from '../firebase';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) {}
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'HE';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(8, 8, 16, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              HE
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              Hire<span className="text-purple-400">Easy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                🏠 Dashboard
              </Link>
              <Link to="/jobs" className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}>
                💼 Jobs
              </Link>
              <Link to="/applications" className={`nav-link ${isActive('/applications') ? 'active' : ''}`}>
                📋 Applications
              </Link>
              <Link to="/interviews" className={`nav-link ${isActive('/interviews') ? 'active' : ''}`}>
                📅 Interviews
              </Link>
              <Link to="/resume-builder" className={`nav-link ${isActive('/resume-builder') ? 'active' : ''}`}>
                📄 Resume
              </Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* User avatar */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                  >
                    {initials}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-12 w-56 glass-card shadow-2xl py-2 z-50"
                      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                      <div className="px-4 py-3 border-b border-purple-500/10">
                        <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
                        <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                        {user?.skills?.length > 0 && (
                          <p className="text-purple-400 text-xs mt-1">{user.skills.length} skills detected</p>
                        )}
                      </div>
                      <div className="py-1">
                        <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          🏠 Dashboard
                        </Link>
                        <Link to="/jobs" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          💼 Browse Jobs
                        </Link>
                        <Link to="/applications" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          📋 Applications
                        </Link>
                        <Link to="/interviews" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          📅 Interviews
                        </Link>
                        <Link to="/resume-builder" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          📄 Resume Builder
                        </Link>
                        <hr className="border-purple-500/10 my-1" />
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors w-full text-left">
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {isAuthenticated && (
          <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
            <Link to="/dashboard" className={`nav-link flex-shrink-0 text-center text-xs ${isActive('/dashboard') ? 'active' : ''}`}>🏠</Link>
            <Link to="/jobs" className={`nav-link flex-shrink-0 text-center text-xs ${isActive('/jobs') ? 'active' : ''}`}>💼 Jobs</Link>
            <Link to="/applications" className={`nav-link flex-shrink-0 text-center text-xs ${isActive('/applications') ? 'active' : ''}`}>📋</Link>
            <Link to="/interviews" className={`nav-link flex-shrink-0 text-center text-xs ${isActive('/interviews') ? 'active' : ''}`}>📅</Link>
            <Link to="/resume-builder" className={`nav-link flex-shrink-0 text-center text-xs ${isActive('/resume-builder') ? 'active' : ''}`}>📄</Link>
          </div>
        )}
      </div>

      {/* Backdrop for menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}
