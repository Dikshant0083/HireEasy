import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  auth, signInWithGoogle, getRedirectResult, signInWithEmailAndPassword,
} from '../firebase';
import { setUser } from '../store/authSlice';
import { authAPI } from '../services/api';

function GoogleButton({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#e5e7eb',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
  );
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { redirectAfterLogin } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const dest = redirectAfterLogin || location.state?.from || '/dashboard';

  const syncUser = async (firebaseUser) => {
    try {
      const res = await authAPI.getMe();
      return res.data.user;
    } catch {
      // First time Google user — create profile with defaults
      const idToken = await firebaseUser.getIdToken();
      const fd = new FormData();
      fd.append('idToken', idToken);
      fd.append('name', firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '');
      fd.append('provider', firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email');
      const res = await authAPI.syncUser(fd);
      return res.data.user;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = await syncUser(cred.user);
      dispatch(setUser(user));
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err.code === 'auth/user-not-found'
        ? 'No account found. Please register first.'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Try again later.'
        : err.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google redirect result (fires after redirect-based sign-in returns)
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result?.user) return;
      try {
        const user = await syncUser(result.user);
        dispatch(setUser(user));
        navigate(dest, { replace: true });
      } catch (err) {
        setError(err.message || 'Google sign-in failed');
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle(); // popup on localhost, redirect on prod
      if (result?.user) {
        // popup path (localhost)
        const user = await syncUser(result.user);
        dispatch(setUser(user));
        navigate(dest, { replace: true });
      }
      // redirect path: page will reload, getRedirectResult above handles it
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page-bg flex items-center justify-center px-4 min-h-screen">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            HE
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to continue your journey</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          <GoogleButton onClick={handleGoogle} loading={googleLoading} />

          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
              <input type="email" required className="input-field" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
              <input type="password" required className="input-field" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                : '✨ Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            New here?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">Create an account</Link>
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: '🌐', label: 'Live Jobs' },
            { icon: '📄', label: 'Resume Match' },
            { icon: '🏅', label: 'Scholarships' },
          ].map(f => (
            <div key={f.label} className="glass-card p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-gray-400 text-[10px]">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
