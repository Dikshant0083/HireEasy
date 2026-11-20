import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auth, signInWithGoogle, getRedirectResult, signInWithEmailAndPassword } from '../firebase';
import { setUser, setRedirectAfterLogin } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthShell, { GoogleButton, OrDivider, firebaseMessage } from '../components/AuthShell';
import { Spinner } from '../components/ui';

async function syncUser(firebaseUser) {
  try {
    const res = await authAPI.getMe();
    return res.data.user;
  } catch {
    // First sign-in for this account: create the profile.
    const fd = new FormData();
    fd.append('idToken', await firebaseUser.getIdToken());
    fd.append('name', firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '');
    fd.append('provider', firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email');
    const res = await authAPI.syncUser(fd);
    return res.data.user;
  }
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
  const reason = location.state?.reason;

  const finish = async (firebaseUser) => {
    dispatch(setUser(await syncUser(firebaseUser)));
    dispatch(setRedirectAfterLogin(null));
    navigate(dest, { replace: true, state: { afterAuth: reason } });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      await finish(cred.user);
    } catch (err) {
      setError(firebaseMessage(err, 'Sign-in failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => result?.user && finish(result.user))
      .catch((err) => setError(firebaseMessage(err, 'Google sign-in failed.')));
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (result?.user) await finish(result.user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(firebaseMessage(err, 'Google sign-in failed.'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle={reason === 'apply'
        ? 'Sign in to apply. We’ll keep a record of every job you apply to.'
        : 'Welcome back. Pick up where you left off.'}
      footer={<>New to HireEasy? <Link to="/register" state={location.state} className="text-gray-800 underline-offset-4 hover:underline">Create an account</Link></>}
    >
      {error && <div className="alert-error mb-5" role="alert">{error}</div>}

      <GoogleButton onClick={handleGoogle} loading={googleLoading} />
      <OrDivider />

      <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input-field" placeholder="you@example.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input id="password" type="password" autoComplete="current-password" required className="input-field"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Spinner /> Signing in</> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
